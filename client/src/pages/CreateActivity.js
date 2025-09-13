import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createActivity } from '../api/activityService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Calendar } from '../components/ui/calendar';
import { Calendar as CalendarIcon, Loader2, Clock, Sparkles, MapPin, Users } from 'lucide-react';
import { format, isBefore, startOfDay, isToday, parseISO } from 'date-fns';
import { cn } from '../lib/utils';
import { motion, AnimatePresence } from 'framer-motion';

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

    const activityData = {
      ...formData,
      date: format(date, 'yyyy-MM-dd'),
      time: time,
    };

    try {
      await createActivity(activityData);
      navigate('/activities');
    } catch (err) {
      setError(err.message || 'Failed to create activity.');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* S-tier background effects */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,hsl(var(--primary)/0.1),transparent_50%)]"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_70%,hsl(var(--accent)/0.1),transparent_50%)]"></div>

      {/* Container with 8pt grid spacing */}
      <div className="relative z-10 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16 lg:py-20">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="show"
          className="max-w-4xl mx-auto"
        >
          {/* Header - Mobile-first typography */}
          <motion.div variants={itemVariants} className="text-center mb-8 md:mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-6 backdrop-blur-sm">
              <Sparkles className="w-4 h-4 text-primary" />
              <span className="text-sm font-medium text-primary">Create Something Amazing</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-4 font-heading">
              <span className="gradient-text">
                Create Activity
              </span>
            </h1>
            <p className="text-lg leading-relaxed text-muted-foreground max-w-2xl mx-auto">
              Share your passion with the world. Create an experience that brings people together.
            </p>
          </motion.div>

          {/* Error message - Consistent styling */}
          <AnimatePresence>
            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="mb-6 p-4 rounded-lg bg-destructive/10 border border-destructive/20 backdrop-blur-sm"
              >
                <p className="text-destructive text-center text-sm leading-relaxed font-medium">{error}</p>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form card - S-tier elevation and spacing */}
          <motion.div variants={itemVariants}>
            <div className="bg-card/50 backdrop-blur-md border border-border/20 rounded-lg shadow-lg p-6 md:p-8 transition-all duration-300">
              <form onSubmit={onSubmit} className="space-y-6">
                
                {/* Title and Category - Responsive grid with 8pt spacing */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Title field - Touch-friendly sizing */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <Sparkles className="w-4 h-4 text-primary" />
                      Activity Title
                    </label>
                    <Input
                      type="text"
                      name="title"
                      value={title}
                      onChange={onChange}
                      placeholder="Enter an exciting title..."
                      required
                      className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 min-h-12"
                    />
                  </motion.div>

                  {/* Category field */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Category
                    </label>
                    <Select 
                      value={category} 
                      onValueChange={(value) => setFormData({ ...formData, category: value })}
                    >
                      <SelectTrigger className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 min-h-12">
                        <SelectValue placeholder="Choose a category..." />
                      </SelectTrigger>
                      <SelectContent className="bg-card/70 backdrop-blur-lg border border-border/30 rounded-lg shadow-lg">
                        <SelectItem value="sports" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Sports & Fitness</SelectItem>
                        <SelectItem value="social" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Social</SelectItem>
                        <SelectItem value="educational" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Educational</SelectItem>
                        <SelectItem value="entertainment" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Entertainment</SelectItem>
                        <SelectItem value="volunteer" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Volunteer</SelectItem>
                        <SelectItem value="other" className="transition-all duration-200 hover:bg-muted/20 active:bg-muted/30 p-3 min-h-touch">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </motion.div>
                </div>

                {/* Description - Full width with proper spacing */}
                <motion.div variants={itemVariants} className="space-y-2">
                  <label className="text-sm font-medium text-foreground mb-2 block">Description</label>
                  <Textarea
                    name="description"
                    value={description}
                    onChange={onChange}
                    placeholder="Describe your activity in detail..."
                    required
                    rows={4}
                    className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 resize-none"
                  />
                </motion.div>

                {/* Location and Participants - Responsive grid */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Location field */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-primary" />
                      Location
                    </label>
                    <Input
                      type="text"
                      name="location"
                      value={location}
                      onChange={onChange}
                      placeholder="Where will this happen?"
                      required
                      className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 min-h-12"
                    />
                  </motion.div>

                  {/* Max participants field */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <Users className="w-4 h-4 text-primary" />
                      Max Participants
                    </label>
                    <Input
                      type="number"
                      name="maxParticipants"
                      value={maxParticipants}
                      onChange={onChange}
                      placeholder="How many people?"
                      required
                      min="1"
                      className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 min-h-12"
                    />
                  </motion.div>
                </div>

                {/* Date and Time - Mobile-first responsive */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  
                  {/* Date picker - Touch-friendly */}
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <CalendarIcon className="w-4 h-4 text-primary" />
                      Date
                    </label>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button
                          variant="outline"
                          className={cn(
                            "relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation select-none bg-secondary/50 backdrop-blur-md text-secondary-foreground border border-border/50 rounded-lg px-6 py-3 hover:bg-secondary/70 hover:border-border transform hover:scale-[1.02] active:scale-[0.98] w-full justify-start text-left min-h-safe",
                            !date && "text-muted-foreground"
                          )}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4" />
                          {date ? format(date, "PPP") : <span>Pick a date</span>}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0 bg-card/70 backdrop-blur-lg border border-border/30 rounded-lg shadow-lg" align="start">
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
                  <motion.div variants={itemVariants} className="space-y-2">
                    <label className="text-sm font-medium text-foreground mb-2 block flex items-center gap-2">
                      <Clock className="w-4 h-4 text-primary" />
                      Time
                    </label>
                    <Input
                      type="time"
                      value={time}
                      onChange={handleTimeChange}
                      required
                      className="w-full px-4 py-3 bg-input/50 backdrop-blur-sm border border-border/30 rounded-lg text-foreground placeholder:text-muted-foreground transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:border-transparent hover:border-border/50 min-h-12"
                    />
                  </motion.div>
                </div>

                {/* Submit button - Thumb-friendly with proper elevation */}
                <motion.div variants={itemVariants} className="pt-4">
                  <Button
                    type="submit"
                    disabled={loading}
                    className="btn-gradient-primary text-white rounded-lg px-6 py-3 shadow-lg transform hover:scale-[1.02] active:scale-[0.98] w-full min-h-safe text-base font-semibold relative inline-flex items-center justify-center font-medium transition-all duration-200 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring touch-manipulation select-none"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Creating Activity...
                      </>
                    ) : (
                      <>
                        <Sparkles className="mr-2 h-5 w-5" />
                        Create Activity
                      </>
                    )}
                  </Button>
                </motion.div>
                
              </form>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default CreateActivity;
