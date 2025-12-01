import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import {
  Calendar as CalendarIcon,
  Loader2,
  PlusCircle,
  MapPin,
  Users,
  Sparkles,
  ArrowLeft,
  Clock,
  ShieldCheck
} from 'lucide-react';
import { format, isBefore, parseISO, startOfDay, isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';

import { getActivityById, updateActivity } from '../api/activityService';
import { useAuth } from '../core/AuthContext';
import BeautifulBackground from '../components/effects/BeautifulBackground';
import SkeletonCard from '../components/ui/SkeletonCard';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { cn } from '../lib/utils';

const EditActivity = () => {
  const { activityId } = useParams();
  const navigate = useNavigate();
  const { currentUser } = useAuth();

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activityNotFound, setActivityNotFound] = useState(false);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    maxParticipants: ''
  });
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');

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
    const loadActivity = async () => {
      setLoading(true);
      setError('');
      setSuccess('');
      try {
        const data = await getActivityById(activityId);
        if (!data) {
          setActivityNotFound(true);
          setError('Activity not found.');
          return;
        }

        const creatorId = data?.creator?._id || data?.creator?.id || data?.creator;
        if (currentUser && creatorId && creatorId !== currentUser.id) {
          setError('Only the activity creator can edit this event.');
          setActivityNotFound(true);
          return;
        }

        const safeDate = data.date ? new Date(data.date) : null;
        const validDate = safeDate && !Number.isNaN(safeDate.getTime()) ? safeDate : null;
        const derivedTime = data.time || (validDate ? format(validDate, 'HH:mm') : '');

        setFormData({
          title: data.title || '',
          description: data.description || '',
          location: data.location || '',
          category: data.category || '',
          maxParticipants: data.maxParticipants ? String(data.maxParticipants) : ''
        });
        setDate(validDate);
        setTime(derivedTime);
        setActivityNotFound(false);
      } catch (err) {
        console.error('Failed to load activity for editing:', err);
        setActivityNotFound(true);
        setError('Unable to load this activity right now.');
      } finally {
        setLoading(false);
      }
    };

    loadActivity();
  }, [activityId, currentUser]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleDateSelect = (selectedDate) => {
    const today = startOfDay(new Date());
    if (selectedDate && isBefore(selectedDate, today)) {
      setError('Cannot select a date in the past.');
      return;
    }
    setDate(selectedDate);
    setError('');
  };

  const handleTimeChange = (event) => {
    const selectedTime = event.target.value;
    setTime(selectedTime);

    if (date && isToday(date)) {
      const now = new Date();
      const selectedDateTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${selectedTime}`);

      if (isBefore(selectedDateTime, now)) {
        setError('Cannot set a past time for today.');
        return;
      }
    }

    setError('');
  };

  const parsedMaxParticipants = useMemo(() => {
    if (!formData.maxParticipants) return null;
    const parsed = parseInt(formData.maxParticipants, 10);
    return Number.isFinite(parsed) && parsed > 0 ? parsed : null;
  }, [formData.maxParticipants]);

  const validateForm = () => {
    if (!formData.title.trim() || !formData.description.trim() || !formData.location.trim() || !formData.category) {
      setError('Please complete all required fields.');
      return false;
    }

    if (!date) {
      setError('Please select a date.');
      return false;
    }

    if (!time) {
      setError('Please choose a time.');
      return false;
    }

    if (formData.maxParticipants && !parsedMaxParticipants) {
      setError('Max participants must be a positive number.');
      return false;
    }

    return true;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    setSaving(true);
    setError('');
    setSuccess('');

    const payload = {
      title: formData.title.trim(),
      description: formData.description.trim(),
      location: formData.location.trim(),
      category: formData.category,
      maxParticipants: parsedMaxParticipants ?? undefined,
      date: format(date, 'yyyy-MM-dd'),
      time
    };

    try {
      const updated = await updateActivity(activityId, payload);
      setSuccess('Activity updated successfully.');
      setTimeout(() => {
        navigate(`/activities/${activityId}`, { replace: true, state: { refresh: true, activity: updated } });
      }, 600);
    } catch (err) {
      console.error('Error updating activity:', err);
      const message = err?.response?.data?.message || 'Failed to update the activity. Please try again.';
      setError(message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <BeautifulBackground>
        <div className="relative z-10 w-full max-w-6xl mx-auto px-4 md:px-6 lg:px-8 py-10">
          <div className="flex items-center gap-3 mb-8 text-muted-foreground">
            <div className="h-10 w-10 rounded-full bg-muted/40 animate-pulse" />
            <div>
              <div className="h-4 w-32 bg-muted/40 rounded animate-pulse mb-2" />
              <div className="h-3 w-48 bg-muted/30 rounded animate-pulse" />
            </div>
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2">
              <SkeletonCard />
            </div>
            <SkeletonCard />
          </div>
        </div>
      </BeautifulBackground>
    );
  }

  if (activityNotFound) {
    return (
      <BeautifulBackground>
        <div className="relative z-10 flex flex-col items-center justify-center min-h-[70vh] px-4 text-center">
          <div className="max-w-md space-y-4">
            <ShieldCheck className="mx-auto h-12 w-12 text-primary/80" />
            <h1 className="text-3xl font-semibold gradient-text">{error || 'Activity unavailable'}</h1>
            <p className="text-muted-foreground">
              {error || 'We could not find this activity or you may not have permission to edit it.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button asChild variant="outline">
                <Link to={`/activities/${activityId}`}>Back to activity</Link>
              </Button>
              <Button asChild>
                <Link to="/activities">Browse other activities</Link>
              </Button>
            </div>
          </div>
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
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8 pb-10">
          <motion.div variants={itemVariants} className="flex flex-col gap-4 pt-6 md:pt-10 pb-4">
            <Button
              variant="ghost"
              className="w-fit px-0 h-auto text-muted-foreground hover:text-primary"
              asChild
            >
              <Link to={`/activities/${activityId}`} className="inline-flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to activity
              </Link>
            </Button>
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
                Edit Activity
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
                Keep details up to date so members know exactly what to expect.
              </p>
            </div>
          </motion.div>

          <AnimatePresence>
            {error && (
              <motion.div
                key="error-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 rounded-xl bg-destructive/10 border border-destructive/30 px-5 py-4 text-destructive"
              >
                {error}
              </motion.div>
            )}
            {success && !error && (
              <motion.div
                key="success-banner"
                initial={{ opacity: 0, y: -8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                className="mb-6 rounded-xl bg-emerald-100/20 border border-emerald-400/40 px-5 py-4 text-emerald-600 dark:text-emerald-300"
              >
                {success}
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div variants={itemVariants} className="pb-8">
            <div className="bg-card/60 backdrop-blur-sm border border-border/60 rounded-2xl p-6 md:p-8 lg:p-10 shadow-lg/20">
              <form onSubmit={handleSubmit} className="space-y-8">

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <h2 className="text-lg font-semibold text-foreground">Activity Details</h2>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <PlusCircle className="w-4 h-4 text-primary" />
                        Activity Title
                      </label>
                      <Input
                        type="text"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="e.g., Weekend Basketball Meetup"
                        required
                        className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-primary" />
                        Category
                      </label>
                      <Select value={formData.category} onValueChange={(value) => setFormData((prev) => ({ ...prev, category: value }))}>
                        <SelectTrigger className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent className="bg-background border border-border rounded-xl shadow-lg">
                          <SelectItem value="sports">🏀 Sports & Fitness</SelectItem>
                          <SelectItem value="social">🎉 Social</SelectItem>
                          <SelectItem value="educational">📚 Educational</SelectItem>
                          <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                          <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                          <SelectItem value="other">✨ Other</SelectItem>
                        </SelectContent>
                      </Select>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-primary" />
                        Location
                      </label>
                      <Input
                        type="text"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="e.g., Community Sports Complex"
                        required
                        className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Users className="w-4 h-4 text-primary" />
                        Max Participants
                      </label>
                      <Input
                        type="number"
                        name="maxParticipants"
                        value={formData.maxParticipants}
                        onChange={handleChange}
                        placeholder="Leave blank for unlimited"
                        min="1"
                        className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <CalendarIcon className="w-4 h-4 text-primary" />
                        Date
                      </label>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            className={cn(
                              'w-full h-11 bg-background border border-border/50 rounded-lg hover:border-border focus:ring-2 focus:ring-primary/50 justify-start text-left font-normal',
                              !date && 'text-muted-foreground'
                            )}
                          >
                            <CalendarIcon className="mr-2 h-4 w-4" />
                            {date ? format(date, 'MMM dd, yyyy') : 'Pick a date'}
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0 bg-background border border-border rounded-xl" align="start">
                          <Calendar
                            mode="single"
                            selected={date}
                            onSelect={handleDateSelect}
                            initialFocus
                            disabled={(current) => isBefore(current, startOfDay(new Date()))}
                          />
                        </PopoverContent>
                      </Popover>
                    </motion.div>

                    <motion.div variants={itemVariants} className="space-y-2.5">
                      <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                        <Clock className="w-4 h-4 text-primary" />
                        Time
                      </label>
                      <Input
                        type="time"
                        value={time}
                        onChange={handleTimeChange}
                        required
                        className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                      />
                    </motion.div>
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="flex items-center gap-3">
                    <div className="h-px flex-1 bg-border"></div>
                    <h2 className="text-lg font-semibold text-foreground">Description</h2>
                    <div className="h-px flex-1 bg-border"></div>
                  </div>
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground">Tell members what&apos;s changed</label>
                    <Textarea
                      name="description"
                      value={formData.description}
                      onChange={handleChange}
                      placeholder="Share the agenda, who should join, what to bring, and any updates."
                      required
                      rows={6}
                      className="bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                    />
                    <p className="text-xs text-muted-foreground">Be clear and friendly—details help boost engagement.</p>
                  </motion.div>
                </div>

                <motion.div variants={itemVariants} className="pt-2 flex flex-col-reverse sm:flex-row sm:justify-between sm:items-center gap-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => navigate(-1)}
                    className="sm:w-auto"
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    className="sm:w-auto"
                    disabled={saving}
                  >
                    {saving ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Saving changes
                      </>
                    ) : (
                      'Save changes'
                    )}
                  </Button>
                </motion.div>
              </form>
            </div>
          </motion.div>
        </div>
      </motion.div>
    </BeautifulBackground>
  );
};

export default EditActivity;
