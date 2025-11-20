
import React, { useState, useEffect } from 'react';
import { CharacterProfile, RelationshipType } from '../types';
import { Button } from '../components/Button';
import { triggerHaptic } from '../utils/haptics';
import { generateId } from '../services/persistenceService';

interface SetupViewProps {
  onComplete: (profile: CharacterProfile) => void;
  onCancel: () => void; // Back button support
  isGenerating: boolean;
  hasExistingProfiles: boolean;
  initialProfile?: CharacterProfile | null;
}

const PERSONALITY_TYPES = [
  "Caring", "Dominant", "Flirting", "Submissive", 
  "Shy", "Romantic", "Humorous", "Arrogant"
];

export const SetupView: React.FC<SetupViewProps> = ({ 
  onComplete, 
  onCancel, 
  isGenerating, 
  hasExistingProfiles,
  initialProfile 
}) => {
  const [name, setName] = useState('');
  const [relationship, setRelationship] = useState<string>(RelationshipType.GIRLFRIEND);
  const [isCustomRel, setIsCustomRel] = useState(false);
  const [customRel, setCustomRel] = useState('');
  const [traits, setTraits] = useState('');
  const [selectedPersonalities, setSelectedPersonalities] = useState<string[]>([]);
  const [intimacyLevel, setIntimacyLevel] = useState<'normal' | 'explicit'>('normal');
  const [showWarning, setShowWarning] = useState(false);

  // Pre-fill for Edit Mode
  useEffect(() => {
    if (initialProfile) {
      setName(initialProfile.name);
      setTraits(initialProfile.traits.split('\nAI Personality')[0]); // Remove auto-appended text
      setIntimacyLevel(initialProfile.intimacyLevel);
      if (initialProfile.tags) setSelectedPersonalities(initialProfile.tags);
      
      const isStandard = Object.values(RelationshipType).includes(initialProfile.relationship as any);
      if (isStandard) {
        setRelationship(initialProfile.relationship);
        setIsCustomRel(false);
      } else {
        setCustomRel(initialProfile.relationship);
        setIsCustomRel(true);
      }
    }
  }, [initialProfile]);

  const togglePersonality = (type: string) => {
    triggerHaptic(5);
    setSelectedPersonalities(prev => 
      prev.includes(type) 
        ? prev.filter(t => t !== type)
        : [...prev, type]
    );
  };

  const handleInitialSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (name && traits) {
      triggerHaptic(10);
      const currentRel = isCustomRel ? customRel : relationship;
      if (currentRel.trim()) {
        setShowWarning(true);
      }
    }
  };

  const handleFinalConfirm = () => {
    triggerHaptic(10);
    const finalRel = isCustomRel ? customRel : relationship;
    const personalityStr = selectedPersonalities.length > 0 
      ? `\nAI Personality Types: ${selectedPersonalities.join(', ')}.` 
      : '';
    
    const fullTraits = `${traits}${personalityStr}`;

    // Use existing ID if editing, else generate new robust ID
    const newProfile: CharacterProfile = { 
      id: initialProfile ? initialProfile.id : generateId(),
      createdAt: initialProfile ? initialProfile.createdAt : Date.now(),
      name, 
      relationship: finalRel, 
      traits: fullTraits,
      themeId: initialProfile ? initialProfile.themeId : 'midnight',
      intimacyLevel,
      tags: selectedPersonalities,
      avatarUrl: initialProfile?.avatarUrl // Keep existing avatar until regenerated
    };

    onComplete(newProfile);
    setShowWarning(false);
  };

  return (
    <>
      <div className="w-full max-w-md mx-auto bg-dark-800/50 backdrop-blur-xl border border-white/10 rounded-3xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto custom-scrollbar relative">
        
        <button 
            onClick={() => { triggerHaptic(5); onCancel(); }}
            className="absolute top-6 left-6 p-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-400 hover:text-white transition-colors"
        >
            <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
        </button>

        <div className="text-center mb-8 mt-4">
          <h1 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-brand-400 to-brand-200">
            {initialProfile ? 'Edit Companion' : 'Design Companion'}
          </h1>
          <p className="text-gray-400 text-sm mt-2">
            {initialProfile ? 'Update their personality & details.' : 'Create a new unique AI personality.'}
          </p>
        </div>
        
        <form onSubmit={handleInitialSubmit} className="space-y-6">
          {/* Name Input */}
          <div className="space-y-2">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300">Name</label>
            <input
              id="name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none placeholder-gray-600"
              placeholder="e.g. Evelyn"
              required
            />
          </div>

          {/* Relationship Select */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">Relationship</label>
            <div className="grid grid-cols-2 gap-3">
              {Object.values(RelationshipType).map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => {
                    triggerHaptic(5);
                    setRelationship(type);
                    setIsCustomRel(false);
                  }}
                  className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                    !isCustomRel && relationship === type
                      ? 'bg-brand-900/30 border-brand-500 text-brand-200'
                      : 'bg-dark-900/50 border-dark-600 text-gray-400 hover:border-dark-500'
                  }`}
                >
                  {type}
                </button>
              ))}
              <button
                type="button"
                onClick={() => {
                    triggerHaptic(5);
                    setIsCustomRel(true);
                }}
                className={`px-3 py-2 rounded-xl text-xs font-medium transition-all border ${
                  isCustomRel
                    ? 'bg-brand-900/30 border-brand-500 text-brand-200'
                    : 'bg-dark-900/50 border-dark-600 text-gray-400 hover:border-dark-500'
                }`}
              >
                Add others
              </button>
            </div>
            
            {isCustomRel && (
              <input
                type="text"
                value={customRel}
                onChange={(e) => setCustomRel(e.target.value)}
                className="w-full mt-3 bg-dark-900/50 border border-brand-500/50 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none placeholder-gray-500 animate-fade-in"
                placeholder="Ex. Teacher, Manager etc"
                required={isCustomRel}
                autoFocus
              />
            )}
          </div>

          {/* Adult Depth Toggle */}
          <div className="space-y-2">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-medium text-gray-300">Adult Depth</label>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase transition-colors duration-300 ${intimacyLevel === 'explicit' ? 'bg-brand-500/20 text-brand-300' : 'bg-cyan-500/20 text-cyan-300'}`}>
                {intimacyLevel === 'explicit' ? 'Flirty Mode Active' : 'Normal Mode Active'}
              </span>
            </div>
            
            <div className="relative flex items-center bg-dark-900/50 border border-dark-600 rounded-xl p-1 h-14 cursor-pointer overflow-hidden group">
              {/* Sliding Background */}
              <div 
                className={`absolute top-1 bottom-1 rounded-lg shadow-md transition-all duration-500 cubic-bezier(0.4, 0, 0.2, 1) z-0 ${
                  intimacyLevel === 'normal' 
                    ? 'left-1 w-[calc(50%-4px)] bg-gradient-to-br from-cyan-700 to-blue-700 shadow-cyan-500/20' 
                    : 'left-[50%] w-[calc(50%-4px)] bg-gradient-to-br from-brand-600 to-pink-600 shadow-brand-500/30'
                }`}
              ></div>

              {/* Normal Button */}
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setIntimacyLevel('normal'); }}
                className={`flex-1 relative z-10 flex items-center justify-center space-x-2 text-sm font-bold transition-colors duration-300 ${
                  intimacyLevel === 'normal' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className={`w-4 h-4 ${intimacyLevel === 'normal' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"></path></svg>
                <span>Normal</span>
              </button>
              
              {/* Flirty Button */}
              <button
                type="button"
                onClick={() => { triggerHaptic(15); setIntimacyLevel('explicit'); }}
                className={`flex-1 relative z-10 flex items-center justify-center space-x-2 text-sm font-bold transition-colors duration-300 ${
                  intimacyLevel === 'explicit' ? 'text-white' : 'text-gray-500 hover:text-gray-300'
                }`}
              >
                <svg className={`w-4 h-4 ${intimacyLevel === 'explicit' ? 'animate-pulse' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9.879 16.121A3 3 0 1012.015 11L11 14H9c0 .768.293 1.536.879 2.121z"></path></svg>
                <span>Flirty</span>
              </button>
            </div>
            <p className={`text-xs px-1 transition-colors duration-300 ${intimacyLevel === 'normal' ? 'text-cyan-400/70' : 'text-brand-400/70'}`}>
              {intimacyLevel === 'normal' 
                ? "Playful, safe, and friendly conversation." 
                : "Immersive, bold, and unrestrained romance."}
            </p>
          </div>

          {/* Traits Textarea */}
          <div className="space-y-2">
            <label htmlFor="traits" className="block text-sm font-medium text-gray-300">Personality & Appearance</label>
            <textarea
              id="traits"
              value={traits}
              onChange={(e) => setTraits(e.target.value)}
              className="w-full bg-dark-900/50 border border-dark-600 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all outline-none h-24 resize-none placeholder-gray-600"
              placeholder="Describe their appearance and vibes..."
              required
            />
          </div>

          {/* AI Personality Type */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-gray-300">AI Personal Type</label>
            <div className="flex flex-wrap gap-2">
              {PERSONALITY_TYPES.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => togglePersonality(type)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedPersonalities.includes(type)
                      ? 'bg-brand-600 text-white border-brand-500 shadow-[0_0_10px_rgba(225,29,72,0.3)]'
                      : 'bg-dark-900/50 border-dark-600 text-gray-400 hover:text-gray-300 hover:border-dark-500'
                  }`}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>

          <Button 
            type="submit" 
            className="w-full font-bold tracking-wide mt-4"
            isLoading={isGenerating}
          >
            {initialProfile ? 'UPDATE COMPANION' : 'BRING TO LIFE'}
          </Button>
        </form>
      </div>

      {/* 18+ Warning Modal */}
      {showWarning && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-sm bg-dark-800 border border-red-900/50 rounded-2xl p-6 shadow-[0_0_50px_rgba(159,18,57,0.3)] text-center transform transition-all scale-100">
            <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-2xl font-bold text-red-500">18+</span>
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Content Warning</h2>
            <p className="text-gray-400 text-sm mb-8 leading-relaxed">
              This experience involves generated personas and interactions that may be suitable for mature audiences only. User discretion is advised.
            </p>
            
            <div className="grid grid-cols-2 gap-4">
              <button
                onClick={() => { triggerHaptic(5); setShowWarning(false); }}
                className="px-4 py-3 rounded-xl text-sm font-medium text-gray-300 bg-dark-700 hover:bg-dark-600 transition-colors"
              >
                EXIT
              </button>
              <button
                onClick={handleFinalConfirm}
                className="px-4 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 shadow-lg shadow-brand-900/20 transition-all"
              >
                ENTER
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};