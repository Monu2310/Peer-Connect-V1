import React, { useEffect, useState, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getMessages, sendMessage } from '../api/messageService';
import { getUserProfile } from '../api/userService';
import io from 'socket.io-client';
import { API_URL } from '../api/config';
import { motion, AnimatePresence } from 'framer-motion';
import { Card } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Send, Loader2 } from 'lucide-react';

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
  
  if (loading) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-4 text-lg">Loading conversation...</p>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-destructive-foreground">
      <h2 className="text-2xl font-bold">Error</h2>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      {/* Header with recipient info */}
      <Card className="rounded-none border-b border-border p-4 flex items-center shadow-sm">
        <Avatar className="h-10 w-10">
          <AvatarImage src={recipient?.profilePicture || '/avatar.svg'} />
          <AvatarFallback>{recipient?.username.charAt(0).toUpperCase()}</AvatarFallback>
        </Avatar>
        <h1 className="text-xl font-semibold ml-3 gradient-text">{recipient?.username}</h1>
      </Card>
      
      {/* Messages container */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar">
        <AnimatePresence initial={false}>
          {messages.length === 0 ? (
            <motion.div 
              key="no-messages"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="text-center py-8 text-muted-foreground"
            >
              <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted" />
              <p className="text-lg mb-2">No messages yet</p>
              <p>Send a message to start the conversation.</p>
            </motion.div>
          ) : (
            messages.map(message => (
              <motion.div 
                key={message._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                transition={{ duration: 0.3 }}
                className={`flex ${message.sender === currentUser._id ? 'justify-end' : 'justify-start'}`}
              >
                <div 
                  className={`px-4 py-2 rounded-lg max-w-xs md:max-w-md break-words shadow-md ${
                    message.sender === currentUser._id 
                      ? 'bg-primary text-primary-foreground' 
                      : 'bg-card text-foreground'
                  }`}
                >
                  {message.content}
                  <div className={`text-xs mt-1 ${message.sender === currentUser._id ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>
                    {new Date(message.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </motion.div>
            ))
          )}
        </AnimatePresence>
        {isTyping && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex justify-start"
          >
            <div className="bg-card px-4 py-2 rounded-lg shadow-md">
              <div className="typing-indicator">
                <span></span>
                <span></span>
                <span></span>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>
      
      {/* Message input form */}
      <form onSubmit={handleSubmit} className="flex items-center p-4 border-t border-border bg-card shadow-lg">
        <Input
          type="text"
          placeholder="Type a message..."
          className="flex-1 mr-2 input shadow-md"
          value={newMessage}
          onChange={(e) => setNewMessage(e.target.value)}
          onKeyPress={handleTyping}
        />
        <Button 
          type="submit"
          className="btn-primary"
          disabled={!newMessage.trim()}
        >
          <Send className="h-5 w-5" />
        </Button>
      </form>
    </div>
  );
};

export default Conversation;
