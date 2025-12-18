import React, { useState, useEffect } from 'react';
import { Trophy, Crown, Medal } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      const response = await fetch(`${API}/leaderboard`);
      const data = await response.json();
      setLeaderboard(data);
    } catch (error) {
      toast.error('Failed to load leaderboard');
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

  const getRankIcon = (rank) => {
    if (rank === 0) return <Crown className="w-6 h-6 text-primary" />;
    if (rank === 1) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-amber-700" />;
    return <span className="text-text-muted font-mono">#{rank + 1}</span>;
  };

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12" data-testid="leaderboard-page">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-primary mb-2 flex items-center justify-center space-x-3">
            <Trophy className="w-10 h-10" />
            <span>Leaderboard</span>
          </h1>
          <p className="font-inter text-text-secondary">Top adventurers in the realm</p>
        </div>

        {leaderboard.length > 0 && (
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {leaderboard.slice(0, 3).map((player, index) => (
                <div
                  key={player.username}
                  data-testid={`top-player-${index}`}
                  className={`glass-panel rounded-sm p-6 text-center ${
                    index === 0 ? 'border-2 border-primary shadow-gold-glow md:transform md:scale-110 md:z-10' : ''
                  }`}
                >
                  <div className="mb-4">
                    {player.avatar?.avatar_image ? (
                      <div className="w-24 h-24 mx-auto rounded-sm overflow-hidden border-2 border-primary">
                        <img src={player.avatar.avatar_image} alt={player.username} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-24 h-24 mx-auto rounded-sm bg-primary/20 flex items-center justify-center">
                        {getRankIcon(index)}
                      </div>
                    )}
                  </div>
                  <h3 className="font-cinzel text-xl font-bold text-text-primary mb-1">{player.username}</h3>
                  <p className="text-text-secondary font-inter text-sm mb-3">Level {player.level}</p>
                  <div className="bg-stone-950 p-3 rounded-sm">
                    <p className="text-primary font-mono text-2xl font-bold">{player.xp}</p>
                    <p className="text-text-muted text-xs">Total XP</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="glass-panel rounded-sm overflow-hidden">
          <div className="bg-stone-950 p-4 border-b border-stone-750">
            <div className="grid grid-cols-12 gap-4 font-inter text-sm font-bold text-text-secondary uppercase">
              <div className="col-span-1">Rank</div>
              <div className="col-span-5">Player</div>
              <div className="col-span-3 text-center">Level</div>
              <div className="col-span-3 text-right">XP</div>
            </div>
          </div>

          <div className="divide-y divide-stone-750">
            {leaderboard.map((player, index) => (
              <div
                key={player.username}
                data-testid={`leaderboard-entry-${index}`}
                className="p-4 hover:bg-stone-950/50 transition-colors"
              >
                <div className="grid grid-cols-12 gap-4 items-center">
                  <div className="col-span-1 flex items-center justify-center">
                    {getRankIcon(index)}
                  </div>
                  <div className="col-span-5 flex items-center space-x-3">
                    {player.avatar?.avatar_image && (
                      <div className="w-10 h-10 rounded-sm overflow-hidden border border-stone-750">
                        <img src={player.avatar.avatar_image} alt={player.username} className="w-full h-full object-cover" />
                      </div>
                    )}
                    <span className="font-inter font-bold text-text-primary">{player.username}</span>
                  </div>
                  <div className="col-span-3 text-center">
                    <span className="font-cinzel text-primary font-bold">{player.level}</span>
                  </div>
                  <div className="col-span-3 text-right">
                    <span className="font-mono text-text-primary font-bold">{player.xp.toLocaleString()}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {leaderboard.length === 0 && (
          <div className="text-center py-16">
            <Trophy className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="font-inter text-text-secondary text-lg">No players yet. Be the first!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Leaderboard;