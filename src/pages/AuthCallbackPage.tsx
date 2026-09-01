import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabaseClient";

// This page handles the redirect after a user clicks the Supabase confirmation email.
// Supabase appends the session tokens to the URL; the JS client picks them up automatically.
const AuthCallbackPage: React.FC = () => {
  const navigate = useNavigate();
  const [message, setMessage] = useState("Confirming your email...");

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event) => {
      if (event === "SIGNED_IN") {
        setMessage("Email confirmed! Taking you to your dashboard...");
        setTimeout(() => navigate("/dashboard", { replace: true }), 1500);
      } else if (event === "TOKEN_REFRESHED") {
        navigate("/dashboard", { replace: true });
      }
    });

    const timeout = setTimeout(() => {
      navigate("/login", { replace: true });
    }, 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-agri-bg flex items-center justify-center">
      <div className="flex flex-col items-center gap-5 text-center px-6">
        <div className="relative h-16 w-16">
          <div className="absolute inset-0 rounded-full border-4 border-agri-border" />
          <div className="absolute inset-0 rounded-full border-4 border-t-agri-primary animate-spin" />
          <div className="absolute inset-0 flex items-center justify-center">
            <svg className="h-7 w-7 text-agri-primary" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17 8C8 10 5.9 16.17 3.82 21c-.19.41.39.81.74.53l1.1-.87C7 19.5 8.5 19 10 19c4 0 5-2.5 8-2.5s4 2.5 7 2.5c.55 0 1-.45 1-1 0-4.5-5-10-9-10z" />
            </svg>
          </div>
        </div>
        <div className="space-y-1">
          <p className="text-agri-text font-semibold text-lg">{message}</p>
          <p className="text-agri-subtext text-sm">Please wait a moment...</p>
        </div>
      </div>
    </div>
  );
};

export default AuthCallbackPage;