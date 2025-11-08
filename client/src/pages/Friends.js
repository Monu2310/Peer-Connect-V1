import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, getFriendRequests, sendFriendRequestById, acceptFriendRequest, rejectFriendRequest } from '../api/friendService';
import { findUserByEmail } from '../api/userService';
import { useAuth } from '../core/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { UserCheck, UserX, Mail, MessageSquare, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';

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
  }, []);

  const fetchFriendsData = async () => {
    setLoading(true);
    setError('');
    try {
      console.log('🔄 Fetching friends data...');
      const [friendsData, requestsData] = await Promise.all([
        getFriends(),
        getFriendRequests(),
      ]);
      console.log('📊 Fetched:', {
        friends: friendsData?.length || 0,
        requests: requestsData?.length || 0
      });
      setFriends(friendsData || []);
      setFriendRequests(requestsData || []);
      setLoading(false);
    } catch (err) {
      console.error('❌ Error fetching friends data:', err);
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
    try {
      console.log('🔵 Accepting friend request:', requestId);
      
      // Optimistically remove from UI immediately
      setFriendRequests(prev => prev.filter(req => req._id !== requestId));
      
      const result = await acceptFriendRequest(requestId);
      console.log('✅ Friend request accepted successfully:', result);
      
      // Re-fetch all data to update lists with server data
      await fetchFriendsData();
      setSuccess('Friend request accepted! They are now in your friends list.');
    } catch (err) {
      console.error('❌ Error accepting friend request:', err);
      // If error, refetch to restore accurate state
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
            <TabsList className="grid w-full grid-cols-3 bg-gradient-to-r from-primary/10 to-accent/10 border border-border/30 p-1 rounded-xl mb-8 backdrop-blur-sm">
              <TabsTrigger value="friends" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/30 data-[state=active]:to-accent/30 data-[state=active]:shadow-md font-medium">
                Friends ({friends.length})
              </TabsTrigger>
              <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/30 data-[state=active]:to-accent/30 data-[state=active]:shadow-md font-medium">
                Requests ({friendRequests.length})
              </TabsTrigger>
              <TabsTrigger value="add" className="rounded-lg data-[state=active]:bg-gradient-to-r data-[state=active]:from-primary/30 data-[state=active]:to-accent/30 data-[state=active]:shadow-md font-medium">
                Add Friend
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {/* Friends Tab */}
              <TabsContent value="friends" className="mt-0">
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
                    {friends.filter(friend => friend && friend._id).map(friend => (
                      <motion.div key={friend._id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <div className="group relative bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                          {/* Gradient background on hover */}
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-5">
                              <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                <AvatarImage src={friend?.profilePicture || '/avatar.svg'} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-semibold">{friend?.username?.charAt(0) || 'U'}</AvatarFallback>
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
                    ))}
                  </motion.div>
                )}
              </TabsContent>

              {/* Requests Tab */}
              <TabsContent value="requests" className="mt-0">
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
                    {friendRequests.filter(request => request && request._id && request.requester).map(request => (
                      <motion.div key={request._id} variants={itemVariants} whileHover={{ y: -4 }} transition={{ duration: 0.2 }}>
                        <div className="group relative bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-6 hover:border-primary/50 transition-all duration-300 hover:shadow-lg h-full">
                          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 rounded-2xl transition-opacity duration-300 pointer-events-none" />
                          
                          <div className="relative z-10">
                            <div className="flex items-center gap-4 mb-6">
                              <Avatar className="h-14 w-14 ring-2 ring-primary/20 group-hover:ring-primary/40 transition-all">
                                <AvatarImage src={request?.requester?.profilePicture || '/avatar.svg'} />
                                <AvatarFallback className="bg-gradient-to-br from-primary/20 to-accent/20 font-semibold">{request?.requester?.username?.charAt(0) || 'U'}</AvatarFallback>
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
                    ))}
                  </motion.div>
                )}
              </TabsContent>

              {/* Add Friend Tab */}
              <TabsContent value="add" className="mt-0">
                <motion.div key="add-friend-form" variants={itemVariants} className="flex items-center justify-center min-h-[350px]">
                  <div className="w-full max-w-md bg-gradient-to-br from-card/60 to-card/40 backdrop-blur-md border border-border/50 rounded-2xl p-8">
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
