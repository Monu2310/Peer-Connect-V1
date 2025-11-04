import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConversations } from '../api/messageService';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { Button } from '../components/ui/button';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { y: 24, opacity: 0 },
    show: { 
      y: 0, 
      opacity: 1,
      transition: {
        duration: 0.4,
        ease: "easeOut"
      }
    }
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
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="flex flex-col items-center gap-4">
        <Loader2 className="h-12 w-12 animate-spin text-primary" />
        <p className="text-lg text-muted-foreground">Loading your conversations...</p>
      </div>
    </div>
  );
  
  if (error) return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 flex items-center justify-center p-4">
      <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 max-w-md text-center backdrop-blur-sm">
        <h2 className="text-2xl font-bold text-destructive mb-3">Error</h2>
        <p className="text-destructive/80">{error}</p>
      </div>
    </div>
  );

  return (
    <motion.div 
      className="min-h-screen w-full bg-gradient-to-br from-background to-muted/20 relative"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[10%] right-[5%] w-80 h-80 bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl" />
        <div className="absolute bottom-[10%] left-[5%] w-64 h-64 bg-gradient-to-r from-secondary/10 to-primary/10 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-4xl mx-auto p-6 md:p-8 lg:p-10">
        {/* Header */}
        <motion.div variants={itemVariants} className="mb-10 md:mb-12">
          <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-3">
            Messages
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl">
            Stay connected with your friends. Pick up where you left off.
          </p>
        </motion.div>
      
        {/* Conversations List */}
        {conversations.length === 0 ? (
          <motion.div 
            key="no-conversations"
            variants={itemVariants}
            className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center"
          >
            <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
              <MessageSquare className="h-10 w-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl font-semibold mb-2">No conversations yet</h3>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto leading-relaxed">
              Start chatting with your friends to begin conversations. Go to your friends list to connect.
            </p>
            <Button asChild className="btn-gradient-primary min-h-11">
              <Link to="/friends" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Go to Friends
              </Link>
            </Button>
          </motion.div>
        ) : (
          <motion.div variants={containerVariants} initial="hidden" animate="show" className="space-y-4">
            <div className="text-sm font-medium text-muted-foreground mb-4">
              {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
            </div>
            <AnimatePresence>
              {conversations.map(conversation => (
                <motion.div 
                  key={conversation.user._id}
                  variants={itemVariants}
                  whileHover={{ x: 4 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link 
                    to={`/messages/${conversation.user._id}`} 
                    className="group relative flex items-center gap-4 p-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-card/80 hover:border-border transition-all duration-300 overflow-hidden"
                  >
                    {/* Background hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <Avatar className="h-16 w-16 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0">
                        <AvatarImage src={conversation.user.profilePicture || '/avatar.svg'} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-lg font-semibold">
                          {conversation.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline gap-2 mb-1">
                          <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors">
                            {conversation.user.username}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full font-semibold">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate leading-relaxed ${
                          conversation.unreadCount > 0 
                            ? 'text-foreground font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {conversation.lastMessage?.content || 'No messages yet'}
                        </p>
                      </div>

                      {/* Timestamp or icon */}
                      <div className="flex-shrink-0 text-xs text-muted-foreground group-hover:text-primary transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
};

export default Messages;
