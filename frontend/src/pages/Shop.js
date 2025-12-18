import React, { useState, useEffect } from 'react';
import { ShoppingBag, Coins, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const Shop = ({ user, token, onUpdate }) => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchItems();
  }, []);

  const fetchItems = async () => {
    try {
      const response = await fetch(`${API}/shop/items`);
      const data = await response.json();
      setItems(data);
    } catch (error) {
      toast.error('Failed to load shop items');
    } finally {
      setLoading(false);
    }
  };

  const purchaseItem = (item) => {
    if (user.gold < item.cost) {
      toast.error('Not enough gold!');
      return;
    }
    toast.success(`Purchased ${item.name}! (Feature coming soon)`);
  };

  if (loading) {
    return <div className="min-h-screen bg-background-base pt-20 flex items-center justify-center">
      <div className="text-center">
        <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
        <p className="text-text-secondary">Loading...</p>
      </div>
    </div>;
  }

  return (
    <div className="min-h-screen bg-background-base pt-20 px-4 pb-12" data-testid="shop-page">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-cinzel text-4xl font-bold text-primary mb-2 flex items-center space-x-3">
              <ShoppingBag className="w-10 h-10" />
              <span>Mystical Shop</span>
            </h1>
            <p className="font-inter text-text-secondary">Purchase power-ups and rewards</p>
          </div>
          <div className="glass-panel px-6 py-3 rounded-sm">
            <div className="flex items-center space-x-2" data-testid="user-gold-balance">
              <Coins className="w-6 h-6 text-primary" />
              <span className="font-mono text-2xl font-bold text-primary">{user.gold}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item, index) => (
            <div key={item.id || index} className="quest-card p-6 rounded-sm" data-testid={`shop-item-${index}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-16 h-16 bg-primary/20 rounded-sm flex items-center justify-center border-2 border-primary/30">
                  <Sparkles className="w-8 h-8 text-primary" />
                </div>
                <div className="text-right">
                  <div className="flex items-center space-x-1 text-primary">
                    <Coins className="w-5 h-5" />
                    <span className="font-mono text-xl font-bold">{item.cost}</span>
                  </div>
                </div>
              </div>
              
              <h3 className="font-cinzel text-xl font-bold text-text-primary mb-2">{item.name}</h3>
              <p className="font-inter text-sm text-text-secondary mb-4">{item.description}</p>
              
              <div className="mb-4">
                <span className="px-3 py-1 rounded text-xs font-bold bg-secondary/20 text-secondary uppercase">
                  {item.item_type}
                </span>
              </div>
              
              <button
                onClick={() => purchaseItem(item)}
                data-testid={`purchase-item-${index}`}
                disabled={user.gold < item.cost}
                className="w-full bg-primary text-black font-bold px-4 py-3 rounded-sm hover:bg-primary-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {user.gold < item.cost ? 'Not Enough Gold' : 'Purchase'}
              </button>
            </div>
          ))}
        </div>

        {items.length === 0 && (
          <div className="text-center py-16">
            <ShoppingBag className="w-16 h-16 text-text-muted mx-auto mb-4" />
            <p className="font-inter text-text-secondary text-lg">Shop is currently empty</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default Shop;