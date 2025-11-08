import React, { useEffect, useState, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../core/AuthContext';
import { getMessages, sendMessage } from '../api/messageService';
import { getUserProfile } from '../api/userService';
import io from 'socket.io-client';
import { API_URL } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Loader2, MessageSquare, ArrowLeft } from 'lucide-react';

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

  // Room ID for socket.io (combination of both user IDs, sorted and joined)
  const roomId = [currentUser._id, userId].sort().join('-');

  useEffect(() => {
    // Initialize socket connection
    socketRef.current = io(API_URL);
    
    // Join room for this specific conversation
    socketRef.current.emit('join-room', roomId);
    
    // Listen for incoming messages (only add if it's from the other user)
    socketRef.current.on('receive-message', (message) => {
      // Only add message if it's from the other person, not us
      if (message.sender !== currentUser._id) {
        setMessages(prevMessages => [...prevMessages, message]);
      }
    });
    
    // Listen for typing indicator
    socketRef.current.on('typing', (data) => {
      if (data.userId !== currentUser._id) {
        setIsTyping(true);
        // Clear typing indicator after 3 seconds
        setTimeout(() => setIsTyping(false), 3000);
      }
    });

    // Load conversation data
    const loadConversation = async () => {
      try {
        // Get recipient user details
        const recipientData = await getUserProfile(userId);
        setRecipient(recipientData);
        
        // Get message history
        const messagesData = await getMessages(userId);
        console.log('💬 Loaded messages:', messagesData.length);
        console.log('👤 Current user ID:', currentUser._id || currentUser.id);
        if (messagesData.length > 0) {
          console.log('📋 Sample message sender:', messagesData[0].sender);
        }
        setMessages(messagesData);
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
      socketRef.current.disconnect();
    };
  }, [currentUser._id, userId, roomId]);
  
  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);
  
  const handleTyping = () => {
    socketRef.current.emit('typing', {
      roomId,
      userId: currentUser._id
    });
  };
  
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
        createdAt: new Date().toISOString()
      };
      
      setMessages(prev => [...prev, optimisticMessage]);
      
      // Clear message input
      setNewMessage('');
      
      // Send message via API (this will return the real message with real _id)
      const sentMessage = await sendMessage(userId, newMessage);
      
      // Replace temp message with real message from server
      setMessages(prev => prev.map(msg => 
        msg._id === tempId ? sentMessage : msg
      ));
      
      // Emit message through socket (server will broadcast to recipient only)
      socketRef.current.emit('send-message', sentMessage);
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
    <div className="fixed inset-0 flex flex-col bg-[#FFF8D4] dark:bg-background">
      {/* Header - FIXED at Top with Cream/Blue colors */}
      <div className="bg-gradient-to-r from-secondary via-secondary to-foreground dark:from-foreground dark:to-secondary border-b-2 border-primary/20 px-4 py-3.5 flex items-center shadow-lg z-10">
        {/* Back Button */}
        <Button
          onClick={() => navigate('/messages')}
          variant="ghost"
          size="icon"
          className="h-9 w-9 rounded-full hover:bg-white/20 text-white mr-2 flex-shrink-0"
        >
          <ArrowLeft className="h-5 w-5" />
        </Button>
        
        {/* Avatar */}
        <Avatar className="h-11 w-11 ring-2 ring-white/40 shadow-md">
          <AvatarImage src={recipient?.profilePicture || '/avatar.svg'} />
          <AvatarFallback className="bg-white/25 text-white font-bold text-base">
            {recipient?.username.charAt(0).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        
        {/* User Info */}
        <div className="ml-3 flex-1 min-w-0">
          <h1 className="text-lg font-bold text-white truncate drop-shadow-sm">{recipient?.username}</h1>
          {isTyping && (
            <p className="text-xs text-white/90 animate-pulse mt-0.5 font-medium">typing...</p>
          )}
        </div>
      </div>
      
      {/* Messages Container - SCROLLABLE ONLY - Beautiful Cream Background */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden px-4 py-4 bg-[#FFF8D4]/50 dark:bg-[#313647]"
           style={{ 
             minHeight: 0,
             maxHeight: '100%',
             overscrollBehavior: 'contain'
           }}
      >
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              key="no-messages"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center justify-center h-full text-center py-12"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 flex items-center justify-center mb-4">
                <MessageSquare className="h-8 w-8 text-secondary" />
              </div>
              <p className="text-base font-semibold text-foreground mb-1">No messages yet</p>
              <p className="text-sm text-muted-foreground">Send a message to start the conversation</p>
            </motion.div>
          ) : (
            messages.map((message, index) => {
              // Robust sender comparison - handle both object and string IDs
              const senderId = typeof message.sender === 'object' ? message.sender._id : message.sender;
              const isOwn = senderId === currentUser._id || senderId === currentUser.id;
              const messageDate = new Date(message.createdAt);
              const isValidDate = !isNaN(messageDate.getTime());
              const previousMessage = index > 0 ? messages[index - 1] : null;
              const showDateSeparator = shouldShowDateSeparator(message, previousMessage);
              
              return (
                <React.Fragment key={message._id}>
                  {/* WhatsApp-style Date Separator with Cream/Blue */}
                  {showDateSeparator && isValidDate && (
                    <div className="flex justify-center my-4">
                      <div className="bg-white dark:bg-foreground text-secondary dark:text-white text-xs font-semibold px-4 py-1.5 rounded-full shadow-md border border-secondary/20">
                        {formatDateSeparator(message.createdAt)}
                      </div>
                    </div>
                  )}
                  
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.2 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'} mb-1.5`}
                  >
                    {/* Show recipient avatar on left for their messages */}
                    {!isOwn && (
                      <Avatar className="h-8 w-8 mr-2 flex-shrink-0 self-end ring-2 ring-border">
                        <AvatarImage src={recipient?.profilePicture || '/avatar.svg'} />
                        <AvatarFallback className="bg-secondary/30 text-secondary dark:text-white text-xs font-bold">
                          {recipient?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    
                    <div 
                      className={`relative px-3.5 py-2.5 rounded-2xl max-w-[70%] sm:max-w-md break-words shadow-md ${
                        isOwn 
                          ? 'bg-secondary text-white rounded-br-none' 
                          : 'bg-white dark:bg-card text-foreground border-2 border-secondary/20 dark:border-primary/20 rounded-bl-none'
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {isValidDate && (
                        <div className={`text-[10px] mt-1 font-medium ${
                          isOwn 
                            ? 'text-white/80 text-right' 
                            : 'text-muted-foreground text-right'
                        }`}>
                          {messageDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      )}
                    </div>
                    
                    {/* Show user avatar on right for own messages */}
                    {isOwn && (
                      <Avatar className="h-8 w-8 ml-2 flex-shrink-0 self-end ring-2 ring-secondary/40">
                        <AvatarImage src={currentUser?.profilePicture || '/avatar.svg'} />
                        <AvatarFallback className="bg-secondary text-white text-xs font-bold">
                          {currentUser?.username?.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    )}
                  </motion.div>
                </React.Fragment>
              );
            })
          )}
        </AnimatePresence>
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message Input - FIXED at Bottom with Cream/Blue */}
      <div className="border-t-2 border-primary/20 bg-white dark:bg-card shadow-2xl z-10">
        <form onSubmit={handleSubmit} className="flex items-center gap-3 px-4 py-3.5">
          <Input
            type="text"
            placeholder="Type a message..."
            className="flex-1 h-12 text-sm bg-[#FFF8D4]/80 dark:bg-background text-foreground border-2 border-secondary/30 focus:border-secondary focus:ring-2 focus:ring-secondary/40 rounded-full px-5 placeholder:text-foreground/50 transition-all duration-200 shadow-sm"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleTyping}
          />
          <Button 
            type="submit"
            className="h-12 w-12 rounded-full bg-secondary hover:bg-foreground hover:scale-105 text-white shadow-lg hover:shadow-xl transition-all duration-200 flex-shrink-0 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            disabled={!newMessage.trim()}
          >
            <Send className="h-5 w-5" />
          </Button>
        </form>
      </div>
    </div>
  );
};

export default Conversation;
