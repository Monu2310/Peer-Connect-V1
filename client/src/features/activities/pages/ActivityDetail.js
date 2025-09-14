import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getActivityById, joinActivity, leaveActivity, deleteActivity } from '../api/activityService';
import { getSimilarActivities } from '../api/recommendationService';
import { sendFriendRequestById } from '../api/friendService';
import { getFriends } from '../api/friendService';
import { useAuth } from '../contexts/AuthContext';
import ActivityGroupChat from '../components/ActivityGroupChat';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Users, Trash2, Edit, MessageSquare, UserPlus, Loader2, CheckCircle, XCircle } from 'lucide-react';
import SkeletonCard from '../components/ui/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityDetail = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [activity, setActivity] = useState(null);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [showConfirmDelete, setShowConfirmDelete] = useState(false);
  const [friendRequestStatus, setFriendRequestStatus] = useState({});
  const [friendsList, setFriendsList] = useState([]);

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
    const fetchActivityData = async () => {
      setLoading(true);
      try {
        const [activityData, similarData, friendsData] = await Promise.all([
          getActivityById(activityId),
          getSimilarActivities(activityId),
          getFriends(),
        ]);
        setActivity(activityData);
        setSimilarActivities(similarData);
        setFriendsList(friendsData);
      } catch (err) {
        setError('Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivityData();
  }, [activityId]);

  const isCreator = activity?.creator?._id === currentUser?.id;
  const hasJoined = useMemo(() => activity?.participants.some(p => p._id === currentUser?.id), [activity, currentUser]);
  const isFull = activity?.maxParticipants && activity?.participants?.length >= activity?.maxParticipants;

  const handleJoin = async () => {
    setActionLoading(true);
    try {
      const updatedActivity = await joinActivity(activityId);
      setActivity(updatedActivity);
    } catch (err) {
      setError('Failed to join activity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    try {
      const updatedActivity = await leaveActivity(activityId);
      setActivity(updatedActivity);
    } catch (err) {
      setError('Failed to leave activity.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    try {
      await deleteActivity(activityId);
      navigate('/activities');
    } catch (err) {
      setError('Failed to delete activity.');
    } finally {
      setActionLoading(false);
    }
  };
  
  const handleFriendRequest = async (targetUserId) => {
    setFriendRequestStatus(prev => ({ ...prev, [targetUserId]: 'sending' }));
    try {
      await sendFriendRequestById(targetUserId);
      setFriendRequestStatus(prev => ({ ...prev, [targetUserId]: 'sent' }));
    } catch (err) {
      setFriendRequestStatus(prev => ({ ...prev, [targetUserId]: 'error' }));
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="md:col-span-2">
            <SkeletonCard />
          </div>
          <div>
            <SkeletonCard />
          </div>
        </div>
      </div>
    );
  }

  if (error) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-destructive-foreground">
      <h2 className="text-2xl font-bold">Error</h2>
      <p>{error}</p>
    </div>
  );
  if (!activity) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
      <h2 className="text-2xl font-bold">Activity not found.</h2>
      <p>The activity you are looking for does not exist or has been deleted.</p>
    </div>
  );

  return (
    <motion.div 
      className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <motion.div variants={itemVariants} className="md:col-span-2">
          <Card className="overflow-hidden">
            {activity.image && (
              <img src={activity.image} alt={activity.title} className="w-full h-64 object-cover" />
            )}
            <div className="p-6">
              <Badge className="mb-2 bg-primary/10 text-primary hover:bg-primary/20">{activity.category}</Badge>
              <CardTitle className="mt-2 text-4xl font-bold gradient-text">{activity.title}</CardTitle>
              <div className="flex items-center mt-4 text-muted-foreground">
                <Avatar className="h-8 w-8 mr-2">
                  <AvatarImage src={activity.creator.profilePicture || '/avatar.svg'} />
                  <AvatarFallback>{activity.creator.username.charAt(0)}</AvatarFallback>
                </Avatar>
                <Link to={`/profile/${activity.creator._id}`} className="font-medium hover:underline text-primary">Organized by {activity.creator.username}</Link>
              </div>
            </div>
            <CardContent className="p-6 pt-0">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8 border-b border-border pb-6">
                <div className="flex items-center">
                  <Calendar className="h-6 w-6 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Date & Time</p>
                    <p className="font-medium">{new Date(activity.date).toLocaleString()}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <MapPin className="h-6 w-6 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Location</p>
                    <p className="font-medium">{activity.location}</p>
                  </div>
                </div>
                <div className="flex items-center">
                  <Users className="h-6 w-6 mr-3 text-primary" />
                  <div>
                    <p className="text-sm text-muted-foreground">Participants</p>
                    <p className="font-medium">{activity.participants.length} / {activity.maxParticipants || '∞'}</p>
                  </div>
                </div>
              </div>
              <h3 className="text-xl font-bold mb-4 gradient-text">About this activity</h3>
              <p className="text-muted-foreground whitespace-pre-line">{activity.description}</p>
            </CardContent>
          </Card>

          <motion.div variants={itemVariants} className="mt-8">
            <h3 className="text-2xl font-bold mb-4 gradient-text">Similar Activities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {similarActivities.length > 0 ? (
                similarActivities.map(act => (
                  <Card key={act._id} className="hover:shadow-lg transition-shadow duration-300">
                    <CardHeader>
                      <CardTitle>{act.title}</CardTitle>
                      <CardDescription>{act.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{act.description}</p>
                      <Button asChild variant="link" className="p-0 h-auto mt-2 text-primary hover:underline">
                        <Link to={`/activities/${act._id}`}>View Details</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-muted-foreground">No similar activities found.</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        <div>
          <motion.div variants={itemVariants} className="card mb-8">
            <CardHeader>
              <CardTitle className="gradient-text">Actions</CardTitle>
            </CardHeader>
            <CardContent>
              {isCreator ? (
                <div className="flex space-x-2">
                  <Button asChild variant="outline" className="btn-outline">
                    <Link to={`/activities/edit/${activityId}`}><Edit className="mr-2 h-4 w-4" /> Edit</Link>
                  </Button>
                  <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} className="btn-destructive" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                  </Button>
                </div>
              ) : hasJoined ? (
                <Button onClick={handleLeave} disabled={actionLoading} className="btn-outline w-full">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Leave Activity'}
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={actionLoading || isFull} className="btn-primary w-full">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : isFull ? 'Activity Full' : 'Join Activity'}
                </Button>
              )}
            </CardContent>
          </motion.div>

          <motion.div variants={itemVariants} className="card mb-8">
            <CardHeader>
              <CardTitle className="gradient-text">Participants ({activity.participants.length})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {activity.participants.length > 0 ? (
                  activity.participants.map(p => (
                    <div key={p._id} className="flex items-center justify-between p-2 hover:bg-muted/50 rounded-md transition">
                      <Link to={`/profile/${p._id}`} className="flex items-center">
                        <Avatar className="h-10 w-10 mr-3">
                          <AvatarImage src={p.profilePicture || '/avatar.svg'} />
                          <AvatarFallback>{p.username.charAt(0)}</AvatarFallback>
                        </Avatar>
                        <span className="font-medium text-foreground hover:underline">{p.username}</span>
                      </Link>
                      {currentUser && currentUser.id !== p._id && !friendsList.some(f => f._id === p._id || f.id === p._id) && (
                        <Button size="sm" onClick={() => handleFriendRequest(p._id)} disabled={friendRequestStatus[p._id] === 'sending' || friendRequestStatus[p._id] === 'sent'} className="btn-primary">
                          {friendRequestStatus[p._id] === 'sending' ? (
                            <Loader2 className="animate-spin h-4 w-4" />
                          ) : friendRequestStatus[p._id] === 'sent' ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <UserPlus className="h-4 w-4" />
                          )}
                        </Button>
                      )}
                    </div>
                  ))
                ) : (
                  <p className="text-muted-foreground">No participants yet.</p>
                )}
              </div>
            </CardContent>
          </motion.div>

          {hasJoined && (
            <motion.div variants={itemVariants} className="card">
              <CardHeader>
                <CardTitle className="gradient-text">Group Chat</CardTitle>
              </CardHeader>
              <CardContent>
                <ActivityGroupChat activityId={activityId} />
              </CardContent>
            </motion.div>
          )}
        </div>
      </div>
      <AnimatePresence>
        {showConfirmDelete && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <Card className="w-full max-w-md p-6">
              <CardHeader className="pb-4">
                <CardTitle className="text-2xl font-bold text-destructive">Confirm Deletion</CardTitle>
                <CardDescription>Are you sure you want to delete this activity? This action cannot be undone.</CardDescription>
              </CardHeader>
              <CardContent className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setShowConfirmDelete(false)} className="btn-outline">Cancel</Button>
                <Button variant="destructive" onClick={handleDelete} disabled={actionLoading} className="btn-destructive">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Delete'}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default ActivityDetail;