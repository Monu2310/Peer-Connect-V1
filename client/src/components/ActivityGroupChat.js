import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { API_URL } from '../api/config';
import axios from 'axios';
import { sendActivityMessage, getActivityMessages } from '../api/messageService';

// Create a shared socket instance at the module level
let sharedSocket = null;

const ActivityGroupChat = ({ activityId, activityTitle, hasJoined, currentUser: parentCurrentUser }) => {
  const { currentUser: authCurrentUser, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
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
    
    // Log sender and user IDs for debugging
    console.log('Message Sender ID:', senderId, 'Current User ID:', userId);
    
    return senderId === userId;
  };

  // Check if user has joined activity (prioritizing props, then localStorage)
  useEffect(() => {
    // First check if hasJoined prop is provided (fastest path)
    if (hasJoined === true) {
      setHasJoinedActivity(true);
      setIsCheckingParticipation(false);
      localStorage.setItem(participationKey, 'true');
      return;
    }
    
    // Next check localStorage for previously saved state
    const savedStatus = localStorage.getItem(participationKey);
    if (savedStatus === 'true') {
      setHasJoinedActivity(true);
      setIsCheckingParticipation(false);
      return;
    }
    
    // Last resort: check with API
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
          console.log(`Loaded ${parsed.length} messages from cache`);
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
      console.log("Not connecting to socket: user hasn't joined activity");
      return;
    }

    // Initialize socket if no global instance exists
    if (!sharedSocket) {
      console.log("Creating new socket connection to:", API_URL);
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
      
      console.log("Global socket instance created");
    }
    
    // Store reference to shared socket in ref
    socketRef.current = sharedSocket;
    
    // Connect to the socket if not already connected
    if (!socketRef.current.connected) {
      console.log("Socket connecting...");
      socketRef.current.connect();
    } else {
      console.log("Socket already connected");
      setIsConnected(true);
      setConnectionError(false);
    }
    
    // Handle socket connection events
    const handleConnect = () => {
      console.log("Socket connected successfully");
      setIsConnected(true);
      setConnectionError(false);
      setLoadingMessages(true);
      
      // Join the activity chat room
      socketRef.current.emit('join-activity-room', {
        roomId,
        userId: currentUser?.id,
        username: currentUser?.username || currentUser?.name || currentUser?.email || "User"
      }, (response) => {
        if (response?.success) {
          console.log(`Joined activity room: ${roomId}`);
        } else {
          console.log(`Room join acknowledgement not received, assuming joined: ${roomId}`);
        }
        
        // Get existing messages (regardless of join confirmation)
        fetchMessages();
      });
    };
    
    const fetchMessages = () => {
      // Set a timeout to prevent infinite loading state
      const messageLoadingTimeout = setTimeout(() => {
        setLoadingMessages(false);
        console.log("Message loading timed out - server did not respond");
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
      const socketSuccess = new Promise((resolve) => {
        socketRef.current.emit('get-activity-messages', { roomId }, (messages) => {
          if (Array.isArray(messages) && messages.length > 0) {
            console.log(`Socket: Received ${messages.length} messages`);
            resolve({ success: true, source: 'socket', messages });
          } else {
            console.log("Socket: No messages or invalid response");
            resolve({ success: false, source: 'socket' });
          }
        });
        
        // If no response within 3 seconds, consider socket approach failed
        setTimeout(() => {
          resolve({ success: false, source: 'socket', timedOut: true });
        }, 3000);
      });
      
      // Then try API method
      const apiSuccess = async () => {
        try {
          console.log("Trying API method for fetching messages");
          const messages = await getActivityMessages(activityId);
          console.log(`API: Received ${messages.length} messages`);
          return { success: true, source: 'api', messages };
        } catch (err) {
          console.error("API message fetch failed:", err);
          return { success: false, source: 'api', error: err };
        }
      };
      
      // Try both methods and use the first that succeeds
      (async () => {
        try {
          // Race the methods
          const [socketResult, apiResult] = await Promise.all([
            socketSuccess,
            apiSuccess()
          ]);
          
          // Clear the timeout since we got a response
          clearTimeout(messageLoadingTimeout);
          setLoadingMessages(false);
          
          // Determine which result to use (prefer socket if both succeed)
          const result = socketResult.success ? socketResult : 
                        apiResult.success ? apiResult : null;
          
          if (!result || !result.success) {
            console.error("Both methods failed to fetch messages");
            
            // Check if we have cached messages first
            const cachedMessages = localStorage.getItem(messagesKey);
            if (cachedMessages) {
              try {
                const parsed = JSON.parse(cachedMessages);
                if (Array.isArray(parsed) && parsed.length > 0) {
                  console.log(`Using ${parsed.length} cached messages as fallback`);
                  setMessages(parsed);
                  return;
                }
              } catch (e) {
                console.error("Error parsing cached messages:", e);
              }
            }
            
            // Show error if no cache
            setMessages([{
              _id: `system-${Date.now()}`,
              content: "Couldn't load messages. Please try refreshing the page.",
              sender: { id: 'system', username: 'System' },
              timestamp: new Date().toISOString(),
              isSystem: true
            }]);
            return;
          }
          
          // Process the successful result
          const messages = result.messages;
          console.log(`Using messages from ${result.source}: ${messages.length} messages`);
          
          setMessages(prevMessages => {
            // Create a set of existing message IDs for faster lookup
            const existingIds = new Set(prevMessages.filter(m => m._id).map(m => m._id));
            
            // Filter out messages we already have
            const newMessages = messages.filter(m => m._id && !existingIds.has(m._id));
            
            // Combine with existing messages (excluding system messages)
            const combined = [...prevMessages.filter(m => !m.isSystem), ...newMessages];
            
            // Sort by timestamp
            const sorted = combined.sort((a, b) => {
              const timeA = new Date(a.timestamp || a.createdAt);
              const timeB = new Date(b.timestamp || b.createdAt);
              return timeA - timeB;
            });
            
            // Cache the messages in localStorage
            try {
              localStorage.setItem(messagesKey, JSON.stringify(sorted.slice(-50)));
            } catch (err) {
              console.error("Error caching messages:", err);
            }
            
            return sorted;
          });
        } catch (error) {
          console.error("Error during message fetching:", error);
          clearTimeout(messageLoadingTimeout);
          setLoadingMessages(false);
          
          // Show error message
          setMessages(prevMessages => {
            if (prevMessages.length === 0) {
              return [{
                _id: `system-${Date.now()}`,
                content: "Error loading messages. Please try again.",
                sender: { id: 'system', username: 'System' },
                timestamp: new Date().toISOString(),
                isSystem: true
              }];
            }
            return prevMessages;
          });
        }
      })();
    };
    
    const handleConnectError = (error) => {
      console.error("Socket connection error:", error);
      setConnectionError(true);
      setIsConnected(false);
      setLoadingMessages(false);
    };
    
    const handleDisconnect = (reason) => {
      console.log("Socket disconnected:", reason);
      setIsConnected(false);
    };
    
    // Handle new messages from server
    const handleNewMessage = (message) => {
      if (!message || !message._id) {
        console.warn("Received invalid message format:", message);
        return;
      }
      
      console.log("Received new message:", message);
      setMessages(prevMessages => {
        // Skip if we already have this message
        if (prevMessages.some(m => m._id === message._id)) {
          console.log("Message already exists in state, skipping");
          return prevMessages;
        }
        
        // Add message and sort by timestamp
        const updated = [...prevMessages, message].sort((a, b) => {
          const timeA = new Date(a.timestamp || a.createdAt);
          const timeB = new Date(b.timestamp || b.createdAt);
          return timeA - timeB;
        });
        
        // Cache messages
        try {
          const messagesToStore = updated.filter(msg => !msg.pending && !msg.error);
          localStorage.setItem(messagesKey, JSON.stringify(messagesToStore.slice(-50)));
        } catch (err) {
          console.error("Error caching messages:", err);
        }
        
        return updated;
      });
    };
    
    // Handle message confirmations
    const handleMessageConfirmation = (data) => {
      if (!data?.message?._id) {
        console.warn("Received invalid message confirmation:", data);
        return;
      }
      
      console.log("Message confirmed by server:", data.message);
      setMessages(prevMessages => {
        const updated = prevMessages.map(msg => {
          // Find pending message by matching content and sender
          if (msg.pending && 
              msg.content === data.message.content && 
              msg.sender.id === data.message.sender.id) {
            // Replace temporary message with confirmed one from server
            return { ...data.message, pending: false };
          }
          return msg;
        });
        
        // Cache messages
        try {
          const messagesToStore = updated.filter(msg => !msg.pending && !msg.error);
          localStorage.setItem(messagesKey, JSON.stringify(messagesToStore.slice(-50)));
        } catch (err) {
          console.error("Error caching messages:", err);
        }
        
        return updated;
      });
    };
    
    // Handle message errors
    const handleMessageError = (error) => {
      console.error("Server reported message error:", error);
      // Mark all pending messages as failed
      setMessages(prevMessages => {
        return prevMessages.map(msg => {
          if (msg.pending) {
            return { ...msg, pending: false, error: true, content: `${msg.content} (Failed to send)` };
          }
          return msg;
        });
      });
    };
    
    // Register event handlers
    socketRef.current.on('connect', handleConnect);
    socketRef.current.on('connect_error', handleConnectError);
    socketRef.current.on('disconnect', handleDisconnect);
    socketRef.current.on('activity-message', handleNewMessage);
    socketRef.current.on('activity-message-confirmation', handleMessageConfirmation);
    socketRef.current.on('activity-message-error', handleMessageError);
    
    // If already connected, manually trigger the connect handler
    if (socketRef.current.connected) {
      handleConnect();
    } else {
      // Force trigger fetchMessages if socket is taking too long to connect
      const connectionTimeout = setTimeout(() => {
        if (!isConnected && !connectionError) {
          console.log("Connection taking too long, trying to fetch messages anyway");
          setIsConnected(true); // Optimistically set connected to allow UI to show
          fetchMessages();
        }
      }, 5000);
      
      return () => clearTimeout(connectionTimeout);
    }
    
    // Cleanup function
    return () => {
      if (socketRef.current) {
        // Leave the room but stay connected
        socketRef.current.emit('leave-activity-room', { roomId });
        
        // Remove all event listeners
        socketRef.current.off('connect', handleConnect);
        socketRef.current.off('connect_error', handleConnectError);
        socketRef.current.off('disconnect', handleDisconnect);
        socketRef.current.off('activity-message', handleNewMessage);
        socketRef.current.off('activity-message-confirmation', handleMessageConfirmation);
        socketRef.current.off('activity-message-error', handleMessageError);
      }
    };
  }, [activityId, currentUser, token, roomId, hasJoinedActivity, hasJoined, isCheckingParticipation, messagesKey]);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (messages.length > 0 && isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  // Send a message
  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) {
      return;
    }
    
    if (!socketRef.current || !socketRef.current.connected) {
      console.log("Socket not connected, attempting to reconnect...");
      if (socketRef.current) {
        socketRef.current.connect();
      }
      
      // Show reconnection message to user
      setMessages(prev => [...prev, {
        _id: `system-${Date.now()}`,
        content: "Reconnecting to chat... Please try again in a moment.",
        sender: { id: 'system', username: 'System' },
        timestamp: new Date().toISOString(),
        isSystem: true
      }]);
      
      return;
    }
    
    // Create message data
    const messageData = {
      roomId,
      content: newMessage,
      sender: {
        id: currentUser?.id,
        username: currentUser?.username || currentUser?.name || currentUser?.email || "User"
      },
      timestamp: new Date().toISOString()
    };
    
    // Clear input immediately for better UX
    setNewMessage('');
    
    // Generate temporary ID for this message
    const tempId = `temp-${Date.now()}`;
    
    // Add message to UI with pending status
    setMessages(prev => [...prev, { 
      ...messageData, 
      _id: tempId, 
      pending: true 
    }]);
    
    // Send the message with timeout
    console.log("Sending message:", messageData);
    
    // Use both socket and direct API to ensure message is sent
    // This dual approach increases reliability
    
    // 1. First try with socket.io
    const sendWithSocket = () => {
      return new Promise((resolve) => {
        const timeoutId = setTimeout(() => {
          console.log("Socket message send timed out");
          resolve({ success: false, method: 'socket' });
        }, 5000);
        
        socketRef.current.emit('send-activity-message', messageData, (response) => {
          clearTimeout(timeoutId);
          console.log("Socket response:", response);
          resolve({ 
            success: !!(response && !response.error), 
            method: 'socket',
            response 
          });
        });
      });
    };
    
    // 2. Second try with direct API
    const sendWithAPI = async () => {
      try {
        console.log("Sending message via API endpoint");
        const result = await sendActivityMessage(
          activityId,
          messageData.content,
          messageData.sender.username
        );
        console.log("API message send success:", result);
        return { 
          success: true, 
          method: 'api',
          data: result
        };
      } catch (err) {
        console.error("API message send failed:", err);
        return { 
          success: false, 
          method: 'api',
          error: err.message 
        };
      }
    };
    
    // Try both methods in sequence
    (async () => {
      try {
        // First try socket - it's faster when working
        const socketResult = await sendWithSocket();
        
        if (socketResult.success) {
          console.log("Message sent successfully via socket");
          return; // We're good - confirmation will come through socket events
        }
        
        console.log("Socket send failed, trying API fallback");
        
        // If socket fails, try API
        const apiResult = await sendWithAPI();
        
        if (apiResult.success) {
          console.log("Message sent successfully via API fallback");
          
          // Update the message in UI since we won't get a socket confirmation
          setMessages(prev => {
            return prev.map(msg => {
              if (msg._id === tempId) {
                return { 
                  ...msg, 
                  _id: apiResult.data._id || tempId,
                  pending: false, 
                  error: false 
                };
              }
              return msg;
            });
          });
          
          // Force a reload of all messages to ensure consistency
          setTimeout(() => {
            if (socketRef.current && socketRef.current.connected) {
              socketRef.current.emit('get-activity-messages', { roomId }, messages => {
                if (Array.isArray(messages) && messages.length > 0) {
                  setMessages(prevMessages => {
                    // Just replace all messages for simplicity
                    return messages.sort((a, b) => {
                      const timeA = new Date(a.timestamp || a.createdAt);
                      const timeB = new Date(b.timestamp || b.createdAt);
                      return timeA - timeB;
                    });
                  });
                }
              });
            }
          }, 500);
          
          return;
        }
        
        // Both methods failed
        console.error("Failed to send message via both socket and API");
        throw new Error("Failed to send message");
      } catch (err) {
        console.error("Error sending message:", err);
        
        // Mark message as error in UI
        setMessages(prev => {
          return prev.map(msg => {
            if (msg._id === tempId) {
              // Add retry button to message
              return { 
                ...msg, 
                pending: false, 
                error: true,
                content: msg.content,
                originalContent: msg.content,
                canRetry: true
              };
            }
            return msg;
          });
        });
      }
    })();
  };
  
  // Function to retry sending a failed message
  const handleRetry = (message) => {
    if (!message.canRetry) return;
    
    // Create a new message with the original content
    const retryContent = message.originalContent || message.content.replace(" (Failed to send)", "");
    
    // Remove the failed message
    setMessages(prev => prev.filter(m => m._id !== message._id));
    
    // Set the input field with the original content
    setNewMessage(retryContent);
    
    // Focus the input field
    setTimeout(() => {
      document.querySelector('input[type="text"]')?.focus();
    }, 100);
  };

  // Don't render if user hasn't joined
  if ((!hasJoinedActivity && !isCheckingParticipation) && !hasJoined) {
    console.log("Not rendering group chat: user hasn't joined activity");
    return null;
  }

  // Helper function to manually reconnect
  const handleReconnect = () => {
    setConnectionError(false);
    if (socketRef.current) {
      socketRef.current.connect();
      setMessages(prev => [...prev, {
        _id: `system-${Date.now()}`,
        content: "Reconnecting...",
        sender: { id: 'system', username: 'System' },
        timestamp: new Date().toISOString(),
        isSystem: true
      }]);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md overflow-hidden">
      <div 
        className="bg-primary text-white px-4 py-3 flex justify-between items-center cursor-pointer"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <h2 className="font-semibold">Activity Group Chat</h2>
        <div className="flex items-center">
          <span className="mr-3 text-sm">{messages.length} messages</span>
          {connectionError && (
            <span className="mr-3 text-xs bg-red-600 text-white px-2 py-1 rounded-full">
              Connection Error
            </span>
          )}
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform ${isExpanded ? 'transform rotate-180' : ''}`}
            viewBox="0 0 20 20" 
            fill="currentColor"
          >
            <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
          </svg>
        </div>
      </div>
      
      {isExpanded && (
        <>
          <div 
            className="p-4 h-64 overflow-y-auto bg-gray-50"
            style={{ scrollBehavior: 'smooth' }}
          >
            {(!isConnected && !connectionError) || loadingMessages ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
                <p>{loadingMessages ? "Loading messages..." : "Connecting to chat..."}</p>
              </div>
            ) : connectionError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>Failed to connect to chat.</p>
                <button 
                  onClick={handleReconnect}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Reconnect
                </button>
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <p>No messages yet. Be the first to say something!</p>
              </div>
            ) : (
              messages.map((message, index) => (
                <div 
                  key={message._id || index} 
                  className={`mb-3 ${
                    message.isSystem 
                      ? 'text-center' 
                      : isCurrentUser(message) 
                        ? 'text-right' 
                        : 'text-left'
                  }`}
                  onClick={() => message.canRetry && handleRetry(message)}
                >
                  <div className="inline-block">
                    <div 
                      className={`px-3 py-2 rounded-lg max-w-xs md:max-w-md lg:max-w-lg inline-block ${
                        message.isSystem
                          ? message.error
                            ? 'bg-red-100 text-red-800'
                            : 'bg-gray-100 text-gray-600'
                          : message.error 
                            ? 'bg-red-100 text-red-800 cursor-pointer' 
                            : message.pending
                              ? 'bg-blue-50 text-primary'
                              : isCurrentUser(message) 
                                ? 'bg-primary text-white' 
                                : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {!message.isSystem && !isCurrentUser(message) && (
                        <div className="font-medium text-xs mb-1">
                          {message.sender.username}
                        </div>
                      )}
                      <p className="break-words">
                        {message.error && message.canRetry 
                          ? message.content.replace(" (Failed to send)", "") 
                          : message.content}
                        {message.error && message.canRetry && (
                          <span className="text-red-600 ml-1 text-xs">(Tap to retry)</span>
                        )}
                      </p>
                      {!message.isSystem && (
                        <div 
                          className={`text-xs mt-1 ${
                            isCurrentUser(message) 
                              ? 'text-blue-100' 
                              : 'text-gray-500'
                          }`}
                        >
                          {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          {message.pending && (
                            <span className="ml-1 animate-spin inline-block">↻</span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>
          
          <form onSubmit={handleSendMessage} className="p-2 border-t flex">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              placeholder="Type a message..."
              className="flex-1 border rounded-l-lg px-3 py-2 focus:outline-none focus:ring-1 focus:ring-primary"
              disabled={!isConnected || connectionError}
            />
            <button 
              type="submit" 
              className={`text-white px-4 py-2 rounded-r-lg ${
                !isConnected || connectionError || !newMessage.trim()
                  ? 'bg-gray-400 cursor-not-allowed'
                  : 'bg-primary hover:bg-primary-dark'
              }`}
              disabled={!isConnected || connectionError || !newMessage.trim()}
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
              </svg>
            </button>
          </form>
        </>
      )}
    </div>
  );
};

export default ActivityGroupChat;