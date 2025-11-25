import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Check, Upload, Shuffle } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar';

// Modern DiceBear avatar styles
const avatarStyles = [
  { name: 'Fun Emoji', value: 'fun-emoji', description: 'Colorful emoji faces' },
  { name: 'Bottts', value: 'bottts', description: 'Cute robots' },
  { name: 'Avataaars', value: 'avataaars', description: 'Cartoon people' },
  { name: 'Lorelei', value: 'lorelei', description: 'Illustrated faces' },
  { name: 'Notionists', value: 'notionists', description: 'Notion-style' },
  { name: 'Pixel Art', value: 'pixel-art', description: '8-bit retro' },
  { name: 'Adventurer', value: 'adventurer', description: 'Adventure characters' },
  { name: 'Big Smile', value: 'big-smile', description: 'Happy faces' },
  { name: 'Personas', value: 'personas', description: 'Personal avatars' },
  { name: 'Thumbs', value: 'thumbs', description: 'Thumbs up style' }
];

// Generate multiple avatar variations for each style
const generateAvatars = (username) => {
  const avatars = [];
  avatarStyles.forEach((style) => {
    for (let i = 0; i < 6; i++) {
      const seed = `${username}-${style.value}-${i}-${Math.random().toString(36).substring(7)}`;
      avatars.push({
        url: `https://api.dicebear.com/7.x/${style.value}/svg?seed=${seed}`,
        style: style.name,
        description: style.description
      });
    }
  });
  return avatars;
};

const AvatarSelector = ({ isOpen, onClose, onSelect, username, onUpload }) => {
  const [avatars] = useState(() => generateAvatars(username || 'user'));
  const [selectedAvatar, setSelectedAvatar] = useState(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleSelect = (avatar) => {
    setSelectedAvatar(avatar.url);
  };

  const handleConfirm = () => {
    if (selectedAvatar) {
      onSelect(selectedAvatar);
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

  const handleShuffle = () => {
    const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];
    setSelectedAvatar(randomAvatar.url);
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          className="bg-[#313647] rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden border-2 border-[#A3B087]"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-primary/20 p-6 border-b border-primary">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold text-white">Choose Your Avatar</h2>
                <p className="text-gray-300 mt-1">Pick a funky avatar or upload your own image</p>
              </div>
              <button
                onClick={onClose}
                className="text-gray-300 hover:text-white transition-colors p-2 hover:bg-white/10 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-4">
              <label className="flex-1">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  disabled={isUploading}
                />
                <div className="bg-[#435663] hover:bg-[#A3B087] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 cursor-pointer flex items-center justify-center gap-2">
                  <Upload className="h-5 w-5" />
                  {isUploading ? 'Uploading...' : 'Upload Image'}
                </div>
              </label>
              <Button
                onClick={handleShuffle}
                className="bg-[#435663] hover:bg-[#A3B087] text-white font-bold py-3 px-6 rounded-xl transition-all duration-300 flex items-center gap-2"
              >
                <Shuffle className="h-5 w-5" />
                Random
              </Button>
            </div>
          </div>

          {/* Avatar Grid */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-4">
              {avatars.map((avatar, index) => (
                <motion.div
                  key={index}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.95 }}
                  className={`relative cursor-pointer rounded-xl overflow-hidden border-4 transition-all duration-300 ${
                    selectedAvatar === avatar.url
                      ? 'border-[#A3B087] shadow-lg shadow-[#A3B087]/50'
                      : 'border-transparent hover:border-[#A3B087]/50'
                  }`}
                  onClick={() => handleSelect(avatar)}
                >
                  <Avatar className="h-full w-full aspect-square">
                    <AvatarImage src={avatar.url} alt={`Avatar ${index + 1}`} />
                    <AvatarFallback className="bg-[#435663] text-white">
                      {username?.charAt(0).toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  {selectedAvatar === avatar.url && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="absolute inset-0 bg-[#A3B087]/20 flex items-center justify-center"
                    >
                      <div className="bg-[#A3B087] rounded-full p-2">
                        <Check className="h-6 w-6 text-white" />
                      </div>
                    </motion.div>
                  )}
                </motion.div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="bg-primary/20 p-6 border-t border-primary flex justify-between items-center">
            <div className="text-sm text-gray-300">
              {selectedAvatar ? (
                <span className="flex items-center gap-2">
                  <Check className="h-4 w-4 text-[#A3B087]" />
                  Avatar selected
                </span>
              ) : (
                'Select an avatar to continue'
              )}
            </div>
            <div className="flex gap-3">
              <Button
                onClick={onClose}
                variant="outline"
                className="border-2 border-[#A3B087] text-white hover:bg-[#A3B087]/10"
              >
                Cancel
              </Button>
              <Button
                onClick={handleConfirm}
                disabled={!selectedAvatar}
                className="bg-[#435663] hover:bg-[#A3B087] text-white font-bold px-8 disabled:opacity-50"
              >
                Confirm
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default AvatarSelector;
