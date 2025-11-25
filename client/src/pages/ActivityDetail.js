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

          <Card className="overflow-hidden bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl">
            {activity.image && (
              <div className="relative">
                <img src={activity.image} alt={activity.title} className="w-full h-64 object-cover" />
                <div className="absolute inset-0 bg-[#313647]/40 backdrop-blur-sm" />
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-[#A3B087] text-white font-semibold border-0">{activity.category}</Badge>
                    {spotsLeft !== null && (
                      <Badge className={`${spotsLeft === 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'} font-semibold border-0`}>
                        {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge className="bg-[#313647] text-white font-semibold border-2 border-[#A3B087]">You host this</Badge>
                    )}
                    {!isCreator && hasJoined && (
                      <Badge className="bg-[#A3B087]/80 text-white font-semibold border-0">You joined</Badge>
                    )}
                  </div>
                  <CardTitle className="text-4xl font-bold text-white drop-shadow-2xl">{activity.title}</CardTitle>
                </div>
              </div>
            )}
            {!activity.image && (
              <div className="relative h-48 bg-[#313647]">
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <div className="flex flex-wrap items-center gap-2 mb-3">
                    <Badge className="bg-[#A3B087] text-white font-semibold border-0">{activity.category}</Badge>
                    {spotsLeft !== null && (
                      <Badge className={`${spotsLeft === 0 ? 'bg-red-500 text-white' : 'bg-emerald-500 text-white'} font-semibold border-0`}>
                        {spotsLeft === 0 ? 'Full' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} left`}
                      </Badge>
                    )}
                    {isCreator && (
                      <Badge className="bg-white/10 text-white font-semibold border-2 border-[#A3B087]">You host this</Badge>
                    )}
                    {!isCreator && hasJoined && (
                      <Badge className="bg-[#A3B087]/80 text-white font-semibold border-0">You joined</Badge>
                    )}
                  </div>
                  <CardTitle className="text-4xl font-bold text-white drop-shadow-2xl">{activity.title}</CardTitle>
                </div>
              </div>
            )}
            <div className="p-6">
              <div className="flex items-center gap-3 p-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl hover:border-border transition-all duration-300">
                <Avatar className="h-14 w-14 ring-2 ring-[#A3B087]">
                  <AvatarImage src={activity.creator?.profilePicture || '/avatar.svg'} />
                  <AvatarFallback className="bg-primary/20 text-primary text-lg">
                    {activity.creator?.username?.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-xs text-gray-400 font-semibold uppercase tracking-wide">Organized by</p>
                  <Link to={creatorId ? `/profile/${creatorId}` : '#'} className="font-bold text-white hover:text-[#A3B087] transition-colors text-lg">
                    {activity.creator?.username || 'Unknown'}
                  </Link>
                </div>
              </div>
            </div>
            <CardContent className="p-6 pt-0 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-border hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#A3B087]/20 text-[#A3B087] p-3 group-hover:bg-[#A3B087] group-hover:text-white transition-all duration-300">
                      <Calendar className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">WHEN</p>
                      <p className="font-bold text-white text-lg">{new Date(activity.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</p>
                      <p className="text-sm text-gray-300 flex items-center gap-1 mt-1">
                        <Clock className="h-4 w-4" /> {activity.time || 'Time TBA'}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-border hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#A3B087]/20 text-[#A3B087] p-3 group-hover:bg-[#A3B087] group-hover:text-white transition-all duration-300">
                      <MapPin className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">WHERE</p>
                      <p className="font-bold text-white leading-tight line-clamp-2">{activity.location}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 hover:border-border hover:shadow-lg transition-all duration-300 group">
                  <div className="flex items-center gap-3">
                    <div className="rounded-xl bg-[#A3B087]/20 text-[#A3B087] p-3 group-hover:bg-[#A3B087] group-hover:text-white transition-all duration-300">
                      <Users className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-xs uppercase tracking-wider text-gray-400 font-bold mb-1">Capacity</p>
                      <p className="font-bold text-white text-lg">{participantsCount}{maxParticipantsValue ? ` / ${maxParticipantsValue}` : ' attending'}</p>
                      {spotsLeft !== null && (
                        <p className={`text-sm font-bold mt-1 ${spotsLeft === 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                          {spotsLeft === 0 ? 'Full' : `${spotsLeft} remaining`}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4 bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-6">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                    <Target className="h-6 w-6 text-[#A3B087]" />
                  </div>
                  <h3 className="text-2xl font-bold text-white">About this activity</h3>
                </div>
                <p className="text-gray-200 leading-relaxed whitespace-pre-line text-base">
                  {activity.description}
                </p>
              </div>
            </CardContent>
          </Card>

          <motion.div variants={itemVariants}>
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-[#A3B087]/20 flex items-center justify-center">
                <Target className="h-6 w-6 text-[#A3B087]" />
              </div>
              <h3 className="text-3xl font-bold text-white">Similar Activities</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {similarActivities.length > 0 ? (
                similarActivities.map(act => (
                  <Card key={act._id} className="bg-card/50 backdrop-blur-sm border border-border/50 hover:border-border hover:shadow-2xl hover:scale-105 transition-all duration-300 rounded-2xl overflow-hidden group">
                    <CardHeader className="bg-primary/20 border-b border-border/50 p-5">
                      <CardTitle className="text-xl font-bold group-hover:text-primary transition-colors">{act.title}</CardTitle>
                      <CardDescription className="capitalize font-semibold">{act.category}</CardDescription>
                    </CardHeader>
                    <CardContent className="p-5">
                      <p className="text-gray-300 line-clamp-2 mb-4">{act.description}</p>
                      <Button asChild variant="link" className="p-0 h-auto text-[#A3B087] hover:text-[#313647] font-bold">
                        <Link to={`/activities/${act._id}`}>View details →</Link>
                      </Button>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-gray-400 col-span-2 text-center py-8">No similar activities found.</p>
              )}
            </div>
          </motion.div>
        </motion.div>

        <div className="xl:col-span-4 space-y-6">
          <motion.div variants={itemVariants} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden sticky top-24">
            <CardHeader className="pb-4 bg-primary/20 border-b border-border/50 p-6">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Participation
              </CardTitle>
              <CardDescription className="text-gray-200 font-medium mt-2">
                {isCreator ? 'Manage your attendees and keep everything organised.' : isFull ? 'This activity has reached capacity.' : 'Secure your spot before it fills up!'}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4 p-6">
              {isCreator ? (
                <div className="flex flex-col gap-3">
                  <Button asChild className="bg-[#435663] hover:bg-[#A3B087] text-white font-bold py-6 rounded-xl transition-all duration-300">
                    <Link to={`/activities/edit/${activityId}`}>
                      <Edit className="mr-2 h-5 w-5" /> Edit Activity
                    </Link>
                  </Button>
                  <Button variant="destructive" onClick={() => setShowConfirmDelete(true)} className="py-6 rounded-xl font-bold" disabled={actionLoading}>
                    {actionLoading ? <Loader2 className="animate-spin mr-2 h-5 w-5" /> : <Trash2 className="mr-2 h-5 w-5" />} Delete Activity
                  </Button>
                </div>
              ) : hasJoined ? (
                <Button onClick={handleLeave} disabled={actionLoading} variant="outline" className="w-full py-6 rounded-xl border-2 border-[#A3B087] hover:border-red-500 hover:text-red-500 font-bold transition-all duration-300 text-white">
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : 'Leave Activity'}
                </Button>
              ) : (
                <Button 
                  onClick={handleJoin} 
                  disabled={actionLoading || !canJoin} 
                  className="w-full py-6 rounded-xl bg-[#435663] hover:bg-[#A3B087] text-white font-bold text-lg transition-all duration-300 disabled:opacity-50"
                >
                  {actionLoading ? <Loader2 className="animate-spin mr-2" /> : isFull ? 'Activity Full' : 'Join Activity'}
                </Button>
              )}

              <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-5 space-y-3">
                <div className="flex items-center gap-3 text-white">
                  <div className="w-10 h-10 rounded-lg bg-[#A3B087]/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-[#A3B087]" />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-gray-400 uppercase">Attendance</p>
                    <span className="font-bold text-lg">{participantsCount}{maxParticipantsValue ? ` / ${maxParticipantsValue}` : ''} people</span>
                  </div>
                </div>
                {spotsLeft !== null && (
                  <p className={`text-sm font-bold px-3 py-2 rounded-lg ${spotsLeft === 0 ? 'bg-red-900/30 text-red-300' : 'bg-emerald-900/30 text-emerald-300'}`}>
                    {spotsLeft === 0 ? 'No spots remaining' : `${spotsLeft} spot${spotsLeft === 1 ? '' : 's'} available`}
                  </p>
                )}
                {isCreator && (
                  <p className="text-xs text-gray-400 bg-[#435663]/30 p-3 rounded-lg border border-[#A3B087]">
                    Attendees automatically gain access to the group chat.
                  </p>
                )}
              </div>
            </CardContent>
          </motion.div>

          <motion.div variants={itemVariants} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
            <CardHeader className="bg-primary/20 border-b border-border/50 p-6">
              <CardTitle className="text-2xl font-bold flex items-center gap-2">
                <Users className="h-6 w-6" />
                Participants ({participantsCount}{maxParticipantsValue ? `/${maxParticipantsValue}` : ''})
              </CardTitle>
            </CardHeader>
            <CardContent className="p-6">
              <div className="space-y-3">
                {participants.length > 0 ? (
                  participants.map(p => {
                    const isParticipantCreator = p._id === creatorId;
                    const participantName = p.username || p.name || 'Participant';
                    const participantAvatar = p.profilePicture || '/avatar.svg';
                    const isFriend = friendIds.includes(p._id);
                    const participantKey = p._id || participantName;

                    return (
                      <div key={participantKey} className="flex items-center justify-between p-4 hover:bg-[#435663]/30 rounded-xl transition-all duration-300 border border-border/50 hover:border-[#A3B087]/50 group">
                        <Link to={p._id ? `/profile/${p._id}` : '#'} className="flex items-center flex-1 min-w-0">
                          <Avatar className="h-12 w-12 mr-3 ring-2 ring-primary/50 group-hover:ring-primary transition-all">
                            <AvatarImage src={participantAvatar} />
                            <AvatarFallback className="bg-primary/20 text-primary font-bold">
                              {participantName.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-white group-hover:text-[#A3B087] transition-colors truncate">{participantName}</span>
                              {isParticipantCreator && (
                                <Badge className="text-xs bg-[#A3B087] text-white border-0">Host</Badge>
                              )}
                            </div>
                            {isFriend && (
                              <span className="text-xs text-gray-400 font-semibold">Friend</span>
                            )}
                          </div>
                        </Link>

                        <div className="flex items-center gap-2">
                          {currentUserId && p._id && currentUserId !== p._id && (
                            <Button 
                              size="sm" 
                              variant="outline"
                              asChild
                              className="h-10 w-10 p-0 border-2 border-[#435663]/30 hover:border-[#A3B087] hover:bg-[#A3B087]/10 rounded-xl"
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
                              className="h-10 w-10 p-0 bg-[#A3B087] hover:bg-[#313647] rounded-xl"
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
                              className="h-10 w-10 p-0 rounded-xl"
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
                  <div className="text-center py-8">
                    <Users className="h-16 w-16 mx-auto text-gray-400 mb-3" />
                    <p className="text-gray-400 font-medium">No participants yet. Be the first to join!</p>
                  </div>
                )}
              </div>
            </CardContent>
          </motion.div>

          {hasJoined && (
            <motion.div variants={itemVariants} className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl shadow-xl overflow-hidden">
              <CardHeader className="bg-primary/20 border-b border-border/50 p-6">
                <CardTitle className="text-2xl font-bold flex items-center gap-2">
                  <MessageSquare className="h-6 w-6" />
                  Group Chat
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
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
    </BeautifulBackground>
  );
};

export default ActivityDetail;
