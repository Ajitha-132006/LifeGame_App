import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from './components/ui/sonner';
import Landing from './pages/Landing';
import Dashboard from './pages/Dashboard';
import QuestBoard from './pages/QuestBoard';
import Profile from './pages/Profile';
import Leaderboard from './pages/Leaderboard';
import Shop from './pages/Shop';
import AvatarCreation from './pages/AvatarCreation';
import Navigation from './components/Navigation';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

function App() {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (token) {
      fetchProfile();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchProfile = async () => {
    try {
      const response = await fetch(`${API}/user/profile`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const userData = await response.json();
        setUser(userData);
      } else {
        localStorage.removeItem('token');
        setToken(null);
      }
    } catch (error) {
      console.error('Profile fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAuth = (authToken, userData) => {
    localStorage.setItem('token', authToken);
    setToken(authToken);
    setUser(userData);
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background-base flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-text-secondary font-inter">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background-base">
      <BrowserRouter>
        {user && <Navigation user={user} onLogout={handleLogout} />}
        <Toaster position="top-right" />
        <Routes>
          <Route path="/" element={!user ? <Landing onAuth={handleAuth} /> : <Navigate to="/dashboard" />} />
          <Route path="/avatar-creation" element={user && !user.avatar ? <AvatarCreation user={user} token={token} onComplete={fetchProfile} /> : <Navigate to="/dashboard" />} />
          <Route path="/dashboard" element={user ? <Dashboard user={user} token={token} onUpdate={fetchProfile} /> : <Navigate to="/" />} />
          <Route path="/quests" element={user ? <QuestBoard user={user} token={token} onUpdate={fetchProfile} /> : <Navigate to="/" />} />
          <Route path="/profile" element={user ? <Profile user={user} token={token} /> : <Navigate to="/" />} />
          <Route path="/leaderboard" element={user ? <Leaderboard /> : <Navigate to="/" />} />
          <Route path="/shop" element={user ? <Shop user={user} token={token} onUpdate={fetchProfile} /> : <Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </div>
  );
}

export default App;