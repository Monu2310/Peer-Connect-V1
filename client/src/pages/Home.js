import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';
import { ArrowRight, Users, Search, PlusCircle, Sparkles, Zap, Heart } from 'lucide-react';

const Home = () => {
  const { isAuthenticated } = useAuth();

  const featureVariants = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } },
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.2,
        delayChildren: 0.1
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted/20 overflow-hidden">
      
      {/* Hero Section - Mobile-first with 8pt grid */}
      <section className="relative flex items-center justify-center px-4 pt-20 pb-16 md:pt-28 md:pb-24 lg:pt-32 lg:pb-32 min-h-[80vh]">
        
        {/* Background gradient orbs */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-[10%] left-[5%] w-72 h-72 md:w-96 md:h-96 bg-gradient-to-r from-primary/30 to-accent/30 rounded-full blur-3xl animate-pulse" />
          <div className="absolute bottom-[15%] right-[10%] w-64 h-64 md:w-80 md:h-80 bg-gradient-to-r from-accent/20 to-primary/20 rounded-full blur-3xl animate-pulse delay-700" />
          <div className="absolute top-1/2 right-[5%] w-48 h-48 md:w-64 md:h-64 bg-gradient-to-r from-secondary/25 to-primary/25 rounded-full blur-3xl animate-pulse delay-1000" />
        </div>

        <div className="relative z-10 w-full max-w-6xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 32, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            {/* Badge */}
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 md:px-6 md:py-3 rounded-full bg-primary/10 border border-primary/20 mb-4 md:mb-6 backdrop-blur-sm"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Sparkles className="w-4 h-4 md:w-5 md:h-5 text-primary" />
              <span className="text-xs md:text-sm font-semibold gradient-text">
                New & Improved Experience
              </span>
            </motion.div>
            
            {/* Main heading with responsive typography */}
            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold tracking-tight mb-4 md:mb-6 leading-tight"
            >
              <span className="block gradient-text">
                Connect with Your
              </span>
              <span className="block gradient-text-2">
                Peers, Effortlessly
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.5 }}
              className="text-base sm:text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-4xl mx-auto mb-6 md:mb-10 leading-relaxed px-4"
            >
              Discover a world of possibilities with <span className="gradient-text font-semibold">PeerConnect</span>. 
              From study groups to weekend adventures, find your tribe and create unforgettable experiences.
            </motion.p>
            
            {/* CTA buttons with touch-friendly sizing */}
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.7 }}
              className="flex flex-col sm:flex-row gap-4 justify-center items-center px-4"
            >
              {isAuthenticated ? (
                <Button 
                  asChild 
                  size="lg" 
                  className="w-full sm:w-auto min-h-12 btn-gradient-primary text-white font-semibold px-8 py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                >
                  <Link to="/dashboard" className="flex items-center justify-center gap-3">
                    <Zap className="w-5 h-5" />
                    Go to Dashboard 
                    <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                  </Link>
                </Button>
              ) : (
                <>
                  <Button 
                    asChild 
                    size="lg" 
                    className="w-full sm:w-auto min-h-12 btn-gradient-primary text-white font-semibold px-8 py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300"
                  >
                    <Link to="/register" className="flex items-center justify-center gap-3">
                      <Heart className="w-5 h-5" />
                      Get Started Free
                    </Link>
                  </Button>
                  <Button 
                    asChild 
                    variant="outline" 
                    size="lg" 
                    className="w-full sm:w-auto min-h-12 border-2 border-primary/30 text-primary hover:bg-primary/10 font-semibold px-8 py-4 rounded-xl backdrop-blur-sm transition-all duration-300"
                  >
                    <Link to="/login">Sign In</Link>
                  </Button>
                </>
              )}
            </motion.div>
          </motion.div>
        </div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-8 left-1/2 transform -translate-x-1/2 hidden md:block"
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1, duration: 0.6 }}
        >
          <div className="w-6 h-10 border-2 border-primary/50 rounded-full flex justify-center">
            <motion.div
              className="w-1 h-3 bg-primary rounded-full mt-2"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
            />
          </div>
        </motion.div>
      </section>

      {/* Features Section with proper spacing */}
      <section className="py-16 md:py-24 lg:py-32 px-4 relative">
        
        {/* Background orb */}
        <div className="absolute top-1/4 left-[10%] w-64 h-64 md:w-80 md:h-80 bg-gradient-to-r from-secondary/20 to-accent/20 rounded-full blur-3xl" />
        
        <div className="relative z-10 w-full max-w-7xl mx-auto">
          
          {/* Section header */}
          <motion.div 
            className="text-center mb-12 md:mb-20"
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <motion.div
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary/10 border border-secondary/20 mb-4 md:mb-6"
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2, duration: 0.4 }}
            >
              <Users className="w-4 h-4 text-secondary" />
              <span className="text-sm font-medium text-secondary">How It Works</span>
            </motion.div>
            
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold gradient-text mb-4 md:mb-6">
              Simple. Powerful. Magical.
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Connecting with like-minded peers has never been this seamless and enjoyable.
            </p>
          </motion.div>

          {/* Feature cards with responsive grid */}
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
          >
            {/* Feature 1 */}
            <motion.div variants={featureVariants}>
              <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 h-full hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <motion.div 
                  className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-btn-primary mb-4 md:mb-6 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Search className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-bold gradient-text mb-3 md:mb-4">
                  Discover Activities
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Browse through a curated collection of activities created by your peers. 
                  From study sessions to adventure trips, find what excites you.
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div variants={featureVariants}>
              <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 h-full hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <motion.div 
                  className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-btn-secondary mb-4 md:mb-6 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: -5 }}
                  transition={{ duration: 0.3 }}
                >
                  <PlusCircle className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-bold gradient-text-2 mb-3 md:mb-4">
                  Create Experiences
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Have an idea? Share it with the world! Create activities that bring people together 
                  and build meaningful connections in your community.
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div variants={featureVariants}>
              <div className="group relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-2xl p-6 md:p-8 h-full hover:bg-card/80 hover:border-border transition-all duration-300 hover:shadow-xl hover:-translate-y-1">
                <motion.div 
                  className="inline-flex items-center justify-center w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-btn-primary mb-4 md:mb-6 shadow-lg"
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  transition={{ duration: 0.3 }}
                >
                  <Users className="w-6 h-6 md:w-7 md:h-7 text-white" />
                </motion.div>
                <h3 className="text-xl md:text-2xl font-bold gradient-text-3 mb-3 md:mb-4">
                  Connect & Grow
                </h3>
                <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                  Join activities, meet amazing people, and build lasting friendships. 
                  Grow your network while pursuing your passions.
                </p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* CTA Section with enhanced spacing */}
      <section className="py-16 md:py-24 lg:py-32 px-4 relative">
        
        {/* Background orb */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 md:w-[32rem] md:h-[32rem] bg-gradient-to-r from-primary/15 to-accent/15 rounded-full blur-3xl" />
        
        <div className="relative z-10 w-full max-w-5xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-50px" }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-foreground to-muted-foreground bg-clip-text text-transparent mb-6 md:mb-8">
              Ready to Transform Your Social Life?
            </h2>
            <p className="text-base md:text-lg lg:text-xl text-muted-foreground max-w-3xl mx-auto mb-8 md:mb-12 leading-relaxed">
              Join thousands of users who've already discovered their perfect community. 
              Your next adventure is just one click away.
            </p>
            
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3, duration: 0.4 }}
            >
              <Button 
                asChild 
                size="lg" 
                className="min-h-12 btn-gradient-primary text-white font-semibold px-8 py-4 rounded-xl shadow-lg transform hover:scale-[1.02] transition-all duration-300"
              >
                <Link to="/register" className="flex items-center gap-3">
                  <Sparkles className="w-5 h-5" />
                  Start Your Journey
                  <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" />
                </Link>
              </Button>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Footer with consistent spacing */}
      <footer className="border-t border-border/50 py-8 md:py-12 bg-card/50 backdrop-blur-sm">
        <div className="w-full max-w-7xl mx-auto px-4 text-center">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="flex items-center justify-center gap-2 mb-4"
          >
            <div className="w-8 h-8 rounded-lg bg-gradient-btn-primary flex items-center justify-center shadow-md">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg md:text-xl gradient-text">
              PeerConnect
            </span>
          </motion.div>
          <p className="text-sm md:text-base text-muted-foreground">
            &copy; {new Date().getFullYear()} PeerConnect. Made with love for bringing people together.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Home;