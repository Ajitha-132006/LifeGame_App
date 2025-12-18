import React, { useState, useEffect } from 'react';
import { Swords, Trophy, Coins, Heart, Flame, Zap } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Dashboard = ({ user, token, onUpdate }) => {
  const [stats, setStats] = useState(null);
  const [quests, setQuests] = useState([]);
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
        fetch(`${API}/quests/active`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const statsData = await statsRes.json();
      const questsData = await questsRes.json();

      setStats(statsData);
      setQuests(questsData.slice(0, 5));
    } catch (error) {
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const completeQuest = async (questId) => {
    try {
      const response = await fetch(`${API}/quests/${questId}/complete`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      const data = await response.json();

      if (response.ok) {
        toast.success(`Quest completed! +${data.xp_gained} XP, +${data.gold_gained} Gold`);
        if (data.level_up) {
          toast.success(`🎉 Level Up! You are now level ${data.new_level}!`, { duration: 5000 });
        }
        await fetchData();
        await onUpdate();
      } else {
        toast.error(data.detail || 'Failed to complete quest');
      }
    } catch (error) {
      toast.error('Connection error');
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

  const xpPercentage = stats ? (stats.xp / (stats.xp + stats.xp_to_next_level)) * 100 : 0;

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12" data-testid="dashboard-page">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-primary mb-2">Welcome, {user.username}</h1>
          <p className="font-inter text-text-secondary">Your adventure continues...</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6 mb-8">
          <div className="md:col-span-8 space-y-6">
            <div className="glass-panel rounded-sm p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4">
                  {user.avatar && (
                    <div className="w-20 h-20 rounded-sm overflow-hidden border-2 border-primary shadow-gold-glow">
                      <img src={user.avatar.avatar_image} alt="Avatar" className="w-full h-full object-cover" />
                    </div>
                  )}
                  <div>
                    <h2 className="font-cinzel text-2xl font-bold text-text-primary">Level {stats?.level}</h2>
                    <p className="font-inter text-text-secondary">{user.avatar?.name || 'Hero'}</p>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-primary font-bold text-xl" data-testid="gold-display">
                      <Coins className="w-5 h-5" />
                      <span className="font-mono">{stats?.gold || 0}</span>
                    </div>
                    <p className="text-text-muted text-xs">Gold</p>
                  </div>
                  <div className="text-center">
                    <div className="flex items-center space-x-1 text-accent font-bold text-xl">
                      <Heart className="w-5 h-5" />
                      <span className="font-mono">{stats?.hp}/{stats?.max_hp}</span>
                    </div>
                    <p className="text-text-muted text-xs">HP</p>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-inter">
                  <span className="text-text-secondary">Experience</span>
                  <span className="text-primary font-mono">{stats?.xp} / {stats?.xp + stats?.xp_to_next_level}</span>
                </div>
                <div className="h-4 bg-stone-850 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-primary to-secondary shadow-gold-glow transition-all duration-500"
                    style={{ width: `${xpPercentage}%` }}
                  ></div>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-sm p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="font-cinzel text-2xl font-bold text-text-primary flex items-center space-x-2">
                  <Swords className="w-6 h-6 text-primary" />
                  <span>Active Quests</span>
                </h2>
                <a href="/quests" className="text-primary hover:text-primary-dark font-inter text-sm transition-colors" data-testid="view-all-quests-link">
                  View All →
                </a>
              </div>

              {quests.length === 0 ? (
                <p className="text-text-secondary font-inter text-center py-8">No active quests. Create your first quest!</p>
              ) : (
                <div className="space-y-4">
                  {quests.map((quest) => (
                    <div key={quest.id} className="quest-card p-4 rounded-sm" data-testid={`quest-${quest.id}`}>
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-cinzel text-lg font-bold text-text-primary mb-1">{quest.title}</h3>
                          <p className="font-inter text-sm text-text-secondary mb-2">{quest.description}</p>
                          <div className="flex items-center space-x-4 text-xs">
                            <span className="flex items-center space-x-1 text-primary">
                              <Zap className="w-3 h-3" />
                              <span>{quest.xp_reward} XP</span>
                            </span>
                            <span className="flex items-center space-x-1 text-primary">
                              <Coins className="w-3 h-3" />
                              <span>{quest.gold_reward} Gold</span>
                            </span>
                            <span className={`px-2 py-1 rounded text-xs font-bold ${
                              quest.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                              quest.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                              'bg-red-500/20 text-red-400'
                            }`}>
                              {quest.difficulty.toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => completeQuest(quest.id)}
                          data-testid={`complete-quest-${quest.id}`}
                          className="bg-primary text-black font-bold text-sm px-4 py-2 rounded-sm hover:bg-primary-dark transition-all ml-4"
                        >
                          Complete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="md:col-span-4 space-y-6">
            <div className="glass-panel rounded-sm p-6">
              <h2 className="font-cinzel text-xl font-bold text-text-primary mb-4">Stats</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="font-inter text-text-secondary">Completed Quests</span>
                  <span className="font-mono text-primary font-bold">{stats?.completed_quests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-inter text-text-secondary">Active Quests</span>
                  <span className="font-mono text-secondary font-bold">{stats?.active_quests || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="font-inter text-text-secondary flex items-center space-x-2">
                    <Flame className="w-4 h-4 text-accent" />
                    <span>Streak</span>
                  </span>
                  <span className="font-mono text-accent font-bold text-lg">{stats?.streak || 0} days</span>
                </div>
              </div>
            </div>

            <div className="glass-panel rounded-sm p-6">
              <h2 className="font-cinzel text-xl font-bold text-text-primary mb-4 flex items-center space-x-2">
                <Trophy className="w-5 h-5 text-primary" />
                <span>Badges</span>
              </h2>
              {stats?.badges?.length > 0 ? (
                <div className="grid grid-cols-3 gap-3">
                  {stats.badges.map((badge, i) => (
                    <div key={i} className="w-12 h-12 bg-primary/20 rounded-sm flex items-center justify-center border border-primary/30">
                      <span className="text-2xl">{badge}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-text-muted font-inter text-sm">No badges yet. Complete quests to earn badges!</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;