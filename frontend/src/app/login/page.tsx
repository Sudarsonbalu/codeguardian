'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../../store/authStore';
import { Code2, Mail, Lock, ArrowRight, ShieldCheck, Cpu } from 'lucide-react';
import { motion } from 'framer-motion';
import { getApiUrl } from '../../utils/api';

const GithubIcon = (props: React.SVGProps<SVGSVGElement>) => (
  <svg viewBox="0 0 24 24" fill="currentColor" {...props}>
    <path d="M12 .297c-6.63 0-12 5.373-12 12 0 5.303 3.438 9.8 8.205 11.385.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 22.092 24 17.592 24 12.297c0-6.627-5.373-12-12-12"/>
  </svg>
);

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuthStore();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [fullName, setFullName] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  React.useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const queryToken = params.get('token');
      const queryUser = params.get('user');
      if (queryToken && queryUser) {
        try {
          const parsedUser = JSON.parse(decodeURIComponent(queryUser));
          login(queryToken, parsedUser);
          router.push('/dashboard');
        } catch (err) {
          console.error('OAuth session payload error:', err);
        }
      }
    }
  }, [login, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);
    
    const endpoint = isRegister ? 'register' : 'login';
    const payload = isRegister 
      ? { email, password, full_name: fullName } 
      : { email, password };

    try {
      const res = await fetch(getApiUrl(`/api/v1/auth/${endpoint}`), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.detail || 'Authentication failed');
      }

      if (isRegister) {
        // Automatically switch to login flow and log in
        const loginRes = await fetch(getApiUrl('/api/v1/auth/login'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, password })
        });
        const loginData = await loginRes.json();
        if (loginRes.ok) {
          login(loginData.access_token, loginData.user);
          router.push('/dashboard');
        } else {
          setIsRegister(false);
          setError('Account created! Please sign in.');
        }
      } else {
        login(data.access_token, data.user);
        router.push('/dashboard');
      }
    } catch (err: any) {
      setError(err.message || 'An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOAuthLogin = (provider: string) => {
    setError(null);
    setIsLoading(true);
    window.location.href = getApiUrl(`/auth/${provider}/login`);
  };

  const triggerDemo = async () => {
    setEmail('demo@codeguardian.ai');
    setPassword('demo1234');
    // Automate form submission
    setError(null);
    setIsLoading(true);
    try {
      const res = await fetch(getApiUrl('/api/v1/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'demo@codeguardian.ai', password: 'demo1234' })
      });
      const data = await res.json();
      if (res.ok) {
        login(data.access_token, data.user);
        router.push('/dashboard');
      } else {
        throw new Error(data.detail || 'Demo login failed');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#09090B] gradient-bg flex flex-col justify-center items-center p-4 relative overflow-hidden">
      {/* Decorative Blur Spheres */}
      <div className="absolute top-[-20%] left-[-20%] w-[60%] h-[60%] bg-[#7C3AED]/15 rounded-full blur-[120px]" />
      <div className="absolute bottom-[-20%] right-[-20%] w-[60%] h-[60%] bg-[#2563EB]/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-2 gap-12 items-center z-10">
        {/* Left: Hero Info Panel */}
        <div className="hidden lg:flex flex-col text-left space-y-6">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#7C3AED]/20 rounded-xl border border-[#7C3AED]/30">
              <Code2 className="h-8 w-8 text-[#7C3AED]" />
            </div>
            <span className="font-extrabold text-2xl tracking-wider text-white">CodeGuardian AI</span>
          </div>
          
          <h2 className="text-4xl lg:text-5xl font-black leading-tight tracking-tight text-white">
            Enterprise AI <br />
            <span className="gradient-glow">Code Review Platform</span>
          </h2>
          
          <p className="text-gray-400 text-base leading-relaxed max-w-md">
            Review code at scale, detect vulnerabilities in real-time, enforce style standards, and deploy high-quality software with confidence.
          </p>

          {/* Feature Badges */}
          <div className="grid grid-cols-2 gap-4 max-w-md pt-4">
            <div className="p-4 glass rounded-2xl flex items-start gap-3">
              <ShieldCheck className="h-6 w-6 text-[#22C55E]" />
              <div>
                <h4 className="font-semibold text-sm text-white">Security Audits</h4>
                <p className="text-xs text-gray-500">Semgrep & Bandit scan</p>
              </div>
            </div>
            <div className="p-4 glass rounded-2xl flex items-start gap-3">
              <Cpu className="h-6 w-6 text-[#7C3AED]" />
              <div>
                <h4 className="font-semibold text-sm text-white">AI Explanations</h4>
                <p className="text-xs text-gray-500">Contextual optimizations</p>
              </div>
            </div>
          </div>

          {/* Floating code block mockup */}
          <div className="glass border border-white/5 rounded-2xl p-4 shadow-2xl relative overflow-hidden max-w-md">
            <div className="flex gap-1.5 mb-3">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-yellow-500/80" />
              <span className="w-2.5 h-2.5 rounded-full bg-green-500/80" />
            </div>
            <pre className="text-xs text-[#22C55E] font-mono leading-relaxed select-none">
              <code>{`// Scanning payment-gateway...
[CRITICAL] Hardcoded credit card secret found.
[SUGGESTION] Import environmental keys instead.
- stripe.api_key = "sk_live_51..."
+ stripe.api_key = process.env.STRIPE_KEY`}</code>
            </pre>
          </div>
        </div>

        {/* Right: Login/Register Form Panel */}
        <div className="w-full max-w-md mx-auto">
          <div className="glass rounded-3xl p-8 border border-white/10 shadow-2xl shadow-black/80">
            <div className="mb-6 text-center">
              <div className="flex lg:hidden justify-center items-center gap-2.5 mb-4">
                <Code2 className="h-7 w-7 text-[#7C3AED]" />
                <span className="font-extrabold text-xl tracking-wider text-white">CodeGuardian</span>
              </div>
              <h3 className="text-2xl font-bold text-white">
                {isRegister ? 'Create your account' : 'Welcome back'}
              </h3>
              <p className="text-xs text-gray-400 mt-1">
                {isRegister 
                  ? 'Get started with enterprise code reviews' 
                  : 'Enter your credentials to access your dashboard'}
              </p>
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 text-xs rounded-xl mb-4 text-center">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegister && (
                <div>
                  <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Full Name</label>
                  <div className="relative">
                    <input 
                      type="text" 
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      placeholder="Alex Mercer"
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-gray-600"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-gray-400 mb-1.5 uppercase tracking-wider">Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="email" 
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@company.com"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-gray-600"
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1.5">
                  <label className="block text-xs font-semibold text-gray-400 uppercase tracking-wider">Password</label>
                  {!isRegister && (
                    <a href="#" className="text-xs text-[#7C3AED] hover:underline">Forgot password?</a>
                  )}
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-600" />
                  <input 
                    type="password" 
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-[#7C3AED] transition-colors placeholder:text-gray-600"
                  />
                </div>
              </div>

              <button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-[#7C3AED] hover:bg-[#6D28D9] text-white py-3 rounded-xl font-medium text-sm transition-all duration-200 shadow-lg shadow-[#7C3AED]/20 hover:shadow-[#7C3AED]/35 flex items-center justify-center gap-2 mt-2"
              >
                {isLoading ? 'Processing...' : (isRegister ? 'Sign Up' : 'Sign In')}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>

            {/* Demo Auto Login */}
            {!isRegister && (
              <button
                type="button"
                onClick={triggerDemo}
                disabled={isLoading}
                className="w-full mb-4 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 py-3 rounded-xl font-medium text-sm transition-all duration-200 flex items-center justify-center gap-2 cursor-pointer"
              >
                ⚡ Single-Click Demo Login
              </button>
            )}



            {/* Continue with Provider buttons */}
            <div className="grid grid-cols-3 gap-3">
              <button 
                onClick={() => handleOAuthLogin('github')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors text-xs"
              >
                <GithubIcon className="h-4 w-4" />
                GitHub
              </button>
              <button 
                onClick={() => handleOAuthLogin('google')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors text-xs"
              >
                Google
              </button>
              <button 
                onClick={() => handleOAuthLogin('microsoft')}
                className="flex items-center justify-center gap-2 py-2.5 rounded-xl border border-white/10 hover:bg-white/5 text-gray-300 transition-colors text-xs"
              >
                Microsoft
              </button>
            </div>

            <div className="mt-6 text-center">
              <button 
                onClick={() => setIsRegister(!isRegister)}
                className="text-xs text-gray-400 hover:text-white transition-colors"
              >
                {isRegister ? 'Already have an account? Sign in' : "Don't have an account? Sign up"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
