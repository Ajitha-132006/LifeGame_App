import React, { useState, useEffect } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Award, Zap, Trophy, Flame, Coins } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Profile = ({ user, token }) => {
  const [stats, setStats] = useState(null);
  const [completedQuests, setCompletedQuests] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, questsRes] = await Promise.all([
        fetch(`${API}/user/stats`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`${API}/quests/completed`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const questsData = await questsRes.json();

      setStats(statsData);
      setCompletedQuests(questsData);
    } catch (error) {
      toast.error('Failed to load profile data');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="min-h-screen bg-background-base pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>;
  }

  const categoryData = completedQuests.reduce((acc, quest) => {
    acc[quest.category] = (acc[quest.category] || 0) + 1;
    return acc;
  }, {});

  const chartData = Object.entries(categoryData).map(([name, value]) => ({
    name: name.charAt(0).toUpperCase() + name.slice(1),
    quests: value
  }));

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12" data-testid="profile-page">
      <div className="max-w-7xl mx-auto">
        <div className="glass-panel rounded-sm p-8 mb-8">
          <div className="flex flex-col md:flex-row items-center md:items-start space-y-6 md:space-y-0 md:space-x-8">
            {user.avatar && (
              <div className="w-32 h-32 rounded-sm overflow-hidden border-4 border-primary shadow-gold-glow">
                <img src={user.avatar.avatar_image} alt="Avatar" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex-1 text-center md:text-left">
              <h1 className="font-cinzel text-4xl font-bold text-primary mb-2">{user.username}</h1>
              <p className="font-inter text-text-secondary text-lg mb-4">{user.avatar?.name || 'Adventurer'} • Level {stats?.level}</p>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-stone-950 p-4 rounded-sm text-center">
                  <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                    <Zap className="w-5 h-5" />
                    <span className="font-mono text-2xl font-bold">{stats?.xp}</span>
                  </div>
                  <p className="text-text-muted text-xs uppercase">Total XP</p>
                </div>
                
                <div className="bg-stone-950 p-4 rounded-sm text-center">
                  <div className="flex items-center justify-center space-x-2 text-primary mb-2">
                    <Coins className="w-5 h-5" />
                    <span className="font-mono text-2xl font-bold">{stats?.gold}</span>
                  </div>
                  <p className="text-text-muted text-xs uppercase">Gold</p>
                </div>
                
                <div className="bg-stone-950 p-4 rounded-sm text-center">
                  <div className="flex items-center justify-center space-x-2 text-accent mb-2">
                    <Flame className="w-5 h-5" />
                    <span className="font-mono text-2xl font-bold">{stats?.streak}</span>
                  </div>
                  <p className="text-text-muted text-xs uppercase">Day Streak</p>
                </div>
                
                <div className="bg-stone-950 p-4 rounded-sm text-center">
                  <div className="flex items-center justify-center space-x-2 text-secondary mb-2">
                    <Trophy className="w-5 h-5" />
                    <span className="font-mono text-2xl font-bold">{stats?.completed_quests}</span>
                  </div>
                  <p className="text-text-muted text-xs uppercase">Completed</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <div className="glass-panel rounded-sm p-6">
            <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-6 flex items-center space-x-2">
              <Award className="w-6 h-6 text-primary" />
              <span>Quest Categories</span>
            </h2>
            {chartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#44403c" />
                  <XAxis dataKey="name" stroke="#a8a29e" />
                  <YAxis stroke="#a8a29e" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      border: '1px solid #44403c',
                      borderRadius: '4px',
                      color: '#fafaf9'
                    }}
                  />
                  <Bar dataKey="quests" fill="#fbbf24" />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-text-secondary font-inter text-center py-8">No completed quests yet</p>
            )}
          </div>

          <div className="glass-panel rounded-sm p-6">
            <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-6 flex items-center space-x-2">
              <Trophy className="w-6 h-6 text-primary" />
              <span>Badges & Achievements</span>
            </h2>
            {stats?.badges?.length > 0 ? (
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-4">
                {stats.badges.map((badge, i) => (
                  <div key={i} className="aspect-square bg-primary/20 rounded-sm flex items-center justify-center border-2 border-primary/30 hover:scale-110 transition-transform cursor-pointer">
                    <span className="text-4xl">{badge}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-text-secondary font-inter text-center py-8">No badges earned yet. Complete more quests!</p>
            )}
          </div>
        </div>

        <div className="glass-panel rounded-sm p-6 mt-8">
          <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-6">Recent Completions</h2>
          {completedQuests.length > 0 ? (
            <div className="space-y-3">
              {completedQuests.slice(0, 10).map((quest) => (
                <div key={quest.id} className="bg-stone-950 p-4 rounded-sm flex items-center justify-between" data-testid={`completed-quest-${quest.id}`}>
                  <div className="flex-1">
                    <h3 className="font-inter font-bold text-text-primary">{quest.title}</h3>
                    <p className="text-text-muted text-sm">
                      Completed {new Date(quest.completed_at).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center space-x-4 text-sm">
                    <span className="flex items-center space-x-1 text-primary">
                      <Zap className="w-4 h-4" />
                      <span className="font-mono">{quest.xp_reward}</span>
                    </span>
                    <span className="flex items-center space-x-1 text-primary">
                      <Coins className="w-4 h-4" />
                      <span className="font-mono">{quest.gold_reward}</span>
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-text-secondary font-inter text-center py-8">No completed quests yet</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Profile;