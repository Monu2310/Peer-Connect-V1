import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, getFriendRequests, sendFriendRequestById, acceptFriendRequest, rejectFriendRequest } from '../api/friendService';
import intelligentCache from '../lib/intelligentCache';
import { findUserByEmail } from '../api/userService';
import { useAuth } from '../core/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { UserCheck, UserX, Mail, MessageSquare, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import SuggestedPeers from '../components/SuggestedPeers';

const Friends = () => {
  const { currentUser } = useAuth();
  const [friends, setFriends] = useState([]);
  const [friendRequests, setFriendRequests] = useState([]);
  const [newFriendEmail, setNewFriendEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [sendRequestLoading, setSendRequestLoading] = useState(false);

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
    fetchFriendsData();

    // Listen for friendship changes from other parts of the app and refresh
    const onFriendshipChanged = () => {
      // Invalidate warmed friends cache to ensure fresh data
      try { intelligentCache.delete('user:friends'); } catch (e) { /* ignore */ }
      fetchFriendsData();
    };
    window.addEventListener('friendshipChanged', onFriendshipChanged);

    const onFriendRequestSent = () => {
      try { intelligentCache.delete('user:friends'); } catch (e) { /* ignore */ }
      fetchFriendsData();
      // also refresh friend requests
      // fetchFriendsData already calls getFriendRequests
    };
    window.addEventListener('friendRequestSent', onFriendRequestSent);

    const onFriendRequestRejected = () => {
      try { intelligentCache.delete('user:friends'); } catch (e) { /* ignore */ }
      fetchFriendsData();
    };
    window.addEventListener('friendRequestRejected', onFriendRequestRejected);

    return () => {
      window.removeEventListener('friendshipChanged', onFriendshipChanged);
      window.removeEventListener('friendRequestSent', onFriendRequestSent);
      window.removeEventListener('friendRequestRejected', onFriendRequestRejected);
    };
  }, []);

  const fetchFriendsData = async () => {
    setLoading(true);
    setError('');
    try {
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);
      setFriends(friendsData || []);
      setFriendRequests(requestsData || []);
      setLoading(false);
    } catch (err) {
      setError(err.message || 'Failed to load friends data.');
      setLoading(false);
    }
  };

  const handleSendRequest = async (e) => {
    e.preventDefault();
    if (!newFriendEmail.trim()) return;

    setSendRequestLoading(true);
    setSuccess('');
    setError('');

    try {
      const targetUser = await findUserByEmail(newFriendEmail);

      if (targetUser._id === currentUser.id) {
        setError('You cannot send a friend request to yourself.');
        setSendRequestLoading(false);
        return;
      }

      await sendFriendRequestById(targetUser._id);
      setNewFriendEmail('');
      setSuccess(`Friend request sent to ${targetUser.username}!`);
      
      // Invalidate cache and dispatch event immediately
      try { intelligentCache.delete('user:friends'); } catch (e) { /* ignore */ }
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('friendRequestSent', { detail: { userId: targetUser._id } }));
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send friend request.');
    } finally {
      setSendRequestLoading(false);
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleAcceptRequest = async (requestId) => {
    if (!requestId) {
      setError('Invalid request ID');
      return;
    }
    
    // Find the request being accepted
    const requestToAccept = friendRequests.find(req => req._id === requestId);
    if (!requestToAccept) {
      setError('Request not found');
      return;
    }

    try {
      console.log('🔵 Accepting friend request:', requestId);
      
      // STEP 1: Optimistically update UI IMMEDIATELY
      // Remove from requests list
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      
      // Add requester to friends list immediately
      const newFriend = requestToAccept.requester;
      if (newFriend) {
        setFriends(prev => {
          const exists = prev.some(f => String(f._id || f.id) === String(newFriend._id || newFriend.id));
          if (exists) return prev;
          return [newFriend, ...prev];
        });
      }
      
      // Show success message immediately
      setSuccess('Friend request accepted! They are now in your friends list.');

      // STEP 2: Call backend API
      const result = await acceptFriendRequest(requestId);
      console.log('✅ Friend request accepted successfully:', result);

      // STEP 3: Invalidate cache and notify other components
      try { 
        intelligentCache.delete('user:friends');
        intelligentCache.delete('user:friend-requests');
        intelligentCache.invalidateByTags(['friends', 'social']);
      } catch (e) { /* ignore */ }
      
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('friendshipChanged', { 
          detail: { requestId, action: 'accepted', friend: newFriend } 
        }));
      }

      // STEP 4: Re-fetch immediately to keep UI perfectly in sync
      try {
        await fetchFriendsData();
      } catch (e) {
        console.debug('Background refresh failed:', e);
      }

    } catch (err) {
      console.error('❌ Error accepting friend request:', err);
      // On error, revert optimistic update by refetching
      await fetchFriendsData();
      setError(err.response?.data?.message || 'Failed to accept friend request.');
    } finally {
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRejectRequest = async (requestId) => {
    if (!requestId) {
      setError('Invalid request ID');
      return;
    }
    try {
      console.log('🔵 Declining friend request:', requestId);
      
      // Optimistically remove from UI immediately
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      
      await rejectFriendRequest(requestId);
      console.log('✅ Friend request declined successfully');
      
      // Invalidate cache and dispatch event immediately
      try { intelligentCache.delete('user:friends'); } catch (e) { /* ignore */ }
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('friendRequestRejected', { detail: { requestId } }));
      }
      
      // Re-fetch all data to ensure consistency
      await fetchFriendsData();
      setSuccess('Friend request declined!');
    } catch (err) {
      console.error('❌ Error declining friend request:', err);
      // If error, refetch to restore accurate state
      await fetchFriendsData();
      setError(err.response?.data?.message || 'Failed to reject friend request.');
    } finally {
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <BeautifulBackground>
        <div className="container mx-auto p-4 sm:p-6 lg:p-8 min-h-screen flex items-center justify-center">
          <Loader2 className="h-10 w-10 animate-spin text-primary" />
          <p className="ml-4 text-lg">Loading friends data...</p>
        </div>
      </BeautifulBackground>
    );
  }

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
                My Connections
              </h1>
              <p className="text-base md:text-lg text-muted-foreground">
                Manage your friendships and connect with new people.
              </p>
            </div>
          </motion.div>
          
          {/* Alerts */}
          <AnimatePresence>
            {error && (
              <motion.div 
                key="error-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-destructive/10 border border-destructive/30 text-destructive-foreground p-4 rounded-xl"
              >
                <p className="text-sm font-medium">{error}</p>
              </motion.div>
            )}
            {success && (
              <motion.div 
                key="success-alert"
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="mb-4 bg-green-500/10 border border-green-500/30 text-green-600 p-4 rounded-xl"
              >
                <p className="text-sm font-medium">{success}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Tabs */}
          <Tabs defaultValue="friends" className="w-full">
            <TabsList className="grid w-full grid-cols-4 bg-muted/50 border border-border/30 p-1 rounded-xl mb-8">
              <TabsTrigger value="friends" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                Requests ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="suggested" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                Suggested
              </TabsTrigger>
              <TabsTrigger value="add" className="rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground data-[state=active]:shadow-sm font-medium">
                Add Friend
              </TabsTrigger>
            </TabsList>

            <AnimatePresence>
              {/* Friends Tab */}
              <TabsContent key="tab-friends" value="friends" className="mt-0">
                {friends.length === 0 ? (
                  <motion.div key="no-friends" variants={itemVariants} className="flex items-center justify-center min-h-[350px]">
                    <div className="text-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-sm">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                        <Users className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold mb-2">No friends yet</p>
                      <p className="text-muted-foreground text-sm mb-6">Start connecting with people in your community</p>
                      <Button asChild className="btn-gradient-primary">
                        <Link to="/friends">Discover Friends</Link>
                      </Button>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="friends-list" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                    {friends.filter((friend) => friend && (friend._id || friend.id || friend.username)).map((friend, idx) => {
                      const key = friend._id || friend.id || friend.username || `friend-${idx}`;
                      return (
                      <motion.div key={key} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-5">
                              <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                <AvatarImage src={friend?.profilePicture || '/avatar.svg'} />
                                <AvatarFallback className="bg-primary/20 font-semibold">{friend?.username?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">{friend?.username || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{friend?.major || 'No major'}</p>
                              </div>
                            </div>
                            
                            {friend?.bio && (
                              <p className="text-sm text-muted-foreground mb-4 line-clamp-2 leading-relaxed">{friend.bio}</p>
                            )}
                            
                            <div className="flex gap-2 pt-4 border-t border-border/20">
                              <Button asChild variant="ghost" size="sm" className="flex-1 h-10 text-primary hover:bg-primary/10 font-medium">
                                <Link to={`/messages/${friend?._id || ''}`}><MessageSquare className="h-4 w-4 mr-2" />Message</Link>
                              </Button>
                              <Button asChild variant="ghost" size="sm" className="flex-1 h-10 text-muted-foreground hover:text-foreground hover:bg-muted/30 font-medium">
                                <Link to={`/profile/${friend?._id || ''}`}>View</Link>
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent key="tab-requests" value="requests" className="mt-0">
                {friendRequests.length === 0 ? (
                  <motion.div key="no-requests" variants={itemVariants} className="flex items-center justify-center min-h-[350px]">
                    <div className="text-center bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8 max-w-sm">
                      <div className="w-20 h-20 rounded-full bg-muted/30 flex items-center justify-center mx-auto mb-6">
                        <Mail className="h-10 w-10 text-muted-foreground" />
                      </div>
                      <p className="text-lg font-semibold mb-2">All caught up!</p>
                      <p className="text-muted-foreground text-sm">No pending friend requests</p>
                    </div>
                  </motion.div>
                ) : (
                  <motion.div key="requests-list" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 pb-12">
                    {friendRequests.filter((request) => request && (request._id || request.id || (request.requester && (request.requester._id || request.requester.id || request.requester.username)))).map((request, idx) => {
                      const requester = request.requester || {};
                      const key = request._id || request.id || requester._id || requester.id || requester.username || `request-${idx}`;
                      return (
                      <motion.div key={key} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                              <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                <AvatarImage src={request?.requester?.profilePicture || '/avatar.svg'} />
                                <AvatarFallback className="bg-primary/20 font-semibold">{request?.requester?.username?.charAt(0) || 'U'}</AvatarFallback>
                              </Avatar>
                              <div className="min-w-0 flex-1">
                                <p className="font-semibold text-base truncate group-hover:text-primary transition-colors">{request?.requester?.username || 'Unknown'}</p>
                                <p className="text-xs text-muted-foreground">{request?.requester?.major || 'No major'}</p>
                              </div>
                            </div>
                            
                            <div className="flex gap-2">
                              <Button size="sm" onClick={() => handleAcceptRequest(request?._id)} disabled={!request?._id} className="flex-1 h-10 bg-green-500/20 text-green-600 hover:bg-green-500/30 border border-green-500/30 font-medium">
                                <UserCheck className="h-4 w-4 mr-2" />Accept
                              </Button>
                              <Button size="sm" onClick={() => handleRejectRequest(request?._id)} disabled={!request?._id} className="flex-1 h-10 bg-destructive/20 text-destructive hover:bg-destructive/30 border border-destructive/30 font-medium">
                                <UserX className="h-4 w-4 mr-2" />Decline
                              </Button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                      );
                    })}
                  </motion.div>
                )}
              </TabsContent>

              {/* Suggested Peers Tab */}
              <TabsContent key="tab-suggested" value="suggested" className="mt-0">
                <motion.div key="suggested-peers" variants={containerVariants} initial="hidden" animate="show">
                  <SuggestedPeers limit={9} />
                </motion.div>
              </TabsContent>

              {/* Add Friend Tab */}
              <TabsContent key="tab-add" value="add" className="mt-0">
                <motion.div key="add-friend-form" variants={itemVariants} className="flex items-center justify-center min-h-[350px]">
                  <div className="w-full max-w-md bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-8">
                    <h3 className="text-xl font-semibold mb-2 gradient-text">Send Friend Request</h3>
                    <p className="text-sm text-muted-foreground mb-8">Enter their email to send a friend request</p>
                    <form onSubmit={handleSendRequest} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium mb-3">Email Address</label>
                        <Input 
                          type="email" 
                          value={newFriendEmail} 
                          onChange={(e) => setNewFriendEmail(e.target.value)} 
                          placeholder="friend@example.com" 
                          required 
                          className="h-11 bg-background border-border/50 rounded-xl"
                        />
                      </div>
                      <Button type="submit" className="w-full h-11 btn-gradient-primary font-semibold" disabled={sendRequestLoading}>
                        {sendRequestLoading ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Sending...
                          </>
                        ) : (
                          <>
                            <Mail className="mr-2 h-4 w-4" /> Send Request
                          </>
                        )}
                      </Button>
                    </form>
                  </div>
                </motion.div>
              </TabsContent>
            </AnimatePresence>
          </Tabs>
        </div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default Friends;
