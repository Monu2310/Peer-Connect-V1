import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { getFriends, getFriendRequests, sendFriendRequestById, acceptFriendRequest, rejectFriendRequest } from '../api/friendService';
import { findUserByEmail } from '../api/userService';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { UserPlus, UserCheck, UserX, Mail, MessageSquare, Loader2, Users } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

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
      await acceptFriendRequest(requestId);
      fetchFriendsData(); // Re-fetch all data to update lists
      setSuccess('Friend request accepted!');
    } catch (err) {
      setError('Failed to accept friend request.');
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
      await rejectFriendRequest(requestId);
      fetchFriendsData(); // Re-fetch all data to update lists
      setSuccess('Friend request declined!');
    } catch (err) {
      setError('Failed to reject friend request.');
    } finally {
      setTimeout(() => setSuccess(''), 3000);
      setTimeout(() => setError(''), 5000);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
        <p className="ml-4 text-lg">Loading friends data...</p>
      </div>
    );
  }

  return (
    <motion.div 
      className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground min-h-screen"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <motion.h1 variants={itemVariants} className="text-3xl font-bold mb-6 gradient-text">My Connections</motion.h1>
      
      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-destructive/10 border-l-4 border-destructive text-destructive-foreground p-4 rounded-md"
          >
            <p className="text-sm font-medium">{error}</p>
          </motion.div>
        )}
        {success && (
          <motion.div 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="mb-4 bg-green-500/10 border-l-4 border-green-500 text-green-500 p-4 rounded-md"
          >
            <p className="text-sm font-medium">{success}</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Tabs defaultValue="friends" className="card shadow-lg">
        <TabsList className="grid w-full grid-cols-3 bg-muted/50">
          <TabsTrigger value="friends" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Friends ({friends.length})</TabsTrigger>
          <TabsTrigger value="requests" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Requests ({friendRequests.length})</TabsTrigger>
          <TabsTrigger value="add" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">Add Friend</TabsTrigger>
        </TabsList>

        <AnimatePresence mode="wait">
          <TabsContent value="friends" className="mt-6 p-4">
            {friends.length === 0 ? (
              <motion.div key="no-friends" variants={itemVariants} className="p-6 text-center text-muted-foreground">
                <Users className="h-10 w-10 mx-auto mb-4 text-muted" />
                <p className="mb-2">You don't have any friends yet.</p>
                <Button asChild className="btn-primary mt-4">
                  <Link to="/friends">Find Friends</Link>
                </Button>
              </motion.div>
            ) : (
              <motion.div key="friends-list" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {friends.filter(friend => friend && friend._id).map(friend => (
                  <motion.div key={friend._id} variants={itemVariants} whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center space-x-4 p-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend?.profilePicture || '/avatar.svg'} />
                          <AvatarFallback>{friend?.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-semibold">{friend?.username || 'Unknown'}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">{friend?.major || 'Unknown'} - {friend?.year || 'Unknown'}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex justify-end space-x-2">
                        <Button asChild variant="outline" size="sm" className="btn-outline">
                          <Link to={`/messages/${friend?._id || ''}`}><MessageSquare className="h-4 w-4" /></Link>
                        </Button>
                        <Button asChild variant="secondary" size="sm" className="btn-secondary">
                          <Link to={`/profile/${friend?._id || ''}`}>View Profile</Link>
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="requests" className="mt-6 p-4">
            {friendRequests.length === 0 ? (
              <motion.div key="no-requests" variants={itemVariants} className="p-6 text-center text-muted-foreground">
                <Mail className="h-10 w-10 mx-auto mb-4 text-muted" />
                <p>No pending friend requests.</p>
              </motion.div>
            ) : (
              <motion.div key="requests-list" variants={containerVariants} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {friendRequests.filter(request => request && request._id && request.sender).map(request => (
                  <motion.div key={request._id} variants={itemVariants} whileHover={{ scale: 1.02, boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)" }} transition={{ type: "spring", stiffness: 300, damping: 20 }}>
                    <Card className="h-full flex flex-col">
                      <CardHeader className="flex flex-row items-center space-x-4 p-4">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={request?.sender?.profilePicture || '/avatar.svg'} />
                          <AvatarFallback>{request?.sender?.username?.charAt(0) || 'U'}</AvatarFallback>
                        </Avatar>
                        <div>
                          <CardTitle className="text-lg font-semibold">{request?.sender?.username || 'Unknown'}</CardTitle>
                          <CardDescription className="text-sm text-muted-foreground">{request?.sender?.major || 'Unknown'} - {request?.sender?.year || 'Unknown'}</CardDescription>
                        </div>
                      </CardHeader>
                      <CardContent className="p-4 pt-0 flex justify-end space-x-2">
                        <Button size="sm" onClick={() => handleAcceptRequest(request?._id)} disabled={!request?._id} className="btn-primary"><UserCheck className="h-4 w-4" /></Button>
                        <Button variant="destructive" size="sm" onClick={() => handleRejectRequest(request?._id)} disabled={!request?._id} className="btn-destructive"><UserX className="h-4 w-4" /></Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </motion.div>
            )}
          </TabsContent>

          <TabsContent value="add" className="mt-6 p-4">
            <motion.div key="add-friend-form" variants={itemVariants} className="card max-w-md mx-auto shadow-lg">
              <CardHeader>
                <CardTitle className="gradient-text">Send Friend Request</CardTitle>
                <CardDescription className="text-muted-foreground">Enter the email of the user you want to add.</CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSendRequest} className="space-y-4">
                  <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-foreground">Email</label>
                    <Input id="email" type="email" value={newFriendEmail} onChange={(e) => setNewFriendEmail(e.target.value)} placeholder="friend@example.com" required />
                  </div>
                  <Button type="submit" className="w-full btn-primary" disabled={sendRequestLoading}>
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
              </CardContent>
            </motion.div>
          </TabsContent>
        </AnimatePresence>
      </Tabs>
    </motion.div>
  );
};

export default Friends;
