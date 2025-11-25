import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../core/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Eye, EyeOff, CheckCircle, X, ArrowRight, ArrowLeft } from "lucide-react";
import BeautifulBackground from "../components/effects/BeautifulBackground";

const Register = () => {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    major: "",
    graduationYear: "",
    hobbies: [],
    favoriteSubjects: [],
    sports: [],
    musicGenres: [],
    movieGenres: []
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");

  const { register, error, setError, currentUser } = useAuth();
  const navigate = useNavigate();

  const {
    username,
    email,
    password,
    passwordConfirm,
    major,
    graduationYear,
    hobbies,
    favoriteSubjects,
    sports,
    musicGenres,
    movieGenres
  } = formData;

  useEffect(() => {
    if (currentUser) {
      navigate("/dashboard");
    }
    return () => setError("");
  }, [currentUser, navigate, setError]);

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setFormError("");
    setError("");
  };

  const handleAddPreference = (e, category) => {
    const value = e.target.value.trim();

    if (e.key === "Enter" && value) {
      e.preventDefault();
      if (!formData[category].includes(value)) {
        setFormData({
          ...formData,
          [category]: [...formData[category], value]
        });
      }
      e.target.value = "";
    }
  };

  const handleRemovePreference = (item, category) => {
    setFormData({
      ...formData,
      [category]: formData[category].filter((i) => i !== item)
    });
  };

  const nextStep = () => {
    if (step === 1) {
      if (!username || !email || !password) {
        setFormError("Please enter all required fields");
        return;
      }

      if (password !== passwordConfirm) {
        setFormError("Passwords do not match");
        return;
      }

      if (username.length < 3 || username.length > 20) {
        setFormError("Username must be between 3 and 20 characters");
        return;
      }

      if (password.length < 6) {
        setFormError("Password must be at least 6 characters");
        return;
      }
    }

    setStep(step + 1);
    setFormError("");
  };

  const prevStep = () => {
    setStep(step - 1);
    setFormError("");
  };

  const onSubmit = async (e) => {
    e.preventDefault();

    setLoading(true);
    setRegistrationComplete(false);
    setVerificationNotice("");

    try {
      const userData = {
        username,
        email,
        password,
        hobbies,
        favoriteSubjects,
        sports,
        musicGenres,
        movieGenres
      };

      if (major) userData.major = major;
      if (graduationYear) userData.graduationYear = parseInt(graduationYear);

      setFormError("");
      setError("");

      const response = await register(userData);
      setRegistrationComplete(true);
      setVerificationNotice(response?.message || "We have sent a verification link to your email address.");
      setStep(3);
    } catch (err) {
      console.error("Registration error:", err);

      if (err.message.includes("already exists with this email")) {
        setFormError("This email is already registered. Please use another email or try logging in.");
      } else if (err.message.includes("Username is already taken")) {
        setFormError("This username is already taken. Please choose another username.");
      } else if (err.message.includes("password")) {
        setFormError(err.message);
      } else if (err.message.includes("validation")) {
        setFormError(err.message);
      } else {
        let errorMsg = err.message;
        if (errorMsg.includes("Server error during registration")) {
          errorMsg += ". This could be due to server issues. Please try again.";
        }
        setFormError(errorMsg);
      }
      setRegistrationComplete(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <BeautifulBackground>
      <div className="flex items-center justify-center min-h-screen px-4 py-8">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        >
          {/* Premium Glass Card */}
          <div className="relative backdrop-blur-2xl bg-card/90 dark:bg-card/95 rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
            {/* Premium accent */}
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>

            {/* Main Content */}
            <div className="p-8 sm:p-10">
              {/* Header */}
              <motion.div
                variants={{ hidden: { opacity: 0, y: 15 }, show: { opacity: 1, y: 0, transition: { duration: 0.5 } } }}
                initial="hidden"
                animate="show"
                className="text-center mb-6"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                    <UserPlus className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl font-bold text-foreground tracking-tight mb-2">Join PeerConnect</h1>
                <p className="text-base text-muted-foreground font-semibold">
                  Step {step} of 3
                </p>
              </motion.div>

              {/* Progress Bar */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.2, duration: 0.4 }}
                className="mb-6"
              >
                <div className="flex gap-2">
                  {[1, 2, 3].map((s) => (
                    <div
                      key={s}
                      className={`h-2 rounded-full transition-all duration-500 flex-1 ${
                        s <= step
                          ? "bg-primary shadow-md"
                          : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </motion.div>

              {/* Error Message */}
              {(formError || error) && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="mb-6 bg-destructive/10 backdrop-blur-sm border-2 border-destructive/30 text-destructive p-4 rounded-xl text-sm font-semibold flex items-start gap-3 shadow-lg"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    <div className="w-2 h-2 bg-destructive rounded-full animate-pulse"></div>
                  </div>
                  <span>{formError || error}</span>
                </motion.div>
              )}

              {/* Form Steps */}
              <AnimatePresence mode="wait">
                <motion.div
                  key={`step-${step}`}
                  initial={{ opacity: 0, x: 30 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -30 }}
                  transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
                >
                  {step === 1 && (
                    <div className="space-y-5">
                      {/* Username */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Username</label>
                        <input
                          name="username"
                          type="text"
                          value={username}
                          onChange={onChange}
                          placeholder="Choose a unique username"
                          className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        />
                      </div>
                      
                      {/* Email */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Email Address</label>
                        <input
                          name="email"
                          type="email"
                          value={email}
                          onChange={onChange}
                          placeholder="you@example.com"
                          className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        />
                      </div>
                      
                      {/* Password */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Password</label>
                        <div className="relative group">
                          <input
                            name="password"
                            type={showPassword ? "text" : "password"}
                            value={password}
                            onChange={onChange}
                            placeholder="Create a strong password"
                            className="w-full px-4 py-3.5 pr-12 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            aria-label={showPassword ? "Hide password" : "Show password"}
                          >
                            {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Confirm Password */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Confirm Password</label>
                        <div className="relative group">
                          <input
                            name="passwordConfirm"
                            type={showPasswordConfirm ? "text" : "password"}
                            value={passwordConfirm}
                            onChange={onChange}
                            placeholder="Re-enter your password"
                            className="w-full px-4 py-3.5 pr-12 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-primary transition-colors focus:outline-none"
                            aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                          >
                            {showPasswordConfirm ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                          </button>
                        </div>
                      </div>
                      
                      {/* Major (Optional) */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Major <span className="text-muted-foreground font-medium">(Optional)</span></label>
                        <input
                          name="major"
                          type="text"
                          value={major}
                          onChange={onChange}
                          placeholder="e.g., Computer Science"
                          className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                        />
                      </div>
                      
                      {/* Graduation Year (Optional) */}
                      <div>
                        <label className="block text-sm font-bold text-foreground mb-2 ml-1">Graduation Year <span className="text-muted-foreground font-medium">(Optional)</span></label>
                        <input
                          name="graduationYear"
                          type="number"
                          value={graduationYear}
                          onChange={onChange}
                          placeholder="e.g., 2025"
                          min="2020"
                          max="2035"
                          className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                      </div>
                    </div>
                  )}

                  {step === 2 && (
                    <div className="space-y-5">
                      <PreferenceInputGroup
                        label="Hobbies"
                        placeholder="e.g., Reading, Gaming, Photography"
                        items={hobbies}
                        onAdd={(e) => handleAddPreference(e, "hobbies")}
                        onRemove={(item) => handleRemovePreference(item, "hobbies")}
                      />
                      <PreferenceInputGroup
                        label="Favorite Subjects"
                        placeholder="e.g., Mathematics, History, Biology"
                        items={favoriteSubjects}
                        onAdd={(e) => handleAddPreference(e, "favoriteSubjects")}
                        onRemove={(item) => handleRemovePreference(item, "favoriteSubjects")}
                      />
                      <PreferenceInputGroup
                        label="Sports & Activities"
                        placeholder="e.g., Basketball, Swimming, Yoga"
                        items={sports}
                        onAdd={(e) => handleAddPreference(e, "sports")}
                        onRemove={(item) => handleRemovePreference(item, "sports")}
                      />
                    </div>
                  )}

                  {step === 3 && (
                    registrationComplete ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ duration: 0.5 }}
                        className="space-y-7 text-center py-4"
                      >
                        <div className="flex justify-center">
                          <div className="h-20 w-20 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                            <CheckCircle className="w-12 h-12 text-primary-foreground" strokeWidth={2.5} />
                          </div>
                        </div>
                        <div>
                          <h2 className="text-3xl font-bold text-foreground mb-3">Check Your Email!</h2>
                          <p className="text-base text-muted-foreground leading-relaxed font-medium">
                            {verificationNotice || "We've sent a verification link to your email. Please verify your account before signing in."}
                          </p>
                        </div>
                        <div className="space-y-4 pt-2">
                          <p className="text-sm text-muted-foreground font-medium px-4">
                            Didn't receive the email? Check your spam folder, or try logging in to resend the verification link.
                          </p>
                          <Link
                            to="/login"
                            className="inline-flex items-center justify-center w-full py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 gap-2 group"
                          >
                            <span>Go to Login</span>
                            <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                          </Link>
                        </div>
                      </motion.div>
                    ) : (
                      <form onSubmit={onSubmit} className="space-y-5">
                        <PreferenceInputGroup
                          label="Music Genres"
                          placeholder="e.g., Rock, Jazz, Hip-Hop"
                          items={musicGenres}
                          onAdd={(e) => handleAddPreference(e, "musicGenres")}
                          onRemove={(item) => handleRemovePreference(item, "musicGenres")}
                        />
                        <PreferenceInputGroup
                          label="Movies/TV Genres"
                          placeholder="e.g., Action, Comedy, Sci-Fi"
                          items={movieGenres}
                          onAdd={(e) => handleAddPreference(e, "movieGenres")}
                          onRemove={(item) => handleRemovePreference(item, "movieGenres")}
                        />
                        <button
                          type="submit"
                          disabled={loading}
                          className="w-full py-4 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                        >
                          {loading ? (
                            <>
                              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin"></div>
                              <span>Creating Account...</span>
                            </>
                          ) : (
                            <>
                              <span>Create Account</span>
                              <CheckCircle className="w-5 h-5 transition-transform group-hover:scale-110" strokeWidth={2.5} />
                            </>
                          )}
                        </button>
                      </form>
                    )
                  )}
              </motion.div>
            </AnimatePresence>

              {/* Navigation Buttons */}
              {!registrationComplete && (
                <div className="flex gap-4 mt-8">
                  {step > 1 && (
                    <button
                      type="button"
                      onClick={prevStep}
                      className="flex-1 py-4 rounded-xl border-2 border-secondary/40 bg-secondary/5 text-secondary font-bold hover:bg-secondary/10 hover:border-secondary/60 transition-all duration-300 flex items-center justify-center gap-2 shadow-sm hover:shadow-md group"
                    >
                      <ArrowLeft className="w-5 h-5 transition-transform group-hover:-translate-x-1" strokeWidth={2.5} />
                      <span>Back</span>
                    </button>
                  )}
                  {step < 3 && (
                    <button
                      type="button"
                      onClick={nextStep}
                      className={`${step === 1 ? "w-full" : "flex-1"} py-4 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 flex items-center justify-center gap-2 group`}
                    >
                      <span>Continue</span>
                      <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Footer Link */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="text-center mt-6"
          >
            <p className="text-base text-muted-foreground font-medium">
              Already have an account?{" "}
              <Link to="/login" className="font-bold text-primary hover:text-primary/80 hover:underline decoration-2 underline-offset-2 transition-all">
                Sign In
              </Link>
            </p>
          </motion.div>
        </motion.div>
      </div>
    </BeautifulBackground>
  );
};

// Premium Preference Input Component
const PreferenceInputGroup = ({ label, placeholder, items, onAdd, onRemove }) => (
  <div>
    <label className="block text-sm font-bold text-foreground mb-2 ml-1">{label}</label>
    {items.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-3">
        {items.map((item, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-primary/15 border-2 border-primary/40 text-sm text-foreground font-semibold shadow-sm hover:shadow-md hover:bg-primary/20 transition-all"
          >
            <span>{item}</span>
            <button 
              type="button" 
              onClick={() => onRemove(item)} 
              className="text-muted-foreground hover:text-destructive transition-colors focus:outline-none"
              aria-label={`Remove ${item}`}
            >
              <X className="w-4 h-4" strokeWidth={2.5} />
            </button>
          </motion.div>
        ))}
      </div>
    )}
    <input
      type="text"
      placeholder={placeholder}
      onKeyPress={onAdd}
      className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
    />
    <p className="text-xs text-muted-foreground mt-2 ml-1 font-medium">Press Enter to add</p>
  </div>
);

export default Register;
