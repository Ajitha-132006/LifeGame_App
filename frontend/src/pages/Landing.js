import React, { useState } from 'react';
import { Swords, Shield, Trophy, Zap } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Landing = ({ onAuth }) => {
  const [showAuth, setShowAuth] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({ email: '', password: '', username: '' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const endpoint = isLogin ? '/auth/login' : '/auth/register';
      const response = await fetch(`${API}${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(isLogin ? 'Welcome back!' : 'Account created successfully!');
        onAuth(data.token, data.user);
      } else {
        toast.error(data.detail || 'Authentication failed');
      }
    } catch (error) {
      toast.error('Connection error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative overflow-hidden noise-bg">
      <div className="absolute inset-0 bg-gradient-to-b from-black via-stone-950 to-black opacity-90"></div>

      <div className="relative z-10 min-h-screen flex flex-col items-center justify-center px-4">
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-6">
            <div className="w-20 h-20 bg-primary rounded-sm flex items-center justify-center shadow-gold-glow animate-pulse-slow">
              <Swords className="w-12 h-12 text-black" />
            </div>
          </div>
          <h1 className="font-cinzel text-5xl sm:text-7xl font-black text-primary mb-4 text-shadow-gold tracking-wider" data-testid="landing-title">
            LIFE RPG
          </h1>
          <p className="font-inter text-xl sm:text-2xl text-text-secondary max-w-2xl mx-auto leading-relaxed">
            Transform your life into an epic adventure. Complete quests, level up, earn rewards.
          </p>
        </div>

        {!showAuth && (
          <>
            <button
              onClick={() => setShowAuth(true)}
              data-testid="get-started-btn"
              className="bg-primary text-black font-bold uppercase tracking-widest hover:bg-primary-dark shadow-gold-glow rounded-sm px-12 py-4 font-cinzel text-lg mb-16 transition-all hover:scale-105"
            >
              Begin Your Quest
            </button>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-6xl w-full mt-8">
              {[
                { icon: Swords, title: 'Epic Quests', desc: 'Turn daily tasks into legendary adventures' },
                { icon: Zap, title: 'Level Up', desc: 'Gain XP and unlock new abilities' },
                { icon: Trophy, title: 'Compete', desc: 'Climb the leaderboards' },
                { icon: Shield, title: 'Verify', desc: 'Prove your achievements' },
              ].map((feature, i) => (
                <div key={i} className="quest-card p-6 rounded-sm text-center group">
                  <feature.icon className="w-12 h-12 text-primary mx-auto mb-4 group-hover:scale-110 transition-transform" />
                  <h3 className="font-cinzel text-xl font-bold text-text-primary mb-2">{feature.title}</h3>
                  <p className="font-inter text-text-secondary text-sm">{feature.desc}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {showAuth && (
          <div className="glass-panel rounded-sm p-8 w-full max-w-md shadow-2xl" data-testid="auth-form-container">
            <h2 className="font-cinzel text-3xl font-bold text-primary mb-6 text-center">
              {isLogin ? 'Enter the Realm' : 'Create Your Hero'}
            </h2>

            <form onSubmit={handleSubmit} className="space-y-4" data-testid={isLogin ? 'login-form' : 'register-form'}>
              {!isLogin && (
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">Username</label>
                  <input
                    type="text"
                    data-testid="username-input"
                    value={formData.username}
                    onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                    required={!isLogin}
                  />
                </div>
              )}

              <div>
                <label className="block text-text-secondary font-inter text-sm mb-2">Email</label>
                <input
                  type="email"
                  data-testid="email-input"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                  required
                />
              </div>

              <div>
                <label className="block text-text-secondary font-inter text-sm mb-2">Password</label>
                <input
                  type="password"
                  data-testid="password-input"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                  required
                />
              </div>

              <button
                type="submit"
                data-testid="auth-submit-button"
                disabled={loading}
                className="w-full bg-primary text-black font-bold uppercase tracking-widest hover:bg-primary-dark shadow-gold-glow rounded-sm px-8 py-3 font-cinzel transition-all disabled:opacity-50"
              >
                {loading ? 'Processing...' : (isLogin ? 'Login' : 'Register')}
              </button>
            </form>

            <div className="mt-6 text-center">
              <button
                onClick={() => setIsLogin(!isLogin)}
                data-testid="toggle-auth-mode"
                className="text-text-secondary hover:text-primary font-inter text-sm transition-colors"
              >
                {isLogin ? "Don't have an account? Register" : 'Already have an account? Login'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Landing;