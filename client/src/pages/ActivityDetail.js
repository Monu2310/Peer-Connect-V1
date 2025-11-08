import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { getActivityById, joinActivity, leaveActivity, deleteActivity, removeParticipant } from '../api/activityService';
import { getSimilarActivities } from '../api/recommendationService';
import { sendFriendRequestById } from '../api/friendService';
import { getFriends } from '../api/friendService';
import { useAuth } from '../core/AuthContext';
import ActivityGroupChat from '../components/ActivityGroupChat';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { Badge } from '../components/ui/badge';
import { Calendar, MapPin, Users, Trash2, Edit, UserPlus, Loader2, CheckCircle, MessageSquare, UserMinus, Clock, Target } from 'lucide-react';
import SkeletonCard from '../components/ui/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';

const ActivityDetail = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser, loading: authLoading } = useAuth();
  const [activity, setActivity] = useState(null);
  const [similarActivities, setSimilarActivities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
        const activityData = await getActivityById(activityId);
        const [similarResult, friendsResult] = await Promise.allSettled([
          getSimilarActivities(activityId),
          getFriends(),
        ]);

        if (similarResult.status === 'rejected') {
          console.error('Failed to load similar activities:', similarResult.reason);
        }
        if (friendsResult.status === 'rejected') {
          console.warn('Unable to load friends list:', friendsResult.reason);
        }

        setActivity(activityData);
        setSimilarActivities(similarResult.status === 'fulfilled' ? similarResult.value : []);
        setFriendsList(friendsResult.status === 'fulfilled' ? friendsResult.value : []);
        setError('');
        setSuccess('');
      } catch (err) {
        console.error('Failed to load activity details:', err);
        setActivity(null);
        setError('Failed to load activity details.');
      } finally {
        setLoading(false);
      }
    };
    fetchActivityData();
  }, [activityId]);

  const normalizeId = (value) => {
    if (!value) return null;
    if (typeof value === 'string') return value;
    if (typeof value === 'object') {
      return value._id || value.id || null;
    }
    return null;
  };

  const currentUserId = normalizeId(currentUser);
  const creatorId = normalizeId(activity?.creator);

  const participants = useMemo(() => (
    Array.isArray(activity?.participants)
      ? activity.participants.map(participant => {
          if (participant && typeof participant === 'object') {
            return {
              ...participant,
              _id: normalizeId(participant)
            };
          }
          return { _id: normalizeId(participant) };
        })
      : []
  ), [activity]);

  const friendIds = useMemo(() => (
    Array.isArray(friendsList)
      ? friendsList.map(friend => normalizeId(friend))
      : []
  ), [friendsList]);

  const participantsCount = participants.length;
  const rawMaxParticipants = activity?.maxParticipants;
  const parsedMaxParticipants = typeof rawMaxParticipants === 'number'
    ? rawMaxParticipants
    : rawMaxParticipants !== undefined && rawMaxParticipants !== null
      ? Number(rawMaxParticipants)
      : null;
  const maxParticipantsValue = Number.isFinite(parsedMaxParticipants) ? parsedMaxParticipants : null;

  const isCreator = Boolean(currentUserId && creatorId && creatorId === currentUserId);

  const hasJoined = useMemo(() => {
    if (!currentUserId) return false;
    return participants.some(participant => participant._id === currentUserId);
  }, [participants, currentUserId]);

  const spotsLeft = useMemo(() => {
    if (!maxParticipantsValue || typeof maxParticipantsValue !== 'number') return null;
    return Math.max(maxParticipantsValue - participantsCount, 0);
  }, [maxParticipantsValue, participantsCount]);

  const isFull = Boolean(maxParticipantsValue) && spotsLeft === 0;
  const canJoin = !authLoading && !isCreator && !hasJoined && !isFull;

  const handleJoin = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const updatedActivity = await joinActivity(activityId);
      setActivity(updatedActivity);
      setSuccess('You have successfully joined this activity.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to join activity.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleLeave = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const updatedActivity = await leaveActivity(activityId);
      setActivity(updatedActivity);
      setSuccess('You have left this activity.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to leave activity.';
      setError(message);
    } finally {
      setActionLoading(false);
    }
  };

  const handleDelete = async () => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteActivity(activityId);
      navigate('/activities');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete activity.';
      setError(message);
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

  const handleRemoveParticipant = async (userId) => {
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      const updatedActivity = await removeParticipant(activityId, userId);
      setActivity(updatedActivity);
      setSuccess('Participant removed successfully.');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to remove participant.';
      setError(message);
    } finally {
      setActionLoading(false);
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

  if (!activity) return (
    <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
      <h2 className="text-2xl font-bold">{error ? 'Error loading activity.' : 'Activity not found.'}</h2>
      <p>{error || 'The activity you are looking for does not exist or has been deleted.'}</p>
    </div>
  );

  return (
    <motion.div 
      className="container mx-auto p-4 sm:p-6 lg:p-8 bg-background text-foreground"
      variants={containerVariants}
      initial="hidden"
      animate="show"
    >
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        <motion.div variants={itemVariants} className="xl:col-span-8 space-y-6">
          {(error || success) && (
            <AnimatePresence mode="wait">
              {error && (
                <motion.div
                  key="error-banner"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-destructive/40 bg-destructive/10 text-destructive px-4 py-3"
                >
                  {error}
                </motion.div>
              )}
              {!error && success && (
                <motion.div
                  key="success-banner"
                  initial={{ opacity: 0, y: -6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="rounded-xl border border-emerald-400/40 bg-emerald-400/10 text-emerald-600 px-4 py-3 dark:text-emerald-300"
                >
                  {success}
                </motion.div>
              )}
            </AnimatePresence>
          )}

          <Card className="overflow-hidden border border-border/60 bg-card/70 backdrop-blur">
            {activity.image && (
              <div className="relative">
                <img src={activity.image} alt={activity.title} className="w-full h-64 object-cover" />
                <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background/95 to-transparent" />
              </div>
            )}
            <div className="p-6">
              <div className="flex flex-wrap items-center gap-2">
                <Badge className="bg-primary/15 text-primary">{activity.category}</Badge>
                {spotsLeft !== null && (
                  <Badge className={`${spotsLeft === 0 ? 'bg-destructive/15 text-destructive' : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300'}`}>
                    {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                  </Badge>
                )}
                {isCreator && (
                  <Badge className="bg-primary text-primary-foreground">You host this</Badge>
                )}
                {!isCreator && hasJoined && (
                  <Badge className="bg-primary/15 text-primary">You joined</Badge>
                )}
              </div>
              <CardTitle className="mt-2 text-4xl font-bold gradient-text">{activity.title}</CardTitle>
              <div className="flex items-center mt-4 text-muted-foreground">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={activity.creator?.profilePicture || '/avatar.svg'} />
                  <AvatarFallback>{activity.creator?.username?.charAt(0)}</AvatarFallback>
                </Avatar>
                <Link to={creatorId ? `/profile/${creatorId}` : '#'} className="font-medium hover:underline text-primary">
                  Organized by {activity.creator?.username || 'Unknown' }
                </Link>
              </div>
            </div>
            <CardContent className="p-6 pt-0 space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 text-primary p-2">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Happening</p>
                      <p className="font-semibold leading-tight">{new Date(activity.date).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground flex items-center gap-2"><Clock className="h-4 w-4" /> {activity.time || 'Time TBA'}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 text-primary p-2">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Location</p>
                      <p className="font-semibold leading-tight line-clamp-2">{activity.location}</p>
                    </div>
                  </div>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
                  <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-primary/10 text-primary p-2">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wide text-muted-foreground">Capacity</p>
                      <p className="font-semibold leading-tight">{participantsCount}{maxParticipantsValue ? ` / ${maxParticipantsValue}` : ''}</p>
                      {spotsLeft !== null && (
                        <p className={`text-xs font-semibold ${spotsLeft === 0 ? 'text-destructive' : 'text-primary'}`}>
                          {spotsLeft === 0 ? 'No spots left' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <h3 className="text-xl font-bold gradient-text">About this activity</h3>
                </div>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-line bg-muted/20 border border-border/40 rounded-xl p-5">
                  {activity.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <motion.div variants={itemVariants}>
            <h3 className="text-2xl font-bold mb-4 gradient-text">Similar Activities</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {similarActivities.length > 0 ? (
                similarActivities.map(act => (
                  <Card key={act._id} className="hover:shadow-lg transition-shadow duration-300 border border-border/60 bg-card/60">
                    <CardHeader>
                      <CardTitle>{act.title}</CardTitle>
                      <CardDescription className="capitalize">{act.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground line-clamp-2">{act.description}</p>
                      <Button asChild variant="link" className="p-0 h-auto mt-2 text-primary hover:underline">
                        <Link to={`/activities/${act._id}`}>View details</Link>
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

        <div className="xl:col-span-4 space-y-6">
          <motion.div variants={itemVariants} className="card sticky top-24">
            <CardHeader className="pb-4">
              <CardTitle className="gradient-text">Participation</CardTitle>
              <CardDescription className="text-muted-foreground">
                {isCreator ? 'Manage your attendees and keep everything organised.' : isFull ? 'This activity has reached capacity.' : 'Secure your spot before it fills up.'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {isCreator ? (
                <div className="flex flex-col gap-3 sm:flex-row">
                  <Button asChild variant="outline" className="flex-1">
                    <Link to={`/activities/edit/${activityId}`}><Edit className="mr-2 h-4 w-4" /> Edit activity</Link>
                  </Button>
                  <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} className="flex-1" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin mr-2" /> : <Trash2 className="mr-2 h-4 w-4" />} Delete
                  </Button>
                </div>
              ) : hasJoined ? (
                <Button onClick={handleLeave} disabled={actionLoading} variant="outline" className="w-full">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Leave activity'}
                </Button>
              ) : (
                <Button onClick={handleJoin} disabled={actionLoading || !canJoin} className="w-full">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : isFull ? 'Activity full' : 'Join activity'}
                </Button>
              )}

              <div className="rounded-xl border border-border/60 bg-muted/30 p-4 space-y-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Users className="h-4 w-4" />
                  <span>{participantsCount}{maxParticipantsValue ? ` / ${maxParticipantsValue}` : ''} attending</span>
                </div>
                {spotsLeft !== null && (
                  <p className={`text-sm font-medium ${spotsLeft === 0 ? 'text-destructive' : 'text-primary'}`}>
                    {spotsLeft === 0 ? 'No spots remaining' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} available`}
                  </p>
                )}
                {isCreator && (
                  <p className="text-xs text-muted-foreground">Attendees automatically gain access to the group chat.</p>
                )}
              </div>
            </CardContent>
          </motion.div>

          <motion.div variants={itemVariants} className="card">
            <CardHeader>
              <CardTitle className="gradient-text">Participants ({participantsCount}{maxParticipantsValue ? `/${maxParticipantsValue}` : ''})</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {participants.length > 0 ? (
                  participants.map(p => {
                    const isParticipantCreator = p._id === creatorId;
                    const participantName = p.username || p.name || 'Participant';
                    const participantAvatar = p.profilePicture || '/avatar.svg';
                    const isFriend = friendIds.includes(p._id);
                    const participantKey = p._id || participantName;

                    return (
                      <div key={participantKey} className="flex items-center justify-between p-3 hover:bg-muted/50 rounded-lg transition border border-border/50">
                        <Link to={p._id ? `/profile/${p._id}` : '#'} className="flex items-center flex-1 min-w-0">
                          <Avatar className="h-11 w-11 mr-3 ring-2 ring-primary/20">
                            <AvatarImage src={participantAvatar} />
                            <AvatarFallback className="bg-primary/10">{participantName.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-foreground hover:underline truncate">{participantName}</span>
                              {isParticipantCreator && (
                                <Badge variant="default" className="text-xs bg-secondary">Creator</Badge>
                              )}
                            </div>
                            {isFriend && (
                              <span className="text-xs text-muted-foreground">Friend</span>
                            )}
                          </div>
                        </Link>

                        <div className="flex items-center gap-2">
                          {currentUserId && p._id && currentUserId !== p._id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              asChild
                              className="h-9 w-9 p-0"
                            >
                              <Link to={`/messages/${p._id}`}>
                                <MessageSquare className="h-4 w-4" />
                              </Link>
                            </Button>
                          )}

                          {currentUserId && p._id && currentUserId !== p._id && !isFriend && (
                            <Button 
                              size="sm" 
                              onClick={() => handleFriendRequest(p._id)} 
                              disabled={friendRequestStatus[p._id] === 'sending' || friendRequestStatus[p._id] === 'sent'} 
                              className="h-9 w-9 p-0"
                            >
                              {friendRequestStatus[p._id] === 'sending' ? (
                                <Loader2 className="animate-spin h-4 w-4" />
                              ) : friendRequestStatus[p._id] === 'sent' ? (
                                <CheckCircle className="h-4 w-4" />
                              ) : (
                                <UserPlus className="h-4 w-4" />
                              )}
                            </Button>
                          )}

                          {isCreator && p._id && !isParticipantCreator && (
                            <Button 
                              size="sm" 
                              variant="destructive"
                              onClick={() => handleRemoveParticipant(p._id)}
                              disabled={actionLoading}
                              className="h-9 w-9 p-0"
                              title="Remove participant"
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <p className="text-muted-foreground text-center py-4">No participants yet.</p>
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
