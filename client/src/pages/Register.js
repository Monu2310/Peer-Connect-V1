import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../core/AuthContext";
import { motion } from "framer-motion";
import { UserPlus, Mail, Eye, EyeOff, CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import BeautifulBackground from "../components/effects/BeautifulBackground";
import axios from "axios";
import { API_URL } from "../api/config";

const Register = () => {
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    passwordConfirm: "",
    major: "",
    graduationYear: ""
  });

  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);
  const [verificationNotice, setVerificationNotice] = useState("");
  const [serverStatus, setServerStatus] = useState('unknown');

  const { register, error, setError, currentUser } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    const checkServerStatus = async () => {
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 3000 });
        setServerStatus('ready');
      } catch (err) {
        setServerStatus('unknown');
      }
    };
    checkServerStatus();
  }, []);

  const { username, email, password, passwordConfirm, major, graduationYear } = formData;

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

  const onSubmit = async (e) => {
    e.preventDefault();

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

    setLoading(true);
    setRegistrationComplete(false);
    setVerificationNotice("");

    if (serverStatus !== 'ready') {
      setServerStatus('waking');
      try {
        await axios.get(`${API_URL}/api/health`, { timeout: 5000 })
          .then(() => setServerStatus('ready'))
          .catch(() => {});
      } catch (err) {}
    }

    try {
      const userData = {
        username,
        email,
        password
      };

      if (major) userData.major = major;
      if (graduationYear) userData.graduationYear = parseInt(graduationYear);

      setFormError("");
      setError("");

      const response = await register(userData);
      setRegistrationComplete(true);
      setVerificationNotice(response?.message || "Account created! You can now set up your profile.");
      
      // Redirect to profile page after 2 seconds to let them set preferences
      setTimeout(() => {
        navigate("/profile");
      }, 2000);
    } catch (err) {
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
          <div className="relative backdrop-blur-2xl bg-card/90 dark:bg-card/95 rounded-3xl shadow-2xl border border-border/60 overflow-hidden">
            <div className="absolute top-0 left-0 right-0 h-1.5 bg-primary"></div>

            <div className="p-8 sm:p-10">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                className="text-center mb-6"
              >
                <div className="flex justify-center mb-3">
                  <div className="w-16 h-16 rounded-2xl bg-primary flex items-center justify-center shadow-xl">
                    <UserPlus className="w-8 h-8 text-primary-foreground" strokeWidth={2.5} />
                  </div>
                </div>
                <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold text-foreground tracking-tight mb-2">Join PeerConnect</h1>
                <p className="text-base text-muted-foreground font-semibold">
                  Create your account in seconds
                </p>
              </motion.div>

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

              {registrationComplete ? (
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
                    <h2 className="text-3xl font-bold text-foreground mb-3">Welcome!</h2>
                    <p className="text-base text-muted-foreground leading-relaxed font-medium">
                      {verificationNotice}
                    </p>
                    <p className="text-sm text-muted-foreground mt-2">
                      Redirecting to your profile...
                    </p>
                  </div>
                </motion.div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-5">
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
                      >
                        {showPassword ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                  
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
                      >
                        {showPasswordConfirm ? <EyeOff className="w-5 h-5" strokeWidth={2.5} /> : <Eye className="w-5 h-5" strokeWidth={2.5} />}
                      </button>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-bold text-foreground mb-2 ml-1">Program <span className="text-muted-foreground font-medium">(Optional)</span></label>
                    <select
                      name="major"
                      value={major}
                      onChange={onChange}
                      className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm cursor-pointer"
                    >
                      <option value="">Select your program</option>
                      <option value="Computer Science">Computer Science</option>
                      <option value="Engineering">Engineering</option>
                      <option value="Business">Business</option>
                      <option value="Arts">Arts</option>
                      <option value="Sciences">Sciences</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  
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
                      className="w-full px-4 py-3.5 text-base rounded-xl border-2 border-border bg-input/60 backdrop-blur-sm text-foreground placeholder-muted-foreground/60 focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/20 transition-all duration-300 font-medium shadow-sm"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full py-4 mt-6 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 group"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>{serverStatus === 'waking' ? 'Waking Server...' : 'Creating Account...'}</span>
                      </>
                    ) : (
                      <>
                        <span>Create Account</span>
                        <ArrowRight className="w-5 h-5 transition-transform group-hover:translate-x-1" strokeWidth={2.5} />
                      </>
                    )}
                  </button>
                </form>
              )}
            </div>
          </div>

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

export default Register;
