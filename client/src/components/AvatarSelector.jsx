import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, Shuffle, Film, Tv, Gamepad2, Music, Smile } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './ui/tabs';

// Netflix-style Avatar Collections
const AVATAR_COLLECTIONS = {
  'Classics': {
    icon: Smile,
    seeds: ['Felix', 'Aneka', 'Willow', 'Sorell', 'Buster', 'Bandit', 'Mimi', 'Coco', 'Bear', 'Bella', 'Luna', 'Leo']
  },
  'Sci-Fi': {
    icon: Gamepad2,
    seeds: ['Cyber', 'Neo', 'Trinity', 'Morpheus', 'Tron', 'Flynn', 'Quorra', 'Yoda', 'Vader', 'Luke', 'Leia', 'Han']
  },
  'Heroes': {
    icon: Film,
    seeds: ['Stark', 'Rogers', 'Thor', 'Banner', 'Romanoff', 'Barton', 'Parker', 'Strange', 'TChalla', 'Danvers', 'Lang', 'Hope']
  },
  'Villains': {
    icon: Tv,
    seeds: ['Joker', 'Thanos', 'Loki', 'Hela', 'Ultron', 'Zod', 'Lex', 'Doom', 'Magneto', 'Venom', 'Goblin', 'Ock']
  },
  'Toons': {
    icon: Music,
    seeds: ['Mickey', 'Minnie', 'Donald', 'Goofy', 'Pluto', 'Daisy', 'Bugs', 'Daffy', 'Tweety', 'Sylvester', 'Tom', 'Jerry']
  }
};

const AvatarSelector = ({ isOpen, onClose, onSelect, username, onUpload }) => {
  const [activeTab, setActiveTab] = useState('Classics');
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = (url) => {
    console.log('Avatar selected:', url);
    setSelectedAvatar(url);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      console.log('Confirming avatar:', selectedAvatar);
      onSelect(selectedAvatar);
      setSelectedAvatar(null); // Reset selection
      onClose();
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      alert('Image must be less than 5MB');
      return;
    }

    setIsUploading(true);
    try {
      await onUpload(file);
      onClose();
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border/50 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden flex flex-col"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-border/50 flex items-center justify-between bg-card/50 backdrop-blur-sm">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Choose Icon</h2>
              <p className="text-muted-foreground text-sm mt-1">Select an avatar for your profile</p>
            </div>
            <Button variant="ghost" size="icon" onClick={onClose} className="text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-full">
              <X className="h-6 w-6" />
            </Button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-hidden flex flex-col md:flex-row">
            {/* Sidebar / Tabs */}
            <div className="w-full md:w-64 bg-muted/10 border-r border-border/50 overflow-y-auto custom-scrollbar">
              <div className="p-4 space-y-2">
                {Object.entries(AVATAR_COLLECTIONS).map(([key, data]) => {
                  const Icon = data.icon;
                  return (
                    <button
                      key={key}
                      onClick={() => setActiveTab(key)}
                      className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-left ${
                        activeTab === key 
                          ? 'bg-primary text-primary-foreground font-medium shadow-md' 
                          : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground'
                      }`}
                    >
                      <Icon className="h-5 w-5" />
                      <span>{key}</span>
                    </button>
                  );
                })}
              </div>
              
              <div className="p-4 border-t border-border/50 mt-auto">
                <div className="relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    disabled={isUploading}
                  />
                  <Button variant="outline" className="w-full border-primary/20 text-primary hover:bg-primary/10">
                    {isUploading ? 'Uploading...' : 'Upload Custom'}
                  </Button>
                </div>
              </div>
            </div>

            {/* Grid */}
            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar bg-card/30">
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {AVATAR_COLLECTIONS[activeTab].seeds.map((seed, index) => {
                  // Using different styles for variety based on category
                  let style = 'avataaars';
                  if (activeTab === 'Sci-Fi') style = 'bottts';
                  if (activeTab === 'Heroes') style = 'micah';
                  if (activeTab === 'Villains') style = 'notionists';
                  if (activeTab === 'Toons') style = 'fun-emoji';

                  const url = `https://api.dicebear.com/7.x/${style}/svg?seed=${seed}`;
                  const isSelected = selectedAvatar === url;

                  return (
                    <motion.div
                      key={seed}
                      whileHover={{ scale: 1.05, zIndex: 10 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleSelect(url)}
                      className={`relative aspect-square rounded-xl overflow-hidden cursor-pointer group transition-all duration-200 ${
                        isSelected ? 'ring-4 ring-primary shadow-lg' : 'hover:ring-2 hover:ring-primary/50'
                      }`}
                    >
                      <img 
                        src={url} 
                        alt={seed} 
                        className="w-full h-full object-cover bg-muted/20"
                        loading="lazy"
                      />
                      {isSelected && (
                        <div className="absolute inset-0 bg-primary/20 flex items-center justify-center">
                          <div className="bg-primary text-primary-foreground rounded-full p-1 shadow-sm">
                            <Check className="h-5 w-5" />
                          </div>
                        </div>
                      )}
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-border/50 bg-card/50 backdrop-blur-sm flex justify-end gap-3">
            <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">
              Cancel
            </Button>
            <Button 
              onClick={handleConfirm} 
              disabled={!selectedAvatar}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 font-medium rounded-md shadow-md"
            >
              Save Icon
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarSelector;
