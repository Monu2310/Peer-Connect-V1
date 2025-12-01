import React, { useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import { getMessages, sendMessage, markAsRead } from '../api/messageService';
import { getUserProfile } from '../api/userService';
import { useDebounce } from '../hooks/performanceHooks';
import io from 'socket.io-client';
import { API_URL } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Loader2, MessageSquare, ArrowLeft, Check, CheckCheck } from 'lucide-react';

const Conversation = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [recipient, setRecipient] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const messagesEndRef = useRef(null);
  const socketRef = useRef();
  const typingTimeoutRef = useRef(null);

  // Room ID for socket.io (combination of both user IDs, sorted and joined)
  // Use id or _id depending on what's available in the user object
  const currentUserId = currentUser?.id || currentUser?._id;
  const roomId = [currentUserId, userId].sort().join('-');

  useEffect(() => {
    // Initialize socket connection
    if (!currentUser || !currentUserId) return;

    socketRef.current = io(API_URL, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });
    
    // Join room for this specific conversation
    socketRef.current.emit('join-room', roomId);
    
    // Listen for incoming messages (only add if it's from the other user)
    socketRef.current.on('receive-message', (message) => {
      // Only add message if it's from the other person, not us
      if (message.sender !== currentUserId) {
        setMessages(prevMessages => [...prevMessages, message]);
        // Mark as read immediately when receiving while in conversation
        markAsRead(userId);
      }
    });
    
    // Listen for typing indicator
    socketRef.current.on('typing', (data) => {
      if (data.userId !== currentUserId) {
        setIsTyping(true);
        // Clear any existing timeout and schedule hide
        if (typingTimeoutRef.current) {
          clearTimeout(typingTimeoutRef.current);
        }
        typingTimeoutRef.current = setTimeout(() => setIsTyping(false), 2000);
      }
    });

    // Load conversation data
    const loadConversation = async () => {
      try {
        setLoading(true);
        
        // Get recipient user details
        try {
          const recipientData = await getUserProfile(userId);
          if (recipientData) {
            setRecipient(recipientData);
          }
        } catch (profileErr) {
          console.error('Error fetching profile:', profileErr);
          // Fallback recipient if profile fetch fails
          setRecipient({ username: 'User', _id: userId });
        }
        
        // Get message history
        const messagesData = await getMessages(userId);
        setMessages(messagesData);
        
        // Mark messages as read when opening conversation
        await markAsRead(userId);
        
        setLoading(false);
      } catch (err) {
        console.error('Error loading conversation:', err);
        setError('Failed to load conversation');
        setLoading(false);
      }
    };
    
  loadConversation();
    
    // Clean up socket connection when component unmounts
    return () => {
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
      if (socketRef.current) {
        socketRef.current.off('receive-message');
        socketRef.current.off('typing');
        socketRef.current.disconnect();
      }
    };
  }, [currentUser, userId, roomId]);
  
  // Scroll to bottom when messages change, but only if user is near the bottom
  useEffect(() => {
    const container = messagesEndRef.current?.parentElement;
    if (!container) return;

    const { scrollTop, scrollHeight, clientHeight } = container;
    const isNearBottom = scrollHeight - (scrollTop + clientHeight) < 80;

    if (isNearBottom) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);
  
  // Debounced typing indicator - only emits once per 500ms instead of every keystroke
  const [typingValue, setTypingValue] = useState('');
  const debouncedTyping = useDebounce(typingValue, 500);
  
  useEffect(() => {
    if (debouncedTyping && socketRef.current && currentUser?._id) {
      socketRef.current.emit('typing', {
        roomId,
        userId: currentUser._id
      });
    }
  }, [debouncedTyping, roomId, currentUser]);
  
  const handleTyping = useCallback(() => {
    setTypingValue(Date.now().toString());
  }, []);
  
  // Helper function to format date separators
  const formatDateSeparator = (date) => {
    const messageDate = new Date(date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    // Reset time for comparison
    const resetTime = (d) => new Date(d.getFullYear(), d.getMonth(), d.getDate());
    const messageDateOnly = resetTime(messageDate);
    const todayOnly = resetTime(today);
    const yesterdayOnly = resetTime(yesterday);
    
    if (messageDateOnly.getTime() === todayOnly.getTime()) {
      return 'Today';
    } else if (messageDateOnly.getTime() === yesterdayOnly.getTime()) {
      return 'Yesterday';
    } else {
      return messageDate.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: messageDate.getFullYear() !== today.getFullYear() ? 'numeric' : undefined 
      });
    }
  };

  // Helper function to check if we need a date separator
  const shouldShowDateSeparator = (currentMsg, previousMsg) => {
    if (!previousMsg) return true;
    
    const currentDate = new Date(currentMsg.createdAt);
    const previousDate = new Date(previousMsg.createdAt);
    
    return currentDate.toDateString() !== previousDate.toDateString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const tempId = `temp-${Date.now()}`;
      const messageData = {
        content: newMessage,
        sender: currentUser._id,
        recipient: userId,
        roomId
      };
      
      // Add message to UI immediately with temp ID
      const optimisticMessage = { 
        ...messageData, 
        _id: tempId,
        createdAt: new Date().toISOString(),
        read: false,
        pending: true
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear message input
      setNewMessage('');
      
      // Send message via API (this will return the real message with real _id)
      // Server will broadcast via Socket.IO after saving, no need to emit here
      const sentMessage = await sendMessage(userId, newMessage);
      
      // Replace temp message with real message from server
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? { ...sentMessage, pending: false } : msg
      ));
    } catch (err) {
      console.error('Error sending message:', err);
      // Remove failed message from UI
      setMessages(prev => prev.filter(msg => !msg._id.startsWith('temp-')));
    }
  };
  
  if (loading) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-3">
        <div className="relative">
          <Loader2 className="h-9 w-9 animate-spin text-secondary" />
          <div className="absolute inset-0 animate-ping opacity-20">
            <Loader2 className="h-9 w-9 text-secondary" />
          </div>
        </div>
        <p className="text-sm font-medium text-muted-foreground">Loading conversation...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-6 max-w-md text-center">
        <h2 className="text-lg font-semibold text-destructive mb-2">Error</h2>
        <p className="text-sm text-destructive/80">{error}</p>
      </div>
    </div>
  );

  return (
    <div className="fixed left-0 right-0 bottom-0 top-16 md:top-20 flex flex-col bg-background">
      {/* Header - WhatsApp style but with project theme */}
      <div className="flex-none px-4 py-3 bg-card/90 backdrop-blur-md border-b border-border flex items-center gap-3 shadow-sm z-20">
        <Button
          onClick={() => navigate('/messages')}
          variant="ghost"
          size="icon"
          className="h-10 w-10 rounded-full hover:bg-muted text-muted-foreground -ml-2"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        <div className="relative">
          {loading && !recipient ? (
            <div className="h-10 w-10 rounded-full bg-muted animate-pulse" />
          ) : (
            <Avatar className="h-10 w-10 ring-2 ring-background shadow-sm">
              <AvatarImage src={recipient?.profilePicture || '/avatar.svg'} />
              <AvatarFallback className="bg-primary/10 text-primary font-bold">
                {recipient?.username ? recipient.username.charAt(0).toUpperCase() : 'U'}
              </AvatarFallback>
            </Avatar>
          )}
        </div>
        
        <div className="flex-1 min-w-0 flex flex-col justify-center">
          {loading && !recipient ? (
            <div className="h-4 w-32 bg-muted animate-pulse rounded mb-1" />
          ) : (
            <h1 className="text-base font-semibold text-foreground truncate leading-none mb-1">
              {recipient?.username || 'User'}
            </h1>
          )}
          
          {isTyping ? (
            <p className="text-xs text-primary font-medium animate-pulse">typing...</p>
          ) : (
            <p className="text-xs text-muted-foreground truncate">
              {loading ? 'Loading...' : 'Online'}
            </p>
          )}
        </div>
      </div>
      
      {/* Messages Container */}
      <div 
        className="flex-1 overflow-y-auto overflow-x-hidden p-4 bg-background"
        style={{ 
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(163, 176, 135, 0.1) 0%, transparent 50%)', // Subtle sage glow
          backgroundAttachment: 'fixed'
        }}
      >
        <div className="flex flex-col justify-end min-h-full space-y-1 pb-2">
          <AnimatePresence initial={false}>
            {messages.length === 0 && !loading ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center flex-1 py-12 opacity-50"
              >
                <div className="w-24 h-24 rounded-full bg-muted/50 flex items-center justify-center mb-4">
                  <MessageSquare className="h-10 w-10 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No messages yet</p>
              </motion.div>
            ) : (
              messages.map((message, index) => {
                const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
                const isOwn = senderId === currentUser._id || senderId === currentUser.id;
                const messageDate = new Date(message.createdAt);
                const isValidDate = !isNaN(messageDate.getTime());
                const previousMessage = index > 0 ? messages[index - 1] : null;
                const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
                
                // Check if previous message was from same sender to group them
                const isSequence = previousMessage && 
                  (typeof previousMessage.sender === 'object' ? previousMessage.sender._id : previousMessage.sender) === senderId &&
                  !showDateSeparator;

                return (
                  <React.Fragment key={message._id}>
                    {showDateSeparator && isValidDate && (
                      <div className="flex justify-center my-6 sticky top-2 z-10">
                        <span className="bg-muted/80 backdrop-blur-sm text-muted-foreground text-[11px] font-medium px-3 py-1 rounded-full shadow-sm border border-border/50">
                          {formatDateSeparator(message.createdAt)}
                        </span>
                      </div>
                    )}
                    
                    <motion.div 
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className={`flex ${isOwn ? 'justify-end' : 'justify-start'} group`}
                    >
                      <div 
                        className={`
                          relative px-3 py-1.5 max-w-[75%] sm:max-w-[65%] break-words shadow-sm text-[15px] leading-relaxed
                          ${isOwn 
                            ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-sm' 
                            : 'bg-card text-card-foreground border border-border/50 rounded-2xl rounded-tl-sm'
                          }
                          ${isSequence ? (isOwn ? 'mt-0.5 rounded-tr-2xl' : 'mt-0.5 rounded-tl-2xl') : 'mt-2'}
                        `}
                      >
                        <div className="flex flex-wrap items-end gap-x-2">
                          <span>{message.content}</span>
                          <div className={`text-[10px] flex items-center gap-0.5 h-4 select-none ${
                            isOwn ? 'text-primary-foreground/70' : 'text-muted-foreground/70'
                          } ml-auto`}>
                            <span>
                              {isValidDate && messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                            {isOwn && (
                              message.pending ? (
                                <Check className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
                              ) : (
                                message.read ? (
                                  <CheckCheck className="w-3.5 h-3.5 text-blue-200" strokeWidth={2.5} />
                                ) : (
                                  <CheckCheck className="w-3.5 h-3.5 opacity-70" strokeWidth={2} />
                                )
                              )
                            )}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  </React.Fragment>
                );
              })
            )}
          </AnimatePresence>
          <div ref={messagesEndRef} />
        </div>
      </div>
      
      {/* Input Area */}
      <div className="flex-none p-3 bg-card/90 backdrop-blur-md border-t border-border z-20">
        <form onSubmit={handleSubmit} className="flex items-end gap-2 max-w-4xl mx-auto">
          <div className="flex-1 bg-muted/50 rounded-3xl border border-transparent focus-within:border-primary/30 focus-within:bg-background transition-all duration-200 flex items-center">
            <Input
              type="text"
              placeholder="Type a message..."
              className="border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 px-4 py-3 min-h-[48px] max-h-32"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyDown={(e) => {
                handleTyping();
              }}
            />
          </div>
          <Button 
            type="submit"
            size="icon"
            className={`h-12 w-12 rounded-full shadow-md transition-all duration-200 ${
              newMessage.trim() 
                ? 'bg-primary text-primary-foreground hover:bg-primary/90 hover:scale-105' 
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            }`}
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5 ml-0.5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
