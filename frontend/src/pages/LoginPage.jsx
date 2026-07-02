import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import {
  Search, Shield, Bell, MessageCircle,
  Mail, ArrowRight, KeyRound, User,
  Loader2, LogIn, UserPlus, Eye, EyeOff, Lock
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import API from '../utils/api';

const features = [
  { icon: Search, label: 'Smart Categories', desc: 'Electronics, Stationary, and more' },
  { icon: MessageCircle, label: 'Private Chat', desc: 'Directly contact the finder' },
  { icon: Bell, label: 'Instant Alerts', desc: 'Email notifications for new finds' },
  { icon: Shield, label: 'NITJ Only', desc: 'Exclusive to @nitj.ac.in accounts' },
];

const STEPS = {
  EMAIL: 'email',
  LOGIN: 'login',
  SIGNUP_OTP: 'signup_otp',
  SIGNUP_DETAILS: 'signup_details',
};

const OTPInput = ({ otp, setOtp }) => {
  const handleChange = (value, index) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 5) {
      document.getElementById(`otp-${index + 1}`)?.focus();
    }
  };

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      document.getElementById(`otp-${index - 1}`)?.focus();
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted.length === 6) setOtp(pasted.split(''));
  };

  return (
    <div className="flex gap-2 justify-between" onPaste={handlePaste}>
      {otp.map((digit, i) => (
        <input
          key={i}
          id={`otp-${i}`}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={e => handleChange(e.target.value, i)}
          onKeyDown={e => handleKeyDown(e, i)}
          className="w-12 h-14 text-center text-xl font-bold font-mono bg-brand-surface border border-brand-border rounded-xl text-white focus:outline-none focus:border-brand-accent focus:ring-1 focus:ring-brand-accent/30 transition-all"
        />
      ))}
    </div>
  );
};

const PasswordInput = ({ value, onChange, placeholder = 'Enter password', label, id }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      {label && <label htmlFor={id} className="block text-sm font-semibold text-gray-200 mb-2">{label}</label>}
      <div className="relative">
        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
        <input
          id={id}
          type={show ? 'text' : 'password'}
          className="input pl-10 pr-10"
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          required
        />
        <button
          type="button"
          onClick={() => setShow(s => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-brand-muted hover:text-gray-300 transition-colors"
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );
};

const LoginPage = () => {
  const { login, user } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [existingName, setExistingName] = useState('');
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

  useEffect(() => {
    if (user) navigate('/dashboard');
  }, [user, navigate]);

  useEffect(() => {
    if (resendTimer <= 0) return;
    const t = setTimeout(() => setResendTimer(r => r - 1), 1000);
    return () => clearTimeout(t);
  }, [resendTimer]);

  const resetOTP = () => {
    setOtp(['', '', '', '', '', '']);
    setTimeout(() => document.getElementById('otp-0')?.focus(), 100);
  };

  const validateEmail = (e) => {
    if (!e.toLowerCase().endsWith('@nitj.ac.in')) {
      toast.error('Only @nitj.ac.in emails are allowed');
      return false;
    }
    return true;
  };

  // ── Step 1: Check email exists or not
  const handleCheckEmail = async (e) => {
    e.preventDefault();
    if (!validateEmail(email)) return;
    setLoading(true);
    try {
      const { data } = await API.post('/auth/check-email', { email: email.toLowerCase() });
      if (data.exists) {
        setExistingName(data.name);
        setStep(STEPS.LOGIN);
      } else {
        // New user — send OTP first
        await API.post('/auth/send-otp', { email: email.toLowerCase() });
        setStep(STEPS.SIGNUP_OTP);
        setResendTimer(60);
        resetOTP();
        toast.success(`Verification OTP sent to ${email}`);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2a: Existing user — login with password
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!password) return toast.error('Please enter your password');
    setLoading(true);
    try {
      const { data } = await API.post('/auth/login', {
        email: email.toLowerCase(),
        password,
      });
      login(data.token, data.user);
      toast.success(`Welcome back, ${data.user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2b: New user — verify OTP
  const handleVerifyOTP = async (e) => {
    e.preventDefault();
    const otpString = otp.join('');
    if (otpString.length !== 6) return toast.error('Enter the complete 6-digit OTP');
    setLoading(true);
    try {
      // Just verify OTP exists and is valid by trying — move to details step
      // We store OTP and verify during actual signup
      setStep(STEPS.SIGNUP_DETAILS);
    } catch (error) {
      toast.error('Something went wrong');
      resetOTP();
    } finally {
      setLoading(false);
    }
  };

  // ── Step 3: New user — fill name + password and signup
  const handleSignup = async (e) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Please enter your full name');
    if (password.length < 6) return toast.error('Password must be at least 6 characters');
    if (password !== confirmPassword) return toast.error('Passwords do not match');

    setLoading(true);
    try {
      const { data } = await API.post('/auth/signup', {
        email: email.toLowerCase(),
        otp: otp.join(''),
        name: name.trim(),
        password,
      });
      login(data.token, data.user);
      toast.success(`Account created! Welcome, ${data.user.name.split(' ')[0]}!`);
      navigate('/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Signup failed');
      // If OTP error, go back to OTP step
      if (error.response?.data?.message?.includes('OTP')) {
        setStep(STEPS.SIGNUP_OTP);
        resetOTP();
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendOTP = async () => {
    if (resendTimer > 0) return;
    setLoading(true);
    try {
      await API.post('/auth/send-otp', { email: email.toLowerCase() });
      setResendTimer(60);
      resetOTP();
      toast.success('New OTP sent!');
    } catch {
      toast.error('Failed to resend OTP');
    } finally {
      setLoading(false);
    }
  };

  const renderContent = () => {
    switch (step) {

      // ── Step 1: Email check
      case STEPS.EMAIL:
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <Mail className="w-7 h-7 text-brand-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Welcome to NITJ Lost & Found
              </h2>
              <p className="text-brand-muted text-sm">
                Enter your NITJ email to continue
              </p>
            </div>

            <div className="bg-brand-surface border border-brand-border rounded-xl p-4 mb-6 flex items-start gap-3">
              <Shield className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-brand-muted leading-relaxed">
                Only <code className="bg-brand-border px-1.5 py-0.5 rounded font-mono text-brand-accent">@nitj.ac.in</code> emails are allowed.
                <br />Example: <span className="text-gray-400">adityakm.cs.23@nitj.ac.in</span>
              </div>
            </div>

            <form onSubmit={handleCheckEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2">
                  NITJ Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-muted" />
                  <input
                    type="email"
                    className="input pl-10"
                    placeholder="rollno.branch.year@nitj.ac.in"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    autoFocus
                    required
                  />
                </div>
              </div>
              <button type="submit" disabled={loading} className="btn-primary w-full justify-center py-3">
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><ArrowRight className="w-4 h-4" /> Continue</>
                }
              </button>
            </form>
          </>
        );

      // ── Step 2a: Login with password
      case STEPS.LOGIN:
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-green-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <LogIn className="w-7 h-7 text-green-400" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Welcome back{existingName ? `, ${existingName.split(' ')[0]}` : ''}!
              </h2>
              <p className="text-brand-muted text-sm">
                Signing in as <span className="text-brand-accent font-medium">{email}</span>
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <PasswordInput
                id="login-password"
                label="Password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Enter your password"
              />

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3 bg-green-500 hover:bg-green-400"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><LogIn className="w-4 h-4" /> Login</>
                }
              </button>

              <button
                type="button"
                onClick={() => { setStep(STEPS.EMAIL); setPassword(''); }}
                className="btn-secondary w-full justify-center"
              >
                ← Use Different Email
              </button>
            </form>
          </>
        );

      // ── Step 2b: New user — verify OTP
      case STEPS.SIGNUP_OTP:
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <KeyRound className="w-7 h-7 text-brand-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Verify Your Email
              </h2>
              <p className="text-brand-muted text-sm">
                OTP sent to <span className="text-brand-accent font-medium">{email}</span>
              </p>
            </div>

            <div className="bg-brand-accent/10 border border-brand-accent/20 rounded-xl p-4 mb-6 flex items-start gap-3">
              <UserPlus className="w-5 h-5 text-brand-accent flex-shrink-0 mt-0.5" />
              <div className="text-xs text-brand-muted leading-relaxed">
                No account found for this email. Enter the OTP sent to your inbox to verify and create an account.
              </div>
            </div>

            <form onSubmit={handleVerifyOTP} className="space-y-5">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-3">
                  Enter 6-digit OTP
                </label>
                <OTPInput otp={otp} setOtp={setOtp} />
              </div>

              <button
                type="submit"
                disabled={loading || otp.join('').length !== 6}
                className="btn-primary w-full justify-center py-3 disabled:opacity-50"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><ArrowRight className="w-4 h-4" /> Verify OTP</>
                }
              </button>

              <div className="flex items-center justify-between text-sm">
                <button
                  type="button"
                  onClick={() => { setStep(STEPS.EMAIL); setEmail(''); }}
                  className="text-brand-muted hover:text-gray-300 transition-colors"
                >
                  ← Change email
                </button>
                <button
                  type="button"
                  onClick={handleResendOTP}
                  disabled={resendTimer > 0}
                  className="text-brand-accent hover:text-brand-accent-light transition-colors disabled:text-brand-muted disabled:cursor-not-allowed"
                >
                  {resendTimer > 0 ? `Resend in ${resendTimer}s` : 'Resend OTP'}
                </button>
              </div>
            </form>
          </>
        );

      // ── Step 3: New user — name + password
      case STEPS.SIGNUP_DETAILS:
        return (
          <>
            <div className="text-center mb-8">
              <div className="w-14 h-14 bg-brand-accent/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <UserPlus className="w-7 h-7 text-brand-accent" />
              </div>
              <h2 className="font-display text-2xl font-bold text-white mb-2">
                Create Your Account
              </h2>
              <p className="text-brand-muted text-sm">
                Almost done! Fill in your details
              </p>
            </div>

            <form onSubmit={handleSignup} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-200 mb-2 flex items-center gap-1.5">
                  <User className="w-3.5 h-3.5" /> Full Name
                </label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Aditya Kumar"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  autoFocus
                  required
                />
              </div>

              <PasswordInput
                id="signup-password"
                label="Create Password (min 6 characters)"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="Create a strong password"
              />

              <PasswordInput
                id="confirm-password"
                label="Confirm Password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                placeholder="Repeat your password"
              />

              {/* Password strength indicator */}
              {password && (
                <div className="space-y-1">
                  <div className="flex gap-1">
                    {[1, 2, 3, 4].map(i => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${
                          password.length >= i * 3
                            ? password.length >= 10 ? 'bg-green-400'
                              : password.length >= 7 ? 'bg-yellow-400'
                              : 'bg-red-400'
                            : 'bg-brand-border'
                        }`}
                      />
                    ))}
                  </div>
                  <p className="text-xs text-brand-muted">
                    {password.length < 6 ? 'Too short' :
                     password.length < 8 ? 'Weak' :
                     password.length < 10 ? 'Medium' : 'Strong'} password
                  </p>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full justify-center py-3"
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <><UserPlus className="w-4 h-4" /> Create Account</>
                }
              </button>

              <button
                type="button"
                onClick={() => setStep(STEPS.SIGNUP_OTP)}
                className="btn-secondary w-full justify-center"
              >
                ← Back to OTP
              </button>
            </form>
          </>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel */}
      <div className="hidden lg:flex lg:w-1/2 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-dark via-brand-card to-brand-dark" />
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-brand-accent/5 blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-navy-600/10 blur-3xl" />
        </div>
        <div className="absolute inset-0 opacity-5" style={{
          backgroundImage: `repeating-linear-gradient(45deg, #f59e0b 0, #f59e0b 1px, transparent 0, transparent 50%)`,
          backgroundSize: '24px 24px',
        }} />

        <div className="relative z-10 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-brand-accent flex items-center justify-center">
            <Search className="w-5 h-5 text-brand-dark" />
          </div>
          <div>
            <div className="font-display font-bold text-white text-lg">NITJ Lost & Found</div>
            <div className="text-brand-muted text-xs">NIT Jalandhar</div>
          </div>
        </div>

        <div className="relative z-10">
          <h1 className="font-display text-5xl font-bold leading-tight mb-6">
            Find what<br />
            <span className="text-brand-accent">matters</span> to<br />
            you.
          </h1>
          <p className="text-brand-muted text-lg leading-relaxed max-w-md">
            A dedicated platform for NIT Jalandhar students to report found items and reunite them with their owners.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-10">
            {features.map(({ icon: Icon, label, desc }) => (
              <div key={label} className="flex items-start gap-3 p-4 rounded-xl bg-brand-card/50 border border-brand-border/50">
                <div className="w-8 h-8 rounded-lg bg-brand-accent/10 flex items-center justify-center flex-shrink-0">
                  <Icon className="w-4 h-4 text-brand-accent" />
                </div>
                <div>
                  <div className="font-medium text-white text-sm">{label}</div>
                  <div className="text-brand-muted text-xs mt-0.5">{desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10 text-brand-muted text-sm">
          © 2024 NIT Jalandhar — Lost & Found Portal
        </div>
      </div>

      {/* Right Panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-brand-dark">
        <div className="w-full max-w-md animate-slide-up">
          <div className="lg:hidden flex items-center justify-center gap-3 mb-10">
            <div className="w-12 h-12 rounded-xl bg-brand-accent flex items-center justify-center">
              <Search className="w-6 h-6 text-brand-dark" />
            </div>
            <div>
              <div className="font-display font-bold text-white text-xl">NITJ Lost & Found</div>
              <div className="text-brand-muted text-sm">NIT Jalandhar</div>
            </div>
          </div>
          <div className="card p-8">
            {renderContent()}
          </div>
          <p className="text-center text-xs text-brand-muted mt-6">
            Having trouble? Contact <span className="text-brand-accent">webmaster@nitj.ac.in</span>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
// ```

// ---

// ## Summary of full flow now
// ```
// Enter Email
//      │
//   ┌──┴──────────────────┐
//   │                     │
// EXISTS               NOT EXISTS
//   │                     │
//   ▼                     ▼
// Enter Password      Send OTP to email
//   │                     │
//   ▼                     ▼
// Login - Success     Enter 6-digit OTP
//                         │
//                         ▼
//                    Enter Name + Password
//                         │
//                         ▼
//                    Account Created - Success