import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';

// ─── Icons ────────────────────────────────────────────────────────────────────
const MailIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
  </svg>
);
const LockIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
  </svg>
);
const UserIcon = () => (
  <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
    <circle cx="12" cy="8" r="4" />
    <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
  </svg>
);
const EyeIcon = ({ open }: { open: boolean }) =>
  open ? (
    <svg className="h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg className="h-4 w-4 text-agri-subtext" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" y1="2" x2="22" y2="22" />
    </svg>
  );

// ─── Strength Indicator ───────────────────────────────────────────────────────
const getPasswordStrength = (pw: string) => {
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[A-Z]/.test(pw)) score++;
  if (/[0-9]/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
};

const PasswordStrength: React.FC<{ password: string }> = ({ password }) => {
  if (!password) return null;
  const strength = getPasswordStrength(password);
  const labels = ['', 'Weak', 'Fair', 'Good', 'Strong'];
  const colors = ['', 'bg-red-400', 'bg-orange-400', 'bg-agri-lime', 'bg-agri-primary'];
  return (
    <div className="space-y-1.5">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : 'bg-agri-border'}`}
          />
        ))}
      </div>
      <p className={`text-xs font-medium ${strength >= 3 ? 'text-agri-primary' : strength === 2 ? 'text-orange-500' : 'text-red-500'}`}>
        {labels[strength]}
      </p>
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────

interface FormErrors {
  fullName?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  general?: string;
}

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();
  const { signUp } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState<FormErrors>({});

  const validate = (): boolean => {
    const newErrors: FormErrors = {};
    if (!fullName.trim()) newErrors.fullName = 'Full name is required';
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    else if (password.length < 8) newErrors.password = 'Password must be at least 8 characters';
    if (!confirmPassword) newErrors.confirmPassword = 'Please confirm your password';
    else if (password !== confirmPassword) newErrors.confirmPassword = 'Passwords do not match';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    const { error } = await signUp(email, password, fullName.trim());
    if (error) {
      setErrors({ general: error });
    } else {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 1500);
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-agri-bg">
      {/* ── Left Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-agri-dark flex-col justify-between p-12">
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-agri-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-agri-lime/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Logo */}
        <div className="relative z-10 flex items-center gap-3">
          <div className="h-10 w-10 rounded-2xl bg-agri-primary flex items-center justify-center shadow-lg shadow-agri-primary/30">
            <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
            </svg>
          </div>
          <span className="text-white text-2xl font-bold tracking-tight">YEATI</span>
        </div>

        {/* Steps */}
        <div className="relative z-10 space-y-6">
          <h1 className="text-4xl font-bold text-white leading-tight">
            Join thousands of<br />
            <span className="text-agri-lime">smart farmers.</span>
          </h1>
          <div className="space-y-4">
            {[
              { step: '01', title: 'Select your location', desc: 'We tailor recommendations to your district and agro-ecological zone.' },
              { step: '02', title: 'Choose your crop & method', desc: 'Explore viable crops and cultivation techniques.' },
              { step: '03', title: 'Get financial insights', desc: 'Know your costs, revenue, and ROI before you plant.' },
            ].map(({ step, title, desc }) => (
              <div key={step} className="flex gap-4">
                <div className="flex-shrink-0 h-8 w-8 rounded-full bg-agri-primary/20 border border-agri-primary/30 flex items-center justify-center">
                  <span className="text-agri-lime text-xs font-bold">{step}</span>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-white/50 text-xs mt-0.5">{desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom note */}
        <div className="relative z-10 flex items-center gap-2 text-white/40 text-xs">
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2}>
            <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
          </svg>
          Free to use · Data stays private · Sri Lanka focused
        </div>
      </div>

      {/* ── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-7">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-agri-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
              </svg>
            </div>
            <span className="text-agri-dark text-xl font-bold">YEATI</span>
          </div>

          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-agri-text">Create your account</h2>
            <p className="text-agri-subtext text-sm">Start making smarter farming decisions today</p>
          </div>

          {/* Success banner */}
          {success && (
            <div className="flex items-center gap-2.5 rounded-xl bg-green-50 border border-green-200 px-4 py-3 text-sm text-green-700">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.857-9.809a.75.75 0 00-1.214-.882l-3.483 4.79-1.88-1.88a.75.75 0 10-1.06 1.061l2.5 2.5a.75.75 0 001.137-.089l4-5.5z" clipRule="evenodd" />
              </svg>
              Account created! Redirecting to your dashboard…
            </div>
          )}

          {/* General error */}
          {errors.general && (
            <div className="flex items-center gap-2.5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-600">
              <svg className="h-4 w-4 flex-shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.28 7.22a.75.75 0 00-1.06 1.06L8.94 10l-1.72 1.72a.75.75 0 101.06 1.06L10 11.06l1.72 1.72a.75.75 0 101.06-1.06L11.06 10l1.72-1.72a.75.75 0 00-1.06-1.06L10 8.94 8.28 7.22z" clipRule="evenodd" />
              </svg>
              {errors.general}
            </div>
          )}

          {/* Form */}
          <form id="register-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="register-fullname"
              type="text"
              label="Full name"
              placeholder="Kamal Perera"
              autoComplete="name"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              error={errors.fullName}
              leftIcon={<UserIcon />}
            />
            <Input
              id="register-email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<MailIcon />}
            />
            <div className="space-y-2">
              <Input
                id="register-password"
                type={showPassword ? 'text' : 'password'}
                label="Password"
                placeholder="Min. 8 characters"
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={errors.password}
                leftIcon={<LockIcon />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword((p) => !p)}
                    className="cursor-pointer"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <EyeIcon open={showPassword} />
                  </button>
                }
              />
              <PasswordStrength password={password} />
            </div>
            <Input
              id="register-confirm-password"
              type={showConfirm ? 'text' : 'password'}
              label="Confirm password"
              placeholder="Repeat your password"
              autoComplete="new-password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              error={errors.confirmPassword}
              leftIcon={<LockIcon />}
              rightElement={
                <button
                  type="button"
                  onClick={() => setShowConfirm((p) => !p)}
                  className="cursor-pointer"
                  aria-label={showConfirm ? 'Hide password' : 'Show password'}
                >
                  <EyeIcon open={showConfirm} />
                </button>
              }
            />

            <p className="text-xs text-agri-subtext">
              By creating an account, you agree to our{' '}
              <button type="button" className="text-agri-primary hover:underline font-medium">Terms of Service</button>{' '}
              and{' '}
              <button type="button" className="text-agri-primary hover:underline font-medium">Privacy Policy</button>.
            </p>

            <Button
              type="submit"
              id="register-submit-btn"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Create Account
            </Button>
          </form>

          {/* Footer */}
          <p className="text-center text-sm text-agri-subtext">
            Already have an account?{' '}
            <Link
              to="/login"
              id="go-to-login-link"
              className="text-agri-primary font-semibold hover:underline"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
