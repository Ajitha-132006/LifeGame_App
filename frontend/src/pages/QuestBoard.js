import React, { useState, useEffect } from 'react';
import { Plus, Sparkles, Upload, FileText, Zap, Coins } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const QuestBoard = ({ user, token, onUpdate }) => {
  const [quests, setQuests] = useState([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showVerification, setShowVerification] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    quest_type: 'daily',
    difficulty: 'medium',
    xp_reward: 100,
    gold_reward: 50,
    category: 'productivity'
  });
  const [photo, setPhoto] = useState(null);
  const [notes, setNotes] = useState('');
  const [quiz, setQuiz] = useState(null);
  const [quizAnswers, setQuizAnswers] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchQuests();
  }, []);

  const fetchQuests = async () => {
    try {
      const response = await fetch(`${API}/quests/active`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      const data = await response.json();
      setQuests(data);
    } catch (error) {
      toast.error('Failed to load quests');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await fetch(`${API}/quests/create`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(formData)
      });

      if (response.ok) {
        toast.success('Quest created!');
        setShowCreate(false);
        fetchQuests();
        setFormData({
          title: '',
          description: '',
          quest_type: 'daily',
          difficulty: 'medium',
          xp_reward: 100,
          gold_reward: 50,
          category: 'productivity'
        });
      } else {
        toast.error('Failed to create quest');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const generateQuest = async () => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/quests/generate?category=productivity`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        toast.success('AI quest generated!');
        fetchQuests();
      } else {
        toast.error('Failed to generate quest');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoUpload = async (questId) => {
    if (!photo) {
      toast.error('Please select a photo');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('quest_id', questId);
      formData.append('photo', photo);

      const response = await fetch(`${API}/verification/photo`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      });

      if (response.ok) {
        toast.success('Photo uploaded! Quest ready to complete.');
        setShowVerification(null);
        setPhoto(null);
      } else {
        toast.error('Failed to upload photo');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const generateQuiz = async (questId) => {
    if (!notes) {
      toast.error('Please enter your study notes');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/verification/quiz/generate?quest_id=${questId}&notes=${encodeURIComponent(notes)}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      });

      if (response.ok) {
        const data = await response.json();
        setQuiz(data.questions);
        setQuizAnswers(new Array(data.questions.length).fill(''));
        toast.success('Quiz generated!');
      } else {
        toast.error('Failed to generate quiz');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  const submitQuiz = async (questId) => {
    setLoading(true);
    try {
      const response = await fetch(`${API}/verification/quiz/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          quest_id: questId,
          answers: quizAnswers
        })
      });

      const data = await response.json();

      if (response.ok) {
        if (data.passed) {
          toast.success(`Quiz passed! Score: ${data.score}/${data.total}`);
          setShowVerification(null);
          setQuiz(null);
          setNotes('');
        } else {
          toast.error(`Quiz failed. Score: ${data.score}/${data.total}. Try again!`);
        }
      } else {
        toast.error('Failed to submit quiz');
      }
    } catch (error) {
      toast.error('Connection error');
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
          toast.success(`Level Up! You are now level ${data.new_level}!`, { duration: 5000 });
        }
        fetchQuests();
        onUpdate();
      } else {
        toast.error(data.detail || 'Failed to complete quest');
      }
    } catch (error) {
      toast.error('Connection error');
    }
  };

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12" data-testid="quest-board-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-cinzel text-4xl font-bold text-primary">Quest Board</h1>
          <div className="flex space-x-3">
            <button
              onClick={generateQuest}
              data-testid="generate-quest-button"
              disabled={loading}
              className="bg-secondary text-white font-bold px-6 py-3 rounded-sm hover:bg-secondary/80 transition-all flex items-center space-x-2 disabled:opacity-50"
            >
              <Sparkles className="w-5 h-5" />
              <span>AI Quest</span>
            </button>
            <button
              onClick={() => setShowCreate(true)}
              data-testid="create-quest-button"
              className="bg-primary text-black font-bold px-6 py-3 rounded-sm hover:bg-primary-dark transition-all flex items-center space-x-2"
            >
              <Plus className="w-5 h-5" />
              <span>Create Quest</span>
            </button>
          </div>
        </div>

        {showCreate && (
          <div className="glass-panel rounded-sm p-6 mb-8" data-testid="create-quest-form">
            <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-6">Create New Quest</h2>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">Title</label>
                  <input
                    type="text"
                    data-testid="quest-title-input"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                  >
                    <option value="productivity">Productivity</option>
                    <option value="fitness">Fitness</option>
                    <option value="study">Study</option>
                    <option value="health">Health</option>
                    <option value="habits">Habits</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-text-secondary font-inter text-sm mb-2">Description</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm p-4 font-inter h-24"
                  required
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">Difficulty</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                  >
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="hard">Hard</option>
                  </select>
                </div>
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">XP Reward</label>
                  <input
                    type="number"
                    value={formData.xp_reward}
                    onChange={(e) => setFormData({ ...formData, xp_reward: parseInt(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                    min="10"
                  />
                </div>
                <div>
                  <label className="block text-text-secondary font-inter text-sm mb-2">Gold Reward</label>
                  <input
                    type="number"
                    value={formData.gold_reward}
                    onChange={(e) => setFormData({ ...formData, gold_reward: parseInt(e.target.value) })}
                    className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary focus:ring-1 focus:ring-primary rounded-sm h-12 px-4 font-inter"
                    min="5"
                  />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  type="submit"
                  data-testid="submit-quest-button"
                  disabled={loading}
                  className="bg-primary text-black font-bold px-6 py-3 rounded-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Quest'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreate(false)}
                  className="bg-stone-850 text-text-secondary font-bold px-6 py-3 rounded-sm hover:bg-stone-750 transition-all"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        )}

        {showVerification && (
          <div className="glass-panel rounded-sm p-6 mb-8" data-testid="verification-modal">
            <h2 className="font-cinzel text-2xl font-bold text-text-primary mb-6">Quest Verification</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-inter text-lg font-bold text-text-primary mb-4 flex items-center space-x-2">
                  <Upload className="w-5 h-5 text-primary" />
                  <span>Photo Verification</span>
                </h3>
                <input
                  type="file"
                  accept="image/*"
                  data-testid="photo-upload-input"
                  onChange={(e) => setPhoto(e.target.files[0])}
                  className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary rounded-sm p-3 font-inter"
                />
                <button
                  onClick={() => handlePhotoUpload(showVerification)}
                  data-testid="submit-photo-button"
                  disabled={loading || !photo}
                  className="mt-3 bg-primary text-black font-bold px-6 py-2 rounded-sm hover:bg-primary-dark transition-all disabled:opacity-50"
                >
                  Upload Photo
                </button>
              </div>

              <div className="border-t border-stone-750 pt-6">
                <h3 className="font-inter text-lg font-bold text-text-primary mb-4 flex items-center space-x-2">
                  <FileText className="w-5 h-5 text-secondary" />
                  <span>Study Verification (Quiz)</span>
                </h3>
                
                {!quiz ? (
                  <>
                    <textarea
                      placeholder="Paste your study notes here..."
                      value={notes}
                      data-testid="notes-input"
                      onChange={(e) => setNotes(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-850 text-text-primary focus:border-primary rounded-sm p-4 font-inter h-32 mb-3"
                    />
                    <button
                      onClick={() => generateQuiz(showVerification)}
                      data-testid="generate-quiz-button"
                      disabled={loading || !notes}
                      className="bg-secondary text-white font-bold px-6 py-2 rounded-sm hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                      Generate Quiz
                    </button>
                  </>
                ) : (
                  <div className="space-y-4" data-testid="quiz-questions">
                    {quiz.map((q, i) => (
                      <div key={i} className="bg-stone-950 p-4 rounded-sm">
                        <p className="font-inter text-text-primary mb-3 font-bold">{i + 1}. {q.question}</p>
                        <div className="space-y-2">
                          {q.options.map((option, j) => (
                            <label key={j} className="flex items-center space-x-3 cursor-pointer">
                              <input
                                type="radio"
                                name={`question-${i}`}
                                data-testid={`quiz-option-${i}-${j}`}
                                value={j}
                                checked={quizAnswers[i] === j.toString()}
                                onChange={(e) => {
                                  const newAnswers = [...quizAnswers];
                                  newAnswers[i] = e.target.value;
                                  setQuizAnswers(newAnswers);
                                }}
                                className="w-4 h-4"
                              />
                              <span className="font-inter text-text-secondary">{option}</span>
                            </label>
                          ))}
                        </div>
                      </div>
                    ))}
                    <button
                      onClick={() => submitQuiz(showVerification)}
                      data-testid="submit-quiz-button"
                      disabled={loading || quizAnswers.some(a => a === '')}
                      className="bg-secondary text-white font-bold px-6 py-2 rounded-sm hover:bg-secondary/80 transition-all disabled:opacity-50"
                    >
                      Submit Quiz
                    </button>
                  </div>
                )}
              </div>
            </div>

            <button
              onClick={() => {
                setShowVerification(null);
                setQuiz(null);
                setNotes('');
                setPhoto(null);
              }}
              className="mt-6 bg-stone-850 text-text-secondary font-bold px-6 py-2 rounded-sm hover:bg-stone-750 transition-all"
            >
              Close
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {quests.map((quest) => (
            <div key={quest.id} className="quest-card p-6 rounded-sm" data-testid={`quest-card-${quest.id}`}>
              <div className="mb-4">
                <h3 className="font-cinzel text-xl font-bold text-text-primary mb-2">{quest.title}</h3>
                <p className="font-inter text-sm text-text-secondary mb-3">{quest.description}</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  <span className={`px-2 py-1 rounded text-xs font-bold ${
                    quest.difficulty === 'easy' ? 'bg-green-500/20 text-green-400' :
                    quest.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                    'bg-red-500/20 text-red-400'
                  }`}>
                    {quest.difficulty.toUpperCase()}
                  </span>
                  <span className="px-2 py-1 rounded text-xs font-bold bg-primary/20 text-primary">
                    {quest.category.toUpperCase()}
                  </span>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <span className="flex items-center space-x-1 text-primary">
                    <Zap className="w-4 h-4" />
                    <span className="font-mono">{quest.xp_reward} XP</span>
                  </span>
                  <span className="flex items-center space-x-1 text-primary">
                    <Coins className="w-4 h-4" />
                    <span className="font-mono">{quest.gold_reward} Gold</span>
                  </span>
                </div>
              </div>
              
              <div className="flex space-x-2">
                {quest.category === 'study' ? (
                  <button
                    onClick={() => setShowVerification(quest.id)}
                    data-testid={`verify-quest-${quest.id}`}
                    className="flex-1 bg-secondary text-white font-bold text-sm px-4 py-2 rounded-sm hover:bg-secondary/80 transition-all"
                  >
                    Verify
                  </button>
                ) : (
                  <button
                    onClick={() => setShowVerification(quest.id)}
                    data-testid={`verify-quest-${quest.id}`}
                    className="flex-1 bg-stone-750 text-text-secondary font-bold text-sm px-4 py-2 rounded-sm hover:bg-stone-700 transition-all"
                  >
                    Add Proof
                  </button>
                )}
                <button
                  onClick={() => completeQuest(quest.id)}
                  data-testid={`complete-quest-${quest.id}`}
                  className="flex-1 bg-primary text-black font-bold text-sm px-4 py-2 rounded-sm hover:bg-primary-dark transition-all"
                >
                  Complete
                </button>
              </div>
            </div>
          ))}
        </div>

        {quests.length === 0 && !showCreate && (
          <div className="text-center py-16">
            <p className="font-inter text-text-secondary text-lg mb-6">No quests yet. Start your adventure!</p>
            <button
              onClick={() => setShowCreate(true)}
              className="bg-primary text-black font-bold px-8 py-3 rounded-sm hover:bg-primary-dark transition-all"
            >
              Create Your First Quest
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default QuestBoard;