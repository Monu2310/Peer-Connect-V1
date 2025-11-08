import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getConversations } from '../api/messageService';
import { motion, AnimatePresence } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { MessageSquare, Loader2, Send } from 'lucide-react';
import { Button } from '../components/ui/button';
import BeautifulBackground from '../components/effects/BeautifulBackground';

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
    <BeautifulBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-12 w-12 animate-spin text-primary" />
          <p className="text-lg text-muted-foreground">Loading your conversations...</p>
        </div>
      </div>
    </BeautifulBackground>
  );
  
  if (error) return (
    <BeautifulBackground>
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="bg-destructive/10 border border-destructive/30 rounded-2xl p-8 max-w-md text-center backdrop-blur-sm">
          <h2 className="text-2xl font-bold text-destructive mb-3">Error</h2>
          <p className="text-destructive/80">{error}</p>
        </div>
      </div>
    </BeautifulBackground>
  );

  return (
    <BeautifulBackground>
      <motion.div 
        className="relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header */}
          <motion.div variants={itemVariants} className="pt-6 md:pt-8 pb-6 md:pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
                Messages
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Stay connected with your friends. Pick up where you left off.
              </p>
            </div>
          </motion.div>
      
        {/* Conversations List */}
        <motion.div variants={itemVariants} className="pb-8">
          {conversations.length === 0 ? (
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-12 text-center">
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
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-sm font-medium text-muted-foreground px-1">
                {conversations.length} {conversations.length === 1 ? 'conversation' : 'conversations'}
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {conversations.map(conversation => (
                  <Link 
                    key={conversation.user._id}
                    to={`/messages/${conversation.user._id}`} 
                    className="group relative flex items-center gap-4 p-5 bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-lg hover:-translate-y-0.5"
                  >
                    {/* Background hover effect */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-transparent opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                    
                    <div className="relative flex items-center gap-4 flex-1 min-w-0">
                      {/* Avatar */}
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all flex-shrink-0">
                        <AvatarImage src={conversation.user.profilePicture || '/avatar.svg'} />
                        <AvatarFallback className="bg-gradient-to-br from-primary/30 to-accent/30 text-lg font-semibold">
                          {conversation.user.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Content */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-semibold text-base text-foreground group-hover:text-primary transition-colors truncate">
                            {conversation.user.username}
                          </h3>
                          {conversation.unreadCount > 0 && (
                            <span className="text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full font-semibold flex-shrink-0">
                              {conversation.unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-sm truncate ${
                          conversation.unreadCount > 0 
                            ? 'text-foreground font-medium' 
                            : 'text-muted-foreground'
                        }`}>
                          {conversation.lastMessage?.content || 'Start a conversation'}
                        </p>
                      </div>

                      {/* Icon */}
                      <div className="flex-shrink-0 text-muted-foreground group-hover:text-primary transition-colors">
                        <MessageSquare className="w-5 h-5" />
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}
        </motion.div>
        </div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default Messages;
