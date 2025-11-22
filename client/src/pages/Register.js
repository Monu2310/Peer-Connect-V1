import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../core/AuthContext";
import { motion, AnimatePresence } from "framer-motion";
import { UserPlus, Mail, Eye, EyeOff, CheckCircle } from "lucide-react";
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
      <div className="flex items-center justify-center min-h-screen px-4 py-6">
        <motion.div
          className="w-full max-w-md"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          <div className="backdrop-blur-xl bg-white/70 dark:bg-slate-900/70 rounded-2xl shadow-2xl p-6 sm:p-7 border border-white/20 dark:border-slate-700/30 overflow-hidden relative">
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-sage-400 to-primary/50"></div>

            <motion.div
              variants={{ hidden: { opacity: 0, y: -10 }, show: { opacity: 1, y: 0 } }}
              initial="hidden"
              animate="show"
              className="text-center mb-4"
            >
              <div className="flex justify-center mb-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-primary/70 flex items-center justify-center shadow-lg">
                  <UserPlus className="w-5 h-5 text-white" strokeWidth={2.5} />
                </div>
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">Join PeerConnect</h1>
              <p className="text-xs sm:text-sm text-muted-foreground">
                Step {step} of 3
              </p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <div className="flex gap-2">
                {[1, 2, 3].map((s) => (
                  <div
                    key={s}
                    className={`h-1 rounded-full transition-all duration-300 flex-1 ${
                      s <= step
                        ? "bg-gradient-to-r from-primary to-primary/70"
                        : "bg-primary/20"
                    }`}
                  />
                ))}
              </div>
            </motion.div>

            {(formError || error) && (
              <div className="bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 p-4 rounded-lg text-sm font-medium mb-6">
                {formError || error}
              </div>
            )}

            <AnimatePresence mode="wait">
              <motion.div
                key={`step-${step}`}
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
                transition={{ duration: 0.3 }}
              >
                {step === 1 && (
                  <div className="space-y-4">
                    <input
                      name="username"
                      type="text"
                      value={username}
                      onChange={onChange}
                      placeholder="Username"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <input
                      name="email"
                      type="email"
                      value={email}
                      onChange={onChange}
                      placeholder="Email"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <div className="relative">
                      <input
                        name="password"
                        type={showPassword ? "text" : "password"}
                        value={password}
                        onChange={onChange}
                        placeholder="Password"
                        className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPassword(!showPassword)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-primary"
                        aria-label={showPassword ? "Hide password" : "Show password"}
                      >
                        {showPassword ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <div className="relative">
                      <input
                        name="passwordConfirm"
                        type={showPasswordConfirm ? "text" : "password"}
                        value={passwordConfirm}
                        onChange={onChange}
                        placeholder="Confirm Password"
                        className="w-full px-4 py-3 pr-12 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none focus:text-primary"
                        aria-label={showPasswordConfirm ? "Hide password" : "Show password"}
                      >
                        {showPasswordConfirm ? (
                          <EyeOff className="w-5 h-5" />
                        ) : (
                          <Eye className="w-5 h-5" />
                        )}
                      </button>
                    </div>
                    <input
                      name="major"
                      type="text"
                      value={major}
                      onChange={onChange}
                      placeholder="Major (optional)"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
                    />
                    <input
                      name="graduationYear"
                      type="number"
                      value={graduationYear}
                      onChange={onChange}
                      placeholder="Graduation Year (e.g., 2025)"
                      min="2020"
                      max="2035"
                      className="w-full px-4 py-3 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                    />
                  </div>
                )}

                {step === 2 && (
                  <div className="space-y-4">
                    <PreferenceInputGroup
                      label="Hobbies"
                      placeholder="Add hobby"
                      items={hobbies}
                      onAdd={(e) => handleAddPreference(e, "hobbies")}
                      onRemove={(item) => handleRemovePreference(item, "hobbies")}
                    />
                    <PreferenceInputGroup
                      label="Favorite Subjects"
                      placeholder="Add subject"
                      items={favoriteSubjects}
                      onAdd={(e) => handleAddPreference(e, "favoriteSubjects")}
                      onRemove={(item) => handleRemovePreference(item, "favoriteSubjects")}
                    />
                    <PreferenceInputGroup
                      label="Sports"
                      placeholder="Add sport"
                      items={sports}
                      onAdd={(e) => handleAddPreference(e, "sports")}
                      onRemove={(item) => handleRemovePreference(item, "sports")}
                    />
                  </div>
                )}

                {step === 3 && (
                  registrationComplete ? (
                    <div className="space-y-6 text-center">
                      <div className="flex justify-center">
                        <div className="h-14 w-14 rounded-full bg-green-100 flex items-center justify-center">
                          <CheckCircle className="w-8 h-8 text-green-600" />
                        </div>
                      </div>
                      <div>
                        <h2 className="text-2xl font-semibold text-foreground mb-2">Verify your email</h2>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {verificationNotice || "We have emailed a verification link. Please confirm your email before signing in."}
                        </p>
                      </div>
                      <div className="space-y-3">
                        <p className="text-xs text-muted-foreground">
                          Didn&apos;t get the mail? Check your spam folder, then try logging in again to trigger another link.
                        </p>
                        <Link
                          to="/login"
                          className="inline-flex items-center justify-center w-full py-3 rounded-lg bg-gradient-to-r from-primary to-primary/90 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                        >
                          Go to Login
                        </Link>
                      </div>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="space-y-4">
                      <PreferenceInputGroup
                        label="Music Genres"
                        placeholder="Add genre"
                        items={musicGenres}
                        onAdd={(e) => handleAddPreference(e, "musicGenres")}
                        onRemove={(item) => handleRemovePreference(item, "musicGenres")}
                      />
                      <PreferenceInputGroup
                        label="Movies/TV"
                        placeholder="Add genre"
                        items={movieGenres}
                        onAdd={(e) => handleAddPreference(e, "movieGenres")}
                        onRemove={(item) => handleRemovePreference(item, "movieGenres")}
                      />
                      <button
                        type="submit"
                        disabled={loading}
                        className="w-full py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-75"
                      >
                        {loading ? "Creating..." : "Create Account"}
                      </button>
                    </form>
                  )
                )}
              </motion.div>
            </AnimatePresence>

            {!registrationComplete && (
              <div className="flex gap-3 mt-8">
                {step > 1 && (
                  <button
                    type="button"
                    onClick={prevStep}
                    className="flex-1 py-3 rounded-lg border-2 border-primary/30 font-semibold hover:bg-primary/5 transition-all"
                  >
                    Back
                  </button>
                )}
                {step < 3 && (
                  <button
                    type="button"
                    onClick={nextStep}
                    className={`${step === 1 ? "w-full" : "flex-1"} py-3 bg-gradient-to-r from-primary to-primary/90 text-white font-semibold rounded-lg shadow-lg hover:shadow-xl transition-all`}
                  >
                    Continue
                  </button>
                )}
              </div>
            )}
          </div>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Already have an account?{" "}
            <Link to="/login" className="font-semibold text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </motion.div>
      </div>
    </BeautifulBackground>
  );
};

const PreferenceInputGroup = ({ label, placeholder, items, onAdd, onRemove }) => (
  <div>
    <label className="block text-sm font-semibold mb-2 text-foreground">{label}</label>
    {items.length > 0 && (
      <div className="flex flex-wrap gap-2 mb-2">
        {items.map((item, idx) => (
          <div key={idx} className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-primary/10 border border-primary/30 text-sm text-foreground font-medium">
            {item}
            <button type="button" onClick={() => onRemove(item)} className="text-muted-foreground hover:text-primary transition-colors">
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        ))}
      </div>
    )}
    <input
      type="text"
      placeholder={placeholder}
      onKeyPress={onAdd}
      className="w-full px-4 py-3 rounded-lg border-2 border-border/50 bg-background text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 transition-all outline-none"
    />
  </div>
);

export default Register;
