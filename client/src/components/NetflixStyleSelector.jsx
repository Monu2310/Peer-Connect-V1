import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, Plus, Check, Film, Tv, Book, Music, Gamepad2 } from 'lucide-react';
import { Button } from './ui/button';
import { Input } from './ui/input';

const CATEGORIES = {
  movies: {
    icon: Film,
    label: 'Movies',
    options: [
      'Action', 'Adventure', 'Comedy', 'Drama', 'Horror', 'Sci-Fi', 
      'Fantasy', 'Thriller', 'Romance', 'Mystery', 'Crime', 'Animation',
      'Documentary', 'Biography', 'Musical', 'War', 'Western', 'Historical'
    ]
  },
  shows: {
    icon: Tv,
    label: 'TV Shows',
    options: [
      'Drama Series', 'Comedy Series', 'Crime', 'Sci-Fi', 'Fantasy',
      'Reality TV', 'Documentary Series', 'Anime', 'Sitcom', 'Thriller',
      'Horror', 'Mystery', 'Action', 'Adventure', 'Historical', 'Romance'
    ]
  },
  books: {
    icon: Book,
    label: 'Books',
    options: [
      'Fiction', 'Non-Fiction', 'Mystery', 'Thriller', 'Romance', 'Sci-Fi',
      'Fantasy', 'Biography', 'Self-Help', 'History', 'Poetry', 'Horror',
      'Adventure', 'Crime', 'Young Adult', 'Classics', 'Philosophy', 'Memoir'
    ]
  },
  music: {
    icon: Music,
    label: 'Music',
    options: [
      'Pop', 'Rock', 'Hip Hop', 'R&B', 'Jazz', 'Classical', 'Electronic',
      'Country', 'Reggae', 'Blues', 'Metal', 'Indie', 'Folk', 'Soul',
      'Punk', 'Alternative', 'EDM', 'K-Pop', 'Latin', 'Disco'
    ]
  },
  games: {
    icon: Gamepad2,
    label: 'Games',
    options: [
      'Action', 'Adventure', 'RPG', 'Strategy', 'FPS', 'Sports', 
      'Racing', 'Simulation', 'Puzzle', 'Horror', 'Platformer',
      'Fighting', 'MMO', 'Survival', 'Sandbox', 'Indie', 'Battle Royale'
    ]
  }
};

const NetflixStyleSelector = ({ isOpen, onClose, onSave, category = 'movies', initialSelected = [] }) => {
  const [selected, setSelected] = useState(initialSelected);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState(category);

  const categoryData = CATEGORIES[activeCategory];
  const Icon = categoryData.icon;

  const filteredOptions = categoryData.options.filter(option =>
    option.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const toggleSelection = (option) => {
    setSelected(prev =>
      prev.includes(option)
        ? prev.filter(item => item !== option)
        : [...prev, option]
    );
  };

  const handleSave = () => {
    onSave(activeCategory, selected);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-card border border-border/50 rounded-3xl shadow-2xl max-w-4xl w-full max-h-[85vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="bg-primary/10 backdrop-blur-sm p-6 border-b border-border/50">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Choose Your {categoryData.label}</h2>
                  <p className="text-sm text-muted-foreground">Select your favorite genres</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="text-muted-foreground hover:text-foreground transition-colors p-2 hover:bg-muted/50 rounded-lg"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Category Tabs */}
            <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
              {Object.entries(CATEGORIES).map(([key, { icon: CategoryIcon, label }]) => (
                <button
                  key={key}
                  onClick={() => setActiveCategory(key)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap ${
                    activeCategory === key
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'bg-muted/30 text-muted-foreground hover:bg-muted/50'
                  }`}
                >
                  <CategoryIcon className="h-4 w-4" />
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Search */}
          <div className="p-6 border-b border-border/50">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={`Search ${categoryData.label.toLowerCase()}...`}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 h-12 bg-background border-border/50"
              />
            </div>
            {selected.length > 0 && (
              <p className="text-sm text-muted-foreground mt-3">
                {selected.length} selected
              </p>
            )}
          </div>

          {/* Genre Grid */}
          <div className="p-6 overflow-y-auto max-h-[calc(85vh-300px)]">
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {filteredOptions.map((option) => {
                const isSelected = selected.includes(option);
                return (
                  <motion.button
                    key={option}
                    onClick={() => toggleSelection(option)}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className={`relative p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? 'border-primary bg-primary/10 shadow-md'
                        : 'border-border/50 bg-card hover:border-primary/50 hover:bg-muted/30'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className={`font-medium text-sm ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                        {option}
                      </span>
                      {isSelected && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="w-5 h-5 rounded-full bg-primary flex items-center justify-center"
                        >
                          <Check className="h-3 w-3 text-primary-foreground" />
                        </motion.div>
                      )}
                    </div>
                  </motion.button>
                );
              })}
            </div>

            {filteredOptions.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No results found</p>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="bg-primary/5 p-6 border-t border-border/50 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              {selected.length} {categoryData.label.toLowerCase()} selected
            </p>
            <div className="flex gap-3">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button onClick={handleSave} className="min-w-[120px]">
                Save Selection
              </Button>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default NetflixStyleSelector;
