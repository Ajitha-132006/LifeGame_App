import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Swords, Trophy, User, ShoppingBag, LogOut, ScrollText } from 'lucide-react';

const Navigation = ({ user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: ScrollText, label: 'Dashboard' },
    { path: '/quests', icon: Swords, label: 'Quests' },
    { path: '/leaderboard', icon: Trophy, label: 'Leaderboard' },
    { path: '/shop', icon: ShoppingBag, label: 'Shop' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-black/80 backdrop-blur-md border-b border-white/10 h-16" data-testid="main-navigation">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-full flex items-center justify-between">
        <Link to="/dashboard" className="flex items-center space-x-3" data-testid="logo-link">
          <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center shadow-gold-glow">
            <Swords className="w-6 h-6 text-black" />
          </div>
          <span className="font-cinzel text-xl font-bold text-primary tracking-wider hidden sm:block">LIFE RPG</span>
        </Link>

        <div className="flex items-center space-x-1 sm:space-x-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                data-testid={`nav-${item.label.toLowerCase()}`}
                className={`flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-sm font-inter text-sm transition-all ${
                  isActive
                    ? 'bg-primary/20 text-primary border border-primary/30'
                    : 'text-text-secondary hover:text-text-primary hover:bg-background-surface'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span className="hidden md:inline">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={onLogout}
            data-testid="logout-button"
            className="flex items-center space-x-2 px-3 sm:px-4 py-2 rounded-sm font-inter text-sm text-accent hover:bg-accent/20 border border-accent/30 transition-all ml-2"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden md:inline">Logout</span>
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;