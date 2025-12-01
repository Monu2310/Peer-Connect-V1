import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createActivity } from '../api/activityService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Clock, PlusCircle, MapPin, Users, Sparkles } from 'lucide-react';
import { format, isBefore, startOfDay, isToday, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import BeautifulBackground from '../components/effects/BeautifulBackground';

const CreateActivity = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    category: '',
    maxParticipants: '',
  });
  const [date, setDate] = useState(null);
  const [time, setTime] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { title, description, location, category, maxParticipants } = formData;

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.05 }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    show: { y: 0, opacity: 1 }
  };

  const onChange = e => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const handleTimeChange = (e) => {
    const selectedTime = e.target.value;
    setTime(selectedTime);
    
    if (date && isToday(date)) {
      const now = new Date();
      const selectedDateTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${selectedTime}`);
      
      if (isBefore(selectedDateTime, now)) {
        setError('Cannot select a time in the past for today.');
        return;
      }
    }
    setError('');
  };

  const validateDateTime = () => {
    if (!date || !time) {
      setError('Please select both date and time.');
      return false;
    }

    const now = new Date();
    const selectedDateTime = parseISO(`${format(date, 'yyyy-MM-dd')}T${time}`);
    
    if (isBefore(selectedDateTime, now)) {
      setError('Cannot create an activity in the past.');
      return false;
    }
    return true;
  };

  const onSubmit = async e => {
    e.preventDefault();
    
    if (!validateDateTime()) return;

    setLoading(true);
    setError('');

    const parsedMaxParticipants = maxParticipants ? parseInt(maxParticipants, 10) : null;

    if (parsedMaxParticipants !== null && (Number.isNaN(parsedMaxParticipants) || parsedMaxParticipants < 1)) {
      setError('Max participants must be a positive number.');
      setLoading(false);
      return;
    }

    const activityData = {
      ...formData,
      maxParticipants: parsedMaxParticipants,
      date: format(date, 'yyyy-MM-dd'),
      time: time,
    };

    try {
      const createdActivity = await createActivity(activityData);
      
      // Invalidate activity caches to refresh lists across app
      try {
        const { default: intelligentCache } = await import('../lib/intelligentCache');
        intelligentCache.invalidateByTags(['activities', 'activity-list']);
        intelligentCache.delete('activities:all');
      } catch (cacheErr) {
        console.debug('Cache invalidation skipped:', cacheErr.message);
      }
      
      // Dispatch event to refresh Activities page
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('activityCreated', { 
          detail: { activityId: createdActivity._id } 
        }));
      }
      
      // Show success message briefly before redirecting
      setError('');
      
      // Navigate to the newly created activity detail page
      if (createdActivity && createdActivity._id) {
        console.log('Navigating to activity:', createdActivity._id);
        navigate(`/activities/${createdActivity._id}`);
      } else {
        // Fallback to activities list
        navigate('/activities', { state: { refresh: true } });
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create activity. Please try again.');
      setLoading(false);
    }
  };

  return (
    <BeautifulBackground>
      <motion.div
        className="relative z-10 w-full"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        <div className="w-full max-w-7xl mx-auto px-4 md:px-6 lg:px-8">
          
          {/* Header Section - Consistent with Dashboard & Activities */}
          <motion.div variants={itemVariants} className="pt-6 md:pt-8 pb-6 md:pb-8">
            <div className="space-y-2">
              <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold gradient-text">
                Create Activity
              </h1>
              <p className="text-base md:text-lg text-muted-foreground max-w-3xl">
                Bring people together. Create an activity and start building connections.
              </p>
            </div>
          </motion.div>

          {/* Error message */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 rounded-xl bg-destructive/10 border border-destructive/30 backdrop-blur-sm"
              >
                <p className="text-destructive text-sm font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main Content */}
          <motion.div variants={itemVariants} className="pb-8">
            <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 lg:p-10">
              <form onSubmit={onSubmit} className="space-y-8">
              
              {/* Activity Details Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border"></div>
                  <h2 className="text-lg font-semibold text-foreground">Activity Details</h2>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                
                {/* Title field */}
                <motion.div variants={itemVariants} className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                    <PlusCircle className="w-4 h-4 text-primary" />
                    Activity Title
                  </label>
                  <Input
                    type="text"
                    name="title"
                    value={title}
                    onChange={onChange}
                    placeholder="e.g., Basketball Game at the Park"
                    required
                    className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </motion.div>

                  {/* Category field */}
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Category
                    </label>
                    <Select 
                      value={category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50">
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent className="bg-background border border-border rounded-lg">
                        <SelectItem value="sports">🏀 Sports & Fitness</SelectItem>
                        <SelectItem value="social">🎉 Social</SelectItem>
                        <SelectItem value="educational">📚 Educational</SelectItem>
                        <SelectItem value="entertainment">🎬 Entertainment</SelectItem>
                        <SelectItem value="volunteer">🤝 Volunteer</SelectItem>
                        <SelectItem value="other">✨ Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>

                  {/* Location field */}
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Location
                    </label>
                    <Input
                      type="text"
                      name="location"
                      value={location}
                      onChange={onChange}
                      placeholder="e.g., Central Park, Manhattan"
                      required
                      className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Schedule Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border"></div>
                  <h2 className="text-lg font-semibold text-foreground">Schedule & Capacity</h2>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                
                  {/* Date picker */}
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
                            "w-full h-11 bg-background border border-border/50 rounded-lg hover:border-border focus:ring-2 focus:ring-primary/50 justify-start text-left font-normal",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "MMM dd, yyyy") : "Pick a date"}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-background border border-border rounded-xl" align="start">
                        <Calendar
                          mode="single"
                          selected={date}
                          onSelect={handleDateSelect}
                          initialFocus
                          disabled={(date) => isBefore(date, startOfDay(new Date()))}
                        />
                      </PopoverContent>
                    </Popover>
                  </motion.div>

                  {/* Time field */}
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

                  {/* Max participants field */}
                  <motion.div variants={itemVariants} className="space-y-2.5">
                    <label className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Max Participants
                    </label>
                    <Input
                      type="number"
                      name="maxParticipants"
                      value={maxParticipants}
                      onChange={onChange}
                      placeholder="e.g., 10"
                      required
                      min="1"
                      className="h-11 bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </motion.div>
                </div>
              </div>

              {/* Description Section */}
              <div className="space-y-6">
                <div className="flex items-center gap-3">
                  <div className="h-px flex-1 bg-border"></div>
                  <h2 className="text-lg font-semibold text-foreground">Description</h2>
                  <div className="h-px flex-1 bg-border"></div>
                </div>
                
                <motion.div variants={itemVariants} className="space-y-2.5">
                  <label className="text-sm font-semibold text-foreground">Tell us about your activity</label>
                  <Textarea
                    name="description"
                    value={description}
                    onChange={onChange}
                    placeholder="Share details about your activity. What will you do? Who should join? What should they bring?"
                    required
                    rows={5}
                    className="bg-background border border-border/50 rounded-lg focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all resize-none"
                  />
                  <p className="text-xs text-muted-foreground">Be as descriptive as possible to help others understand your activity.</p>
                </motion.div>
              </div>

              {/* Submit button */}
              <motion.div variants={itemVariants} className="pt-2 flex justify-end gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/activities')}
                  className="min-h-11 px-6"
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={loading}
                  className="min-h-11 px-8 btn-gradient-primary"
                >
                  {loading ? (
                    <>
                      <Loader2 className="h-5 w-5 animate-spin mr-2" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <PlusCircle className="h-5 w-5 mr-2" />
                      Create Activity
                    </>
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

export default CreateActivity;
