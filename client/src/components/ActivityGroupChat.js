import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import io from 'socket.io-client';
import { API_URL } from '../api/config';

const ActivityGroupChat = ({ activityId, activityTitle }) => {
  const { currentUser, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [connectionError, setConnectionError] = useState(false);
  const socketRef = useRef();
  const messagesEndRef = useRef(null);
  
  // Create a unique room ID for this activity's group chat
  const roomId = `activity-${activityId}`;

  useEffect(() => {
    // Only try to connect if we have a valid user
    if (!currentUser || !currentUser.id) {
      console.log('No current user, skipping socket connection');
      return;
    }

    // Initialize socket connection with auth token
    socketRef.current = io(API_URL, {
      reconnection: true,
      reconnectionDelay: 1000,
      reconnectionAttempts: 5,
      transports: ['websocket', 'polling'],
      withCredentials: true,
      auth: {
        token: token
      },
      query: {
        userId: currentUser.id
      }
    });
    
    // Connection status handlers
    socketRef.current.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setIsConnected(true);
      setConnectionError(false);
      
      // Join activity-specific chat room
      socketRef.current.emit('join-activity-room', {
        roomId,
        userId: currentUser.id,
        username: currentUser.username || currentUser.name || currentUser.email || "User"
      });
      
      // Request message history after joining
      socketRef.current.emit('get-activity-messages', { roomId }, (activityMessages) => {
        console.log('Received activity messages:', activityMessages);
        if (activityMessages && Array.isArray(activityMessages)) {
          setMessages(activityMessages);
        }
      });
    });
    
    socketRef.current.on('connect_error', (error) => {
      console.error('Socket connection error:', error);
      setConnectionError(true);
      setIsConnected(false);
    });
    
    // Listen for incoming group messages
    socketRef.current.on('activity-message', (message) => {
      console.log('Received new message:', message);
      // Make sure we don't add duplicate messages
      setMessages(prevMessages => {
        // Check if message is already in the array (by _id or by comparing other fields)
        if (!message._id || !prevMessages.some(m => m._id === message._id)) {
          return [...prevMessages, message];
        }
        return prevMessages;
      });
    });
    
    // Clean up on unmount
    return () => {
      if (socketRef.current) {
        socketRef.current.emit('leave-activity-room', { roomId });
        socketRef.current.disconnect();
      }
    };
  }, [activityId, currentUser, token, roomId]);
  
  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > 0 && isExpanded) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isExpanded]);

  const handleSendMessage = (e) => {
    e.preventDefault();
    
    if (!newMessage.trim() || !isConnected) return;
    
    const messageData = {
      roomId,
      content: newMessage,
      sender: {
        id: currentUser.id,
        username: currentUser.username || currentUser.name || currentUser.email || "User"
      },
      timestamp: new Date().toISOString()
    };
    
    console.log('Sending message:', messageData);
    
    // Clear input field immediately for better UX
    setNewMessage('');
    
    // Send via socket
    socketRef.current.emit('send-activity-message', messageData, (acknowledgment) => {
      // Handle acknowledgment if the server sends one
      if (acknowledgment?.error) {
        console.error('Error sending message:', acknowledgment.error);
      }
    });
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
            {!isConnected && !connectionError ? (
              <div className="flex flex-col items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-primary mb-2"></div>
                <p>Connecting to chat...</p>
              </div>
            ) : connectionError ? (
              <div className="flex flex-col items-center justify-center h-full text-red-500">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
                <p>Failed to connect to chat. Please try refreshing.</p>
                <button 
                  onClick={() => window.location.reload()}
                  className="mt-2 px-4 py-1 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Refresh
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
                  className={`mb-3 ${message.sender.id === currentUser.id ? 'text-right' : 'text-left'}`}
                >
                  <div className="inline-block">
                    <div 
                      className={`px-3 py-2 rounded-lg max-w-xs md:max-w-md lg:max-w-lg inline-block ${
                        message.sender.id === currentUser.id 
                          ? 'bg-primary text-white' 
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {message.sender.id !== currentUser.id && (
                        <div className="font-medium text-xs mb-1">
                          {message.sender.username}
                        </div>
                      )}
                      <p className="break-words">{message.content}</p>
                      <div 
                        className={`text-xs mt-1 ${
                          message.sender.id === currentUser.id 
                            ? 'text-blue-100' 
                            : 'text-gray-500'
                        }`}
                      >
                        {new Date(message.timestamp || message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </div>
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