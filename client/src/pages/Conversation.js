import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage } from '../api/messageService';
import { getUserProfile } from '../api/userService';
import io from 'socket.io-client';
import { API_URL } from '../api/config';

const Conversation = () => {
  const { userId } = useParams();
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
    
    // Listen for incoming messages
    socketRef.current.on('receive-message', (message) => {
      setMessages(prevMessages => [...prevMessages, message]);
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
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!newMessage.trim()) return;
    
    try {
      const messageData = {
        content: newMessage,
        sender: currentUser._id,
        recipient: userId,
        roomId
      };
      
      // Add message to UI immediately for responsive feel
      setMessages(prev => [...prev, { 
        ...messageData, 
        _id: Date.now().toString(),
        createdAt: new Date().toISOString()
      }]);
      
      // Clear message input
      setNewMessage('');
      
      // Send message via API
      await sendMessage(userId, newMessage);
      
      // Emit message through socket
      socketRef.current.emit('send-message', messageData);
    } catch (err) {
      console.error('Error sending message:', err);
      // Could show error toast here
    }
  };
  
  if (loading) return <div className="p-4 text-center">Loading conversation...</div>;
  
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      {/* Header with recipient info */}
      <div className="flex items-center pb-4 border-b mb-4">
        <div className="h-10 w-10 rounded-full bg-gray-200 overflow-hidden">
          {recipient?.profilePicture ? (
            <img 
              src={recipient.profilePicture} 
              alt={recipient.username} 
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
              {recipient?.username.charAt(0).toUpperCase()}
            </div>
          )}
        </div>
        <h1 className="text-xl font-medium ml-3">{recipient?.username}</h1>
      </div>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto mb-4 space-y-4" style={{ maxHeight: 'calc(100vh - 220px)' }}>
        {messages.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">No messages yet</p>
            <p className="mt-2">Send a message to start the conversation.</p>
          </div>
        ) : (
          messages.map(message => (
            <div 
              key={message._id} 
              className={`flex ${message.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}
            >
              <div 
                className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md break-words ${
                  message.sender === currentUser._id 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-gray-100'
                }`}
              >
                {message.content}
                <div className={`text-xs mt-1 ${message.sender === currentUser._id ? 'text-blue-100' : 'text-gray-500'}`}>
                  {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
              </div>
            </div>
          ))
        )}
        {isTyping && (
          <div className="flex justify-start">
            <div className="bg-gray-100 px-4 py-2 rounded-lg">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-center mt-auto">
        <input
          type="text"
          placeholder="Type a message..."
          className="flex-1 border rounded-l-lg px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleTyping}
        />
        <button 
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-r-lg hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Send
        </button>
      </form>
    </div>
  );
};

export default Conversation;