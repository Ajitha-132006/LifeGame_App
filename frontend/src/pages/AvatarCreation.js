import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const avatarOptions = [
  { class: 'warrior', image: 'https://images.unsplash.com/photo-1750092701416-174aaa737e55', name: 'Warrior' },
  { class: 'mage', image: 'https://images.unsplash.com/photo-1743951896798-2936f661f939', name: 'Mage' },
  { class: 'noble', image: 'https://images.unsplash.com/photo-1693921978742-c93c4a3e6172', name: 'Noble' },
];

const AvatarCreation = ({ user, token, onComplete }) => {
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async () => {
    if (!selected) {
      toast.error('Please select an avatar');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch(`${API}/user/avatar`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          avatar_class: selected.class,
          avatar_image: selected.image,
          name: selected.name
        })
      });

      if (response.ok) {
        toast.success('Avatar created successfully!');
        await onComplete();
        navigate('/dashboard');
      } else {
        toast.error('Failed to create avatar');
      }
    } catch (error) {
      toast.error('Connection error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-cinzel text-4xl sm:text-5xl font-bold text-primary mb-4" data-testid="avatar-creation-title">
            Choose Your Hero
          </h1>
          <p className="font-inter text-text-secondary text-lg">
            Select an avatar that represents your journey
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
          {avatarOptions.map((avatar) => (
            <div
              key={avatar.class}
              data-testid={`avatar-option-${avatar.class}`}
              onClick={() => setSelected(avatar)}
              className={`quest-card p-6 rounded-sm cursor-pointer ${
                selected?.class === avatar.class ? 'border-primary border-2 shadow-gold-glow' : ''
              }`}
            >
              <div className="aspect-square rounded-sm overflow-hidden mb-4">
                <img
                  src={avatar.image}
                  alt={avatar.name}
                  className="w-full h-full object-cover transition-transform hover:scale-105"
                />
              </div>
              <h3 className="font-cinzel text-2xl font-bold text-text-primary text-center">{avatar.name}</h3>
            </div>
          ))}
        </div>

        <div className="text-center">
          <button
            onClick={handleSubmit}
            data-testid="confirm-avatar-button"
            disabled={!selected || loading}
            className="bg-primary text-black font-bold uppercase tracking-widest hover:bg-primary-dark shadow-gold-glow rounded-sm px-12 py-4 font-cinzel text-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Creating...' : 'Begin Adventure'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default AvatarCreation;