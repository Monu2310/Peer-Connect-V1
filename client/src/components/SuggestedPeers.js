import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { getSuggestedPeers } from '../api/recommendationService';
import { sendFriendRequestById } from '../api/friendService';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { 
  UserPlus, 
  Sparkles, 
  Loader2, 
  TrendingUp,
  BookOpen,
  Heart,
  Briefcase,
  MapPin,
  Award
} from 'lucide-react';

const SuggestedPeers = ({ limit = 6 }) => {
  const [suggestions, setSuggestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sendingRequest, setSendingRequest] = useState({});
  const [sentRequests, setSentRequests] = useState(new Set());

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0, scale: 0.95 },
    show: { 
      y: 0, 
      opacity: 1, 
      scale: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 12
      }
    }
  };

  useEffect(() => {
    fetchSuggestions();
  }, [limit]);

  const fetchSuggestions = async () => {
    setLoading(true);
    try {
      const data = await getSuggestedPeers(limit);
      setSuggestions(data);
    } catch (error) {
      console.error('Failed to fetch peer suggestions:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSendRequest = async (userId) => {
    setSendingRequest(prev => ({ ...prev, [userId]: true }));
    try {
      await sendFriendRequestById(userId);
      setSentRequests(prev => new Set([...prev, userId]));
      
      // Dispatch event to notify other components
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('friendRequestSent', { detail: { userId } }));
      }
    } catch (error) {
      console.error('Failed to send friend request:', error);
    } finally {
      setSendingRequest(prev => ({ ...prev, [userId]: false }));
    }
  };

  const getScoreColor = (score) => {
    if (score >= 70) return 'text-green-500 bg-green-500/10 border-green-500/30';
    if (score >= 50) return 'text-blue-500 bg-blue-500/10 border-blue-500/30';
    if (score >= 30) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/30';
    return 'text-gray-500 bg-gray-500/10 border-gray-500/30';
  };

  const getMatchLabel = (score) => {
    if (score >= 70) return 'Excellent Match';
    if (score >= 50) return 'Great Match';
    if (score >= 30) return 'Good Match';
    return 'Potential Match';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <p className="ml-3 text-muted-foreground">Finding your perfect peers...</p>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className="text-center p-8 bg-card/30 backdrop-blur-sm rounded-2xl border border-border/50">
        <Sparkles className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <p className="text-lg font-medium mb-2">No suggestions available yet</p>
        <p className="text-sm text-muted-foreground">
          Complete your profile to get AI-powered peer recommendations!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-6">
        <Sparkles className="h-5 w-5 text-primary" />
        <h3 className="text-xl font-bold">Suggested Peers</h3>
        <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full font-medium">
          Matched
        </span>
      </div>

      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
      >
        <AnimatePresence>
          {suggestions.map((suggestion) => {
            const { user, similarityScore, breakdown, commonalities } = suggestion;
            const isSent = sentRequests.has(user._id);
            const isSending = sendingRequest[user._id];

            return (
              <motion.div
                key={user._id}
                variants={itemVariants}
                layout
                className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-5 hover:border-primary/50 transition-all duration-300 hover:shadow-lg overflow-hidden"
              >
                {/* Gradient overlay on hover */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

                <div className="relative z-10 space-y-4">
                  {/* Match Score Badge */}
                  <div className="flex items-center justify-between">
                    <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border ${getScoreColor(similarityScore)}`}>
                      <TrendingUp className="h-3.5 w-3.5" />
                      <span className="text-xs font-bold">{similarityScore}%</span>
                    </div>
                    <span className="text-xs text-muted-foreground font-medium">
                      {getMatchLabel(similarityScore)}
                    </span>
                  </div>

                  {/* User Info */}
                  <div className="flex items-start gap-3">
                    <Link to={`/profile/${user._id}`}>
                      <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all cursor-pointer">
                        <AvatarImage src={user.profilePicture} alt={user.username} />
                        <AvatarFallback className="bg-primary/20 font-semibold text-lg">
                          {user.username?.charAt(0)?.toUpperCase() || 'U'}
                        </AvatarFallback>
                      </Avatar>
                    </Link>
                    <div className="flex-1 min-w-0">
                      <Link to={`/profile/${user._id}`}>
                        <h4 className="font-semibold text-base truncate group-hover:text-primary transition-colors cursor-pointer">
                          {user.username}
                        </h4>
                      </Link>
                      {user.major && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <Briefcase className="h-3 w-3" />
                          {user.major}
                        </p>
                      )}
                      {user.location && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                          <MapPin className="h-3 w-3" />
                          {user.location}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Bio */}
                  {user.bio && (
                    <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                      {user.bio}
                    </p>
                  )}

                  {/* Commonalities */}
                  {commonalities && (commonalities.interests?.length > 0 || commonalities.subjects?.length > 0) && (
                    <div className="space-y-2">
                      {commonalities.interests?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <Heart className="h-3.5 w-3.5 text-pink-500 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {commonalities.interests.slice(0, 3).map((interest, idx) => (
                              <span key={idx} className="text-xs bg-pink-500/10 text-pink-600 px-2 py-0.5 rounded-full">
                                {interest}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                      {commonalities.subjects?.length > 0 && (
                        <div className="flex items-start gap-2">
                          <BookOpen className="h-3.5 w-3.5 text-blue-500 mt-0.5 flex-shrink-0" />
                          <div className="flex flex-wrap gap-1">
                            {commonalities.subjects.slice(0, 3).map((subject, idx) => (
                              <span key={idx} className="text-xs bg-blue-500/10 text-blue-600 px-2 py-0.5 rounded-full">
                                {subject}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Similarity Breakdown */}
                  {breakdown && (
                    <div className="grid grid-cols-3 gap-2 pt-3 border-t border-border/30">
                      {breakdown.academic > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Academic</p>
                          <p className="text-sm font-bold text-primary">{breakdown.academic}%</p>
                        </div>
                      )}
                      {breakdown.interests > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Interests</p>
                          <p className="text-sm font-bold text-primary">{breakdown.interests}%</p>
                        </div>
                      )}
                      {breakdown.activities > 0 && (
                        <div className="text-center">
                          <p className="text-xs text-muted-foreground">Activities</p>
                          <p className="text-sm font-bold text-primary">{breakdown.activities}%</p>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action Button */}
                  <Button
                    onClick={() => handleSendRequest(user._id)}
                    disabled={isSent || isSending}
                    className={`w-full h-10 font-medium transition-all ${
                      isSent 
                        ? 'bg-green-500/20 text-green-600 border border-green-500/30 cursor-default'
                        : 'btn-gradient-primary'
                    }`}
                  >
                    {isSending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Sending...
                      </>
                    ) : isSent ? (
                      <>
                        <Award className="mr-2 h-4 w-4" />
                        Request Sent
                      </>
                    ) : (
                      <>
                        <UserPlus className="mr-2 h-4 w-4" />
                        Connect
                      </>
                    )}
                  </Button>
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default SuggestedPeers;
