import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConversations } from '../api/messageService';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MessageSquare, Loader2 } from 'lucide-react';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

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

  if (loading) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen flex items-center justify-center">
      <Loader2 className="h-10 w-10 animate-spin text-primary" />
      <p className="ml-4 text-lg">Loading conversations...</p>
    </div>
  );
  
  if (error) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-destructive-foreground">
      <h2 className="text-2xl font-bold">Error</h2>
      <p>{error}</p>
    </div>
  );

  return (
    <motion.div 
      className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 gradient-text">Messages</motion.h1>
      
      {conversations.length === 0 ? (
        <motion.div 
          key="no-conversations"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="text-center py-8 card shadow-lg"
        >
          <MessageSquare className="h-12 w-12 mx-auto mb-4 text-muted" />
          <p className="text-muted-foreground text-lg mb-2">No conversations yet.</p>
          <p className="text-muted-foreground">Start chatting with your friends from your friends list.</p>
        </motion.div>
      ) : (
        <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
          <AnimatePresence>
            {conversations.map(conversation => (
              <motion.div 
                key={conversation.user._id}
                variants={itemVariants}
                whileHover={{ scale: 1.01, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
              >
                <Link 
                  to={`/messages/${conversation.user._id}`} 
                  className="flex items-center p-4 card hover:shadow-md transition-shadow duration-300"
                >
                  <Avatar className="h-14 w-14">
                    <AvatarImage src={conversation.user.profilePicture || '/avatar.svg'} />
                    <AvatarFallback>{conversation.user.username.charAt(0).toUpperCase()}</AvatarFallback>
                  </Avatar>
                  
                  <div className="ml-4 flex-grow">
                    <h3 className="font-semibold text-lg text-foreground">{conversation.user.username}</h3>
                    <p className="text-sm text-muted-foreground truncate">
                      {conversation.lastMessage?.content || 'No messages yet'}
                    </p>
                  </div>
                  
                  {conversation.unreadCount > 0 && (
                    <div className="bg-primary text-primary-foreground text-xs font-bold rounded-full h-6 w-6 flex items-center justify-center flex-shrink-0">
                      {conversation.unreadCount}
                    </div>
                  )}
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </motion.div>
  );
};

export default Messages;
