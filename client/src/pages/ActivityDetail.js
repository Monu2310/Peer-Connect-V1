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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '../components/ui/dialog';
import { Calendar, MapPin, Users, Trash2, Edit, UserPlus, Loader2, CheckCircle, MessageSquare, UserMinus, Clock, Target, AlertCircle, ArrowLeft, Activity } from 'lucide-react';
import SkeletonCard from '../components/ui/SkeletonCard';
import { motion, AnimatePresence } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import GlowOrb from '../components/effects/GlowOrb';

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

        setActivity(activityData);
        setSimilarActivities(similarResult.status === 'fulfilled' ? similarResult.value : []);
        setFriendsList(friendsResult.status === 'fulfilled' ? friendsResult.value : []);
        setError('');
        setSuccess('');
      } catch (err) {
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
  
  // Check if activity is past
  const isActivityPast = useMemo(() => {
    if (!activity?.date) return false;
    const activityDate = new Date(activity.date);
    const now = new Date();
    
    // Reset time part of activityDate to compare dates correctly if time is separate
    const activityDateOnly = new Date(activityDate.getFullYear(), activityDate.getMonth(), activityDate.getDate());
    const todayDateOnly = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    if (activityDateOnly < todayDateOnly) return true;
    
    if (activityDateOnly.getTime() === todayDateOnly.getTime() && activity.time) {
      const [hours, minutes] = activity.time.split(':').map(Number);
      const activityTime = new Date(now);
      activityTime.setHours(hours, minutes, 0, 0);
      return now > activityTime;
    }
    
    return false;
  }, [activity]);

  const canJoin = !authLoading && !isCreator && !hasJoined && !isFull && !isActivityPast;

  const handleJoin = async () => {
    if (isActivityPast || actionLoading) return;
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
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleLeave = async () => {
    if (isActivityPast || actionLoading) return;
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
      setTimeout(() => setSuccess(''), 3000);
    }
  };

  const handleDelete = async () => {
    if (actionLoading) return;
    setActionLoading(true);
    setError('');
    setSuccess('');
    try {
      await deleteActivity(activityId);
      navigate('/activities');
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to delete activity.';
      setError(message);
      setActionLoading(false);
      setTimeout(() => setError(''), 5000);
    }
  };
  
  const handleFriendRequest = async (targetUserId, targetName) => {
    if (!targetUserId) return;
    setFriendRequestStatus(prev => ({
      ...prev,
      [targetUserId]: { state: 'sending' }
    }));
    setError('');
    setSuccess('');
    try {
      await sendFriendRequestById(targetUserId);
      setFriendRequestStatus(prev => ({
        ...prev,
        [targetUserId]: { state: 'sent' }
      }));
      const confirmation = `Friend request sent${targetName ? ` to ${targetName}` : ''}.`;
      setSuccess(confirmation);
      setTimeout(() => setSuccess(''), 4000);
      if (typeof window !== 'undefined' && window.CustomEvent) {
        window.dispatchEvent(new CustomEvent('friendRequestSent', { detail: { userId: targetUserId } }));
      }
    } catch (err) {
      const message = err?.response?.data?.message || 'Failed to send friend request.';
      setFriendRequestStatus(prev => ({
        ...prev,
        [targetUserId]: { state: 'error', message }
      }));
      setError(message);
      setTimeout(() => setError(''), 5000);
    }
  };

  const handleRemoveParticipant = async (userId) => {
    if (isActivityPast) return;
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
      <BeautifulBackground>
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
      </BeautifulBackground>
    );
  }

  if (!activity) return (
    <BeautifulBackground>
      <div className="container mx-auto p-4 sm:p-6 lg:p-8 text-center text-muted-foreground">
        <h2 className="text-2xl font-bold">{error ? 'Error loading activity.' : 'Activity not found.'}</h2>
        <p>{error || 'The activity you are looking for does not exist or has been deleted.'}</p>
        <Button asChild className="mt-4">
          <Link to="/activities">Back to Activities</Link>
        </Button>
      </div>
    </BeautifulBackground>
  );

  return (
    <BeautifulBackground>
      <GlowOrb size="large" color="primary" position="top-right" opacity={8} />
      <GlowOrb size="medium" color="accent" position="bottom-left" opacity={6} />
      
      <motion.div 
        className="relative z-10 container mx-auto p-4 sm:p-6 lg:p-8"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <motion.div variants={itemVariants} className="mb-6">
          <Button variant="ghost" asChild className="pl-0 hover:bg-transparent hover:text-primary">
            <Link to="/activities" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Activities
            </Link>
          </Button>
        </motion.div>

        <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
          <motion.div variants={itemVariants} className="xl:col-span-8 space-y-6">
            {(error || success) && (
              <AnimatePresence>
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

            <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl">
              {activity.image && (
                <div className="relative">
                  <img src={activity.image} alt={activity.title} className="w-full h-64 md:h-80 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground border-0 px-3 py-1 text-sm">{activity.category}</Badge>
                      
                      {isActivityPast ? (
                        <Badge variant="destructive" className="font-semibold border-0 px-3 py-1 text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Activity Ended
                        </Badge>
                      ) : (
                        spotsLeft !== null && (
                          <Badge className={`${spotsLeft === 0 ? 'bg-destructive' : 'bg-emerald-500'} text-white font-semibold border-0 px-3 py-1 text-sm`}>
                            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                          </Badge>
                        )
                      )}
                      
                      {isCreator && (
                        <Badge variant="outline" className="bg-background/20 backdrop-blur-md text-white border-white/30">You host this</Badge>
                      )}
                      {!isCreator && hasJoined && (
                        <Badge variant="secondary" className="bg-emerald-500/20 text-emerald-100 border-emerald-500/30">You joined</Badge>
                      )}
                    </div>
                    <CardTitle className="text-3xl md:text-4xl lg:text-5xl font-bold text-white drop-shadow-lg leading-tight">{activity.title}</CardTitle>
                  </div>
                </div>
              )}
              {!activity.image && (
                <div className="relative h-48 bg-gradient-to-br from-primary/20 to-accent/20">
                  <div className="absolute bottom-0 left-0 right-0 p-6 md:p-8">
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <Badge className="bg-primary/90 hover:bg-primary text-primary-foreground border-0 px-3 py-1 text-sm">{activity.category}</Badge>
                      {isActivityPast ? (
                        <Badge variant="destructive" className="font-semibold border-0 px-3 py-1 text-sm flex items-center gap-1">
                          <Clock className="h-3 w-3" /> Activity Ended
                        </Badge>
                      ) : (
                        spotsLeft !== null && (
                          <Badge className={`${spotsLeft === 0 ? 'bg-destructive' : 'bg-emerald-500'} text-white font-semibold border-0 px-3 py-1 text-sm`}>
                            {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                          </Badge>
                        )
                      )}
                    </div>
                    <CardTitle className="text-3xl md:text-4xl font-bold text-foreground">{activity.title}</CardTitle>
                  </div>
                </div>
              )}
              
              <CardContent className="p-6 md:p-8 space-y-8">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Calendar className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Date & Time</h3>
                        <p className="text-muted-foreground">
                          {new Date(activity.date).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
                        </p>
                        {activity.time && <p className="text-muted-foreground">{activity.time}</p>}
                      </div>
                    </div>
                    
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <MapPin className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Location</h3>
                        <p className="text-muted-foreground">{activity.location}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <Users className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Participants</h3>
                        <div className="flex items-center gap-2">
                          <p className="text-muted-foreground">
                            {participantsCount} {maxParticipantsValue ? `/ ${maxParticipantsValue}` : ''} joined
                          </p>
                          <Dialog>
                            <DialogTrigger asChild>
                              <Button variant="link" className="h-auto p-0 text-primary font-medium hover:text-primary/80">
                                View 
                              </Button>
                            </DialogTrigger>
                            <DialogContent className="bg-card border-primary/20 text-foreground max-w-md">
                              <DialogHeader>
                                <DialogTitle className="flex items-center gap-2">
                                  <Users className="h-5 w-5 text-primary" />
                                  Participants ({participantsCount})
                                </DialogTitle>
                              </DialogHeader>
                              <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar mt-4">
                                {participants.length > 0 ? (
                                  participants.map((participant) => (
                                    <div key={participant._id} className="flex items-center justify-between group p-2 rounded-lg hover:bg-accent/50 transition-colors">
                                      <Link to={`/profile/${participant._id}`} className="flex items-center gap-3 flex-1">
                                        <Avatar className="h-10 w-10 border border-border">
                                          <AvatarImage src={participant.profilePicture || '/avatar.svg'} />
                                          <AvatarFallback>{participant.username?.charAt(0).toUpperCase()}</AvatarFallback>
                                        </Avatar>
                                        <div>
                                          <p className="font-medium text-sm group-hover:text-primary transition-colors">{participant.username}</p>
                                          <div className="flex flex-wrap gap-2 mt-1">
                                            {participant._id === creatorId && (
                                              <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full">Host</span>
                                            )}
                                            {friendIds.includes(participant._id) && participant._id !== creatorId && (
                                              <span className="text-xs text-emerald-600 bg-emerald-500/10 px-2 py-0.5 rounded-full flex items-center gap-1">
                                                <CheckCircle className="h-3 w-3" /> Friend
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                      </Link>
                                      
                                      {currentUser && participant._id !== currentUserId && (
                                        <div className="flex items-center gap-1">
                                          {isCreator && (
                                            <Button
                                              variant="ghost"
                                              size="icon"
                                              className="h-8 w-8 text-destructive hover:text-destructive hover:bg-destructive/10"
                                              onClick={() => handleRemoveParticipant(participant._id)}
                                              title="Remove participant"
                                              disabled={isActivityPast}
                                            >
                                              <UserMinus className="h-4 w-4" />
                                            </Button>
                                          )}
                                          {!friendIds.includes(participant._id) && (
                                            <div className="flex flex-col items-end gap-1">
                                              <Button
                                                variant="ghost"
                                                size="icon"
                                                className="h-8 w-8 text-muted-foreground hover:text-primary"
                                                onClick={() => handleFriendRequest(participant._id, participant.username)}
                                                disabled={friendRequestStatus[participant._id]?.state === 'sent' || friendRequestStatus[participant._id]?.state === 'sending'}
                                                title={friendRequestStatus[participant._id]?.state === 'error' ? friendRequestStatus[participant._id]?.message : 'Add Friend'}
                                              >
                                                {friendRequestStatus[participant._id]?.state === 'sending' ? (
                                                  <Loader2 className="h-4 w-4 animate-spin" />
                                                ) : friendRequestStatus[participant._id]?.state === 'sent' ? (
                                                  <CheckCircle className="h-4 w-4 text-green-500" />
                                                ) : friendRequestStatus[participant._id]?.state === 'error' ? (
                                                  <AlertCircle className="h-4 w-4 text-destructive" />
                                                ) : (
                                                  <UserPlus className="h-4 w-4" />
                                                )}
                                              </Button>
                                              {friendRequestStatus[participant._id]?.state === 'error' && friendRequestStatus[participant._id]?.message && (
                                                <p className="text-[11px] text-destructive max-w-[140px] text-right leading-tight">
                                                  {friendRequestStatus[participant._id]?.message}
                                                </p>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      )}
                                    </div>
                                  ))
                                ) : (
                                  <p className="text-muted-foreground text-center py-4">No participants yet.</p>
                                )}
                              </div>
                            </DialogContent>
                          </Dialog>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-start gap-3">
                      <div className="p-2 rounded-lg bg-primary/10 text-primary mt-1">
                        <UserPlus className="h-5 w-5" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">Hosted by</h3>
                        <Link to={`/profile/${creatorId}`} className="text-primary hover:underline font-medium">
                          {activity.creator?.username || 'Unknown'}
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-3">
                  <h3 className="text-xl font-semibold flex items-center gap-2">
                    <Target className="h-5 w-5 text-primary" />
                    About this Activity
                  </h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
                    {activity.description}
                  </p>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-wrap gap-4 pt-4 border-t border-border/50">
                  {isCreator ? (
                    <>
                      <Button asChild variant="outline" className="flex-1 sm:flex-none" disabled={isActivityPast}>
                        <Link to={`/edit-activity/${activityId}`}>
                          <Edit className="mr-2 h-4 w-4" /> Edit Activity
                        </Link>
                      </Button>
                      
                      {!showConfirmDelete ? (
                        <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} className="flex-1 sm:flex-none">
                          <Trash2 className="mr-2 h-4 w-4" /> Delete Activity
                        </Button>
                      ) : (
                        <div className="flex items-center gap-2 flex-1 sm:flex-none animate-in fade-in slide-in-from-left-2">
                          <span className="text-sm text-muted-foreground hidden sm:inline">Are you sure?</span>
                          <Button variant="destructive" onClick={handleDelete} disabled={actionLoading}>
                            {actionLoading ? <Loader2 className="animate-spin h-4 w-4" /> : 'Yes, Delete'}
                          </Button>
                          <Button variant="ghost" onClick={() => setShowConfirmDelete(false)}>Cancel</Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <>
                      {hasJoined ? (
                        <Button 
                          variant="destructive" 
                          onClick={handleLeave} 
                          disabled={actionLoading || isActivityPast}
                          className="flex-1 sm:flex-none"
                        >
                          {actionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserMinus className="mr-2 h-4 w-4" />}
                          Leave Activity
                        </Button>
                      ) : (
                        <Button 
                          onClick={handleJoin} 
                          disabled={!canJoin || actionLoading || isActivityPast}
                          className="flex-1 sm:flex-none btn-primary"
                        >
                          {actionLoading ? <Loader2 className="animate-spin mr-2 h-4 w-4" /> : <UserPlus className="mr-2 h-4 w-4" />}
                          {isActivityPast ? 'Activity Ended' : isFull ? 'Activity Full' : 'Join Activity'}
                        </Button>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Sidebar */}
          <motion.div variants={itemVariants} className="xl:col-span-4 space-y-6">
            {/* Group Chat Section */}
            {(hasJoined || isCreator) && (
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg overflow-hidden">
                <CardHeader className="bg-primary/5 border-b border-border/50">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-primary" />
                    Activity Group Chat
                  </CardTitle>
                  <CardDescription>
                    Chat with other participants of this activity
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <ActivityGroupChat 
                    activityId={activityId} 
                    hasJoined={hasJoined || isCreator}
                    currentUser={currentUser}
                    isReadOnly={isActivityPast}
                  />
                </CardContent>
              </Card>
            )}

            {/* Participants Card Removed - Moved to Main Card Dialog */}

            {/* Similar Activities */}
            {similarActivities.length > 0 && (
              <Card className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-lg">
                <CardHeader>
                  <CardTitle className="text-lg">Similar Activities</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {similarActivities.slice(0, 3).map((similar) => (
                    <Link key={similar._id} to={`/activity/${similar._id}`} className="block group">
                      <div className="flex gap-3 items-start p-2 rounded-lg hover:bg-accent/50 transition-colors">
                        <div className="h-16 w-16 rounded-md overflow-hidden bg-muted flex-shrink-0">
                          {similar.image ? (
                            <img src={similar.image} alt={similar.title} className="h-full w-full object-cover" />
                          ) : (
                            <div className="h-full w-full flex items-center justify-center bg-primary/10 text-primary">
                              <Activity className="h-6 w-6" />
                            </div>
                          )}
                        </div>
                        <div>
                          <h4 className="font-medium text-sm group-hover:text-primary transition-colors line-clamp-1">{similar.title}</h4>
                          <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {new Date(similar.date).toLocaleDateString()}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5 flex items-center gap-1">
                            <MapPin className="h-3 w-3" />
                            {similar.location}
                          </p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </CardContent>
              </Card>
            )}
          </motion.div>
        </div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default ActivityDetail;
