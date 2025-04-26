import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getConversations } from '../api/messageService';

const Messages = () => {
  const { currentUser } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchConversations = async () => {
      try {
        const data = await getConversations();
        setConversations(data);
        setLoading(false);
      } catch (err) {
        setError('Failed to load conversations');
        setLoading(false);
        console.error(err);
      }
    };

    fetchConversations();
  }, []);

  if (loading) return <div className="p-4 text-center">Loading conversations...</div>;
  
  if (error) return <div className="p-4 text-center text-red-500">{error}</div>;

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-semibold mb-6">Messages</h1>
      
      {conversations.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No conversations yet</p>
          <p className="mt-2">Start chatting with your friends from your friends list.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {conversations.map(conversation => (
            <Link 
              to={`/messages/${conversation.user._id}`} 
              key={conversation.user._id}
              className="flex items-center p-4 bg-white rounded-lg shadow hover:shadow-md transition"
            >
              <div className="h-12 w-12 rounded-full bg-gray-200 overflow-hidden">
                {conversation.user.profilePicture ? (
                  <img 
                    src={conversation.user.profilePicture} 
                    alt={conversation.user.username} 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-blue-500 text-white">
                    {conversation.user.username.charAt(0).toUpperCase()}
                  </div>
                )}
              </div>
              
              <div className="ml-4 flex-grow">
                <h3 className="font-medium">{conversation.user.username}</h3>
                <p className="text-sm text-gray-500 truncate">
                  {conversation.lastMessage?.content || 'No messages yet'}
                </p>
              </div>
              
              {conversation.unreadCount > 0 && (
                <div className="bg-blue-500 text-white text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center">
                  {conversation.unreadCount}
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

export default Messages;