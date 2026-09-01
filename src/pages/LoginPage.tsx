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

// ─── Component ────────────────────────────────────────────────────────────────

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { signIn } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validate = (): boolean => {
    const newErrors: typeof errors = {};
    if (!email) newErrors.email = 'Email is required';
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = 'Enter a valid email';
    if (!password) newErrors.password = 'Password is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    setIsLoading(true);
    setErrors({});
    const { error } = await signIn(email, password);
    if (error) {
      setErrors({ general: error });
    } else {
      navigate('/dashboard');
    }
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen flex bg-agri-bg">
      {/* ── Left Branding Panel ─── */}
      <div className="hidden lg:flex lg:w-1/2 relative overflow-hidden bg-agri-dark flex-col justify-between p-12">
        {/* Decorative gradient blobs */}
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full bg-agri-primary/20 blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full bg-agri-lime/10 blur-3xl translate-y-1/2 -translate-x-1/4" />

        {/* Logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-2xl bg-agri-primary flex items-center justify-center shadow-lg shadow-agri-primary/30">
              <svg className="h-6 w-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
              </svg>
            </div>
            <span className="text-white text-2xl font-bold tracking-tight">YEATI</span>
          </div>
        </div>

        {/* Main Content */}
        <div className="relative z-10 space-y-6">
          <div className="space-y-4">
            <h1 className="text-4xl font-bold text-white leading-tight">
              Smart farming starts<br />
              <span className="text-agri-lime">with better data.</span>
            </h1>
            <p className="text-white/60 text-lg leading-relaxed max-w-md">
              YEATI helps Sri Lankan farmers choose the right crops, understand their costs, and maximize returns with AI-powered recommendations.
            </p>
          </div>

          {/* Feature pills */}
          <div className="flex flex-wrap gap-2">
            {['Crop Recommendations', 'Financial Analytics', 'Market Insights', 'Training Hub'].map((feat) => (
              <span key={feat} className="px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-xs font-medium border border-white/10 backdrop-blur-sm">
                {feat}
              </span>
            ))}
          </div>
        </div>

        {/* Bottom testimonial */}
        <div className="relative z-10 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-5">
          <p className="text-white/70 text-sm leading-relaxed italic">
            "YEATI helped me understand which crops suit Nuwara Eliya's climate and gave me a full financial breakdown before I invested."
          </p>
          <div className="mt-3 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-agri-primary/40 flex items-center justify-center text-white text-xs font-bold">K</div>
            <div>
              <p className="text-white text-sm font-semibold">Kamal Perera</p>
              <p className="text-white/50 text-xs">Vegetable Farmer, Nuwara Eliya</p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─── */}
      <div className="flex-1 flex items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-md space-y-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2">
            <div className="h-9 w-9 rounded-xl bg-agri-primary flex items-center justify-center">
              <svg className="h-5 w-5 text-white" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
              </svg>
            </div>
            <span className="text-agri-dark text-xl font-bold">YEATI</span>
          </div>

          {/* Heading */}
          <div className="space-y-1">
            <h2 className="text-2xl font-bold text-agri-text">Welcome back</h2>
            <p className="text-agri-subtext text-sm">Sign in to your YEATI account</p>
          </div>

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
          <form id="login-form" onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              id="login-email"
              type="email"
              label="Email address"
              placeholder="you@example.com"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              error={errors.email}
              leftIcon={<MailIcon />}
            />
            <Input
              id="login-password"
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              autoComplete="current-password"
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

            <div className="flex items-center justify-end">
              <button type="button" className="text-xs text-agri-primary hover:underline font-medium">
                Forgot password?
              </button>
            </div>

            <Button
              type="submit"
              id="login-submit-btn"
              fullWidth
              size="lg"
              isLoading={isLoading}
            >
              Sign In
            </Button>
          </form>

          {/* Divider */}
          <div className="relative flex items-center gap-3">
            <div className="flex-1 h-px bg-agri-border" />
            <span className="text-xs text-agri-subtext font-medium">or</span>
            <div className="flex-1 h-px bg-agri-border" />
          </div>

          {/* Footer */}
          <p className="text-center text-sm text-agri-subtext">
            Don't have an account?{' '}
            <Link
              to="/register"
              id="go-to-register-link"
              className="text-agri-primary font-semibold hover:underline"
            >
              Create one for free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginPage;
