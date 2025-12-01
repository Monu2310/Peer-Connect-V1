import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../core/AuthContext';
import io from 'socket.io-client';
import { API_URL } from '../api/config';
import axios from 'axios';
import { sendActivityMessage, getActivityMessages } from '../api/messageService';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { Link } from 'react-router-dom';

// Create a shared socket instance at the module level
let sharedSocket = null;

const ActivityGroupChat = ({ activityId, hasJoined, currentUser: parentCurrentUser, isReadOnly }) => {
  const { currentUser: authCurrentUser, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const [hasJoinedActivity, setHasJoinedActivity] = useState(false);
  const [isCheckingParticipation, setIsCheckingParticipation] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const messagesEndRef = useRef(null);
  const socketRef = useRef(null);
  
  // Use the current user from props or from auth context
  const currentUser = parentCurrentUser || authCurrentUser;
  
  // Create a unique room ID for this activity's group chat
  const roomId = `activity-${activityId}`;
  
  // Local storage keys for caching messages and participation status
  const messagesKey = `activity_messages_${activityId}`;
  const participationKey = `activity_joined_${activityId}`;

  // Function to check if a message is from the current user
  const isCurrentUser = (message) => {
    if (!message || !message.sender || !currentUser) return false;
    
    const senderId = String(message.sender.id || message.sender._id || message.sender);
    const userId = String(currentUser.id || currentUser._id);
    
    return senderId === userId;
  };

  // Check if user has joined activity (prioritizing props, then localStorage, then API)
  useEffect(() => {
    // PRIORITY 1: Check if hasJoined prop is explicitly provided (instant, no delay)
    if (hasJoined !== undefined && hasJoined !== null) {
      setHasJoinedActivity(Boolean(hasJoined));
      setIsCheckingParticipation(false);
      localStorage.setItem(participationKey, String(hasJoined));
      return; // EXIT - no API call needed
    }
    
    // PRIORITY 2: Check localStorage for cached state (very fast, ~1ms)
    const savedStatus = localStorage.getItem(participationKey);
    if (savedStatus !== null) {
      setHasJoinedActivity(savedStatus === 'true');
      setIsCheckingParticipation(false);
      return; // EXIT - no API call needed
    }
    
    // PRIORITY 3: Last resort - check with API (slow, 200-500ms)
    const checkParticipation = async () => {
      if (!currentUser?.id || !activityId) {
        setIsCheckingParticipation(false);
        return;
      }
      
      try {
        const response = await axios.get(`${API_URL}/api/activities/${activityId}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        const activity = response.data;
        const isParticipant = Array.isArray(activity.participants) && 
          activity.participants.some(p => {
            const participantId = p._id || p.id || p;
            const currentUserId = currentUser.id || currentUser._id;
            return participantId === currentUserId || participantId.toString() === currentUserId.toString();
          });
        
        if (isParticipant) {
          setHasJoinedActivity(true);
          localStorage.setItem(participationKey, 'true');
        }
      } catch (err) {
        console.error("Error checking participation:", err);
      } finally {
        setIsCheckingParticipation(false);
      }
    };
    
    checkParticipation();
  }, [activityId, currentUser, token, hasJoined, participationKey]);

  // Load cached messages from localStorage
  useEffect(() => {
    try {
      const savedMessages = localStorage.getItem(messagesKey);
      if (savedMessages) {
        const parsed = JSON.parse(savedMessages);
        if (Array.isArray(parsed) && parsed.length > 0) {
          setMessages(parsed);
        }
      }
    } catch (err) {
      console.error("Error loading cached messages:", err);
    }
  }, [messagesKey]);

  // Initialize socket connection once
  useEffect(() => {
    // Don't try to connect if user hasn't joined
    if ((!hasJoinedActivity && !isCheckingParticipation) && !hasJoined) {
      return;
    }

    // Initialize socket if no global instance exists
    if (!sharedSocket) {
      const authToken = token || localStorage.getItem('token');
      
      sharedSocket = io(API_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
        timeout: 10000,
        query: {
          userId: currentUser?.id,
          token: authToken
        }
      });
    }
    
    // Store reference to shared socket in ref
    socketRef.current = sharedSocket;
    
    // Connect to the socket if not already connected
    if (!socketRef.current.connected) {
      socketRef.current.connect();
    } else {
      setIsConnected(true);
      setConnectionError(false);
    }
    
    // Handle socket connection events
    const handleConnect = () => {
      setIsConnected(true);
      setConnectionError(false);
      setLoadingMessages(true);
      
      // Join the activity chat room
      socketRef.current.emit('join-activity-room', {
        roomId,
        userId: currentUser?.id,
        username: currentUser?.username || currentUser?.name || currentUser?.email || "User"
      }, (response) => {
        // Get existing messages (regardless of join confirmation)
        fetchMessages();
      });
    };
    
    const fetchMessages = () => {
      // Set a timeout to prevent infinite loading state
      const messageLoadingTimeout = setTimeout(() => {
        setLoadingMessages(false);
        setMessages(prevMessages => {
          if (prevMessages.length === 0) {
            // Add a system message if we have no messages
            return [{
              _id: `system-${Date.now()}`,
              content: "Couldn't load messages. Please try refreshing the page.",
              sender: { id: 'system', username: 'System' },
              timestamp: new Date().toISOString(),
              isSystem: true
            }];
          }
          return prevMessages;
        });
      }, 8000); // 8 seconds timeout
      
      // First try socket method
      socketRef.current.emit('get-activity-messages', roomId, (response) => {
        clearTimeout(messageLoadingTimeout);
        setLoadingMessages(false);
        
        if (response && response.success && Array.isArray(response.messages)) {
          setMessages(response.messages);
          // Cache messages
          localStorage.setItem(messagesKey, JSON.stringify(response.messages));
        } else {
          // Fallback to REST API if socket fails
          fallbackToRestApi();
        }
      });
    };
    
    const fallbackToRestApi = async () => {
      try {
        const msgs = await getActivityMessages(activityId);
        if (Array.isArray(msgs)) {
          setMessages(msgs);
          localStorage.setItem(messagesKey, JSON.stringify(msgs));
        }
      } catch (err) {
        console.error("Failed to fetch messages via REST:", err);
      } finally {
        setLoadingMessages(false);
      }
    };

    const handleDisconnect = () => {
      setIsConnected(false);
    };

    const handleConnectError = (err) => {
      console.error("Socket connection error:", err);
      setConnectionError(true);
      setIsConnected(false);
    };

    const handleNewMessage = (message) => {
      if (message && message.activity === activityId) {
        setMessages((prevMessages) => {
          // Check if message already exists to prevent duplicates
          const exists = prevMessages.some(m => m._id === message._id);
          if (exists) return prevMessages;
          
          const newMessages = [...prevMessages, message];
          // Update cache
          localStorage.setItem(messagesKey, JSON.stringify(newMessages));
          return newMessages;
        });
      }
    };

    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('new-activity-message', handleNewMessage);

    // If already connected, manually trigger join
    if (socketRef.current.connected) {
      handleConnect();
    }

    return () => {
      if (socketRef.current) {
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('connect_error', handleConnectError);
        socketRef.current.off('new-activity-message', handleNewMessage);
        
        // Leave the room when component unmounts
        socketRef.current.emit('leave-activity-room', { roomId, userId: currentUser?.id });
      }
    };
  }, [roomId, currentUser, activityId, hasJoinedActivity, hasJoined, isCheckingParticipation, messagesKey, token]);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !currentUser || isReadOnly) return;

    const messageContent = newMessage.trim();
    setNewMessage(''); // Clear input immediately for better UX

    // Optimistic update
    const tempId = `temp-${Date.now()}`;
    const optimisticMessage = {
      _id: tempId,
      content: messageContent,
      sender: {
        _id: currentUser.id || currentUser._id,
        username: currentUser.username || currentUser.name,
        profilePicture: currentUser.profilePicture
      },
      activity: activityId,
      timestamp: new Date().toISOString(),
      isOptimistic: true
    };

    setMessages(prev => [...prev, optimisticMessage]);

    try {
      // Try sending via socket first
      if (socketRef.current && socketRef.current.connected) {
        socketRef.current.emit('send-activity-message', {
          activityId,
          content: messageContent,
          senderId: currentUser.id || currentUser._id
        }, (response) => {
          if (!response || !response.success) {
            // If socket send fails, try REST API
            sendViaRest(messageContent, tempId);
          } else {
            // Replace optimistic message with real one
            setMessages(prev => prev.map(m => m._id === tempId ? response.message : m));
          }
        });
      } else {
        // If socket not connected, use REST API
        await sendViaRest(messageContent, tempId);
      }
    } catch (err) {
      console.error("Error sending message:", err);
      // Mark message as failed
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, error: true } : m));
    }
  };

  const sendViaRest = async (content, tempId) => {
    try {
      const response = await sendActivityMessage(activityId, content);
      setMessages(prev => prev.map(m => m._id === tempId ? response : m));
    } catch (err) {
      console.error("REST API send failed:", err);
      setMessages(prev => prev.map(m => m._id === tempId ? { ...m, error: true } : m));
    }
  };

  if (isCheckingParticipation) {
    return (
      <div className="flex justify-center items-center h-64 bg-muted/30">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!hasJoinedActivity && !hasJoined) {
    return (
      <div className="flex flex-col items-center justify-center h-64 bg-muted/30 p-6 text-center">
        <AlertCircle className="h-10 w-10 text-muted-foreground mb-2" />
        <h3 className="text-lg font-semibold">Join to Chat</h3>
        <p className="text-muted-foreground">You need to join this activity to view and send messages.</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[600px] bg-background">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
        {loadingMessages && messages.length === 0 ? (
          <div className="flex justify-center items-center h-full">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-muted-foreground bg-card/80 dark:bg-card/80 rounded-xl p-4 m-4 backdrop-blur-sm">
            <p>No messages yet. Be the first to say hello!</p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isMe = isCurrentUser(msg);
            const isSystem = msg.isSystem;
            const showSenderInfo = !isMe && !isSystem && (index === 0 || messages[index - 1].sender?._id !== msg.sender?._id);
            
            if (isSystem) {
              return (
                <div key={msg._id || index} className="flex justify-center my-2">
                  <span className="bg-muted dark:bg-muted text-xs text-muted-foreground px-3 py-1 rounded-full shadow-sm">
                    {msg.content}
                  </span>
                </div>
              );
            }

            return (
              <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'} mb-1 group`}>
                {!isMe && (
                  <div className={`flex flex-col justify-end mr-2 ${!showSenderInfo ? 'invisible' : ''}`}>
                    <Link to={`/profile/${msg.sender?._id || msg.sender?.id}`}>
                      <Avatar className="h-8 w-8 cursor-pointer hover:opacity-80 ring-2 ring-background">
                        <AvatarImage src={msg.sender?.profilePicture} />
                        <AvatarFallback className="bg-primary/20 text-primary text-xs">
                          {msg.sender?.username?.[0]?.toUpperCase() || '?'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                  </div>
                )}
                
                <div className={`max-w-[75%] flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
                  {showSenderInfo && (
                    <Link 
                      to={`/profile/${msg.sender?._id || msg.sender?.id}`}
                      className="text-xs font-medium text-muted-foreground mb-1 ml-1 hover:underline"
                    >
                      {msg.sender?.username || 'Unknown User'}
                    </Link>
                  )}
                  
                  <div className={`px-3 py-2 shadow-sm relative text-sm ${
                    isMe 
                      ? 'bg-primary text-primary-foreground rounded-2xl rounded-tr-none' 
                      : 'bg-card dark:bg-card text-foreground dark:text-foreground rounded-2xl rounded-tl-none'
                  } ${msg.error ? 'opacity-70 border border-red-500' : ''}`}>
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{msg.content}</p>
                    <div className={`text-[10px] flex items-center justify-end gap-1 mt-1 ${isMe ? 'text-primary-foreground/70' : 'text-muted-foreground'}`}>
                      <span>
                        {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      {isMe && (
                        <span className="ml-0.5">
                          {msg.isOptimistic ? (
                            <ClockIcon className="h-3 w-3" />
                          ) : (
                            <CheckIcon className="h-3 w-3" />
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                  {msg.error && (
                    <span className="text-xs text-red-500 mt-1">Failed to send</span>
                  )}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="p-3 bg-muted/30 dark:bg-muted/10 border-t border-border/50">
        {isReadOnly ? (
          <div className="text-center py-3 bg-muted/50 dark:bg-muted/20 rounded-lg text-muted-foreground text-sm font-medium">
            This activity has ended. Chat is read-only.
          </div>
        ) : (
          <form onSubmit={handleSendMessage} className="flex items-center gap-2">
            <Input
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 bg-card dark:bg-card/50 border-none focus-visible:ring-0 focus-visible:ring-offset-0 rounded-full px-4 py-6"
              disabled={!isConnected && !messages.length}
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-primary hover:bg-primary/90 text-primary-foreground shrink-0"
              disabled={!newMessage.trim() || (!isConnected && !messages.length)}
            >
              {(!isConnected && !messages.length) ? (
                <Loader2 className="h-5 w-5 animate-spin" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
};

// Helper icons
const ClockIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <circle cx="12" cy="12" r="10" />
    <polyline points="12 6 12 12 16 14" />
  </svg>
);

const CheckIcon = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

export default ActivityGroupChat;