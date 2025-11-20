
import React, { useState, useEffect, useRef } from 'react';
import { Chat } from '@google/genai';
import { SetupView } from './views/SetupView';
import { ChatView } from './views/ChatView';
import { HomeView } from './views/HomeView';
import { LoadingScreen } from './components/LoadingScreen';
import { SplashScreen } from './components/SplashScreen';
import { UpdateOverlay } from './components/UpdateOverlay';
import { Toast } from './components/Toast';
import { AppState, CharacterProfile, Message } from './types';
import { generatePersonaImage, createChatSession, generateRandomProfileData } from './services/geminiService';
import { getAllProfiles, saveProfile, getChatHistory, deleteProfile, checkAndMigrate, generateId } from './services/persistenceService';
import { triggerHaptic } from './utils/haptics';
import { usageService } from './services/usageService';

const App: React.FC = () => {
  const [appState, setAppState] = useState<AppState>(AppState.SETUP);
  const [isLoadingSplash, setIsLoadingSplash] = useState(true);
  
  // State for Multiple Profiles
  const [profiles, setProfiles] = useState<CharacterProfile[]>([]);
  const [activeProfileId, setActiveProfileId] = useState<string | null>(null);
  const [profileToEdit, setProfileToEdit] = useState<CharacterProfile | null>(null);
  
  // State for Random Generation Review
  const [randomCandidate, setRandomCandidate] = useState<CharacterProfile | null>(null);
  const [lastGenderPref, setLastGenderPref] = useState<'male'|'female'|'any'>('any');
  
  // Chat State
  const [chatSession, setChatSession] = useState<Chat | null>(null);
  const [initialMessages, setInitialMessages] = useState<Message[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);

  // Toast State
  const [toast, setToast] = useState<{ msg: string, visible: boolean, type: 'success'|'info' }>({ msg: '', visible: false, type: 'success' });

  // Background Refs
  const blob1Ref = useRef<HTMLDivElement>(null);
  const blob2Ref = useRef<HTMLDivElement>(null);
  const blob3Ref = useRef<HTMLDivElement>(null);
  
  // Manual override for background theme (from Home Drawer)
  const [manualTimeOfDay, setManualTimeOfDay] = useState<'morning' | 'afternoon' | 'night' | null>(null);
  const [bgColors, setBgColors] = useState({
    blob1: 'bg-brand-900/20',
    blob2: 'bg-purple-900/15',
    blob3: 'bg-indigo-900/10'
  });

  // Initialization
  useEffect(() => {
    checkAndMigrate(); // Migrate old data if exists
    const savedProfiles = getAllProfiles();
    setProfiles(savedProfiles);
    
    if (savedProfiles.length > 0) {
        // If profiles exist, start at Home with the most recent one active
        setActiveProfileId(savedProfiles[0].id);
        setAppState(AppState.HOME);
    } else {
        setAppState(AppState.SETUP);
    }

    const timer = setTimeout(() => {
      setIsLoadingSplash(false);
    }, 4000);
    return () => clearTimeout(timer);
  }, []);

  // Background Parallax & Time of Day Logic
  useEffect(() => {
    const determineColors = () => {
        // Use manual override if set, otherwise use real time
        let timePeriod = manualTimeOfDay;
        if (!timePeriod) {
            const hour = new Date().getHours();
            if (hour >= 5 && hour < 12) timePeriod = 'morning';
            else if (hour >= 12 && hour < 18) timePeriod = 'afternoon';
            else timePeriod = 'night';
        }

        if (timePeriod === 'morning') {
            setBgColors({ blob1: 'bg-rose-500/20', blob2: 'bg-orange-300/15', blob3: 'bg-pink-500/10' });
        } else if (timePeriod === 'afternoon') {
            setBgColors({ blob1: 'bg-orange-600/15', blob2: 'bg-red-700/15', blob3: 'bg-amber-500/10' });
        } else {
            setBgColors({ blob1: 'bg-brand-900/20', blob2: 'bg-purple-900/15', blob3: 'bg-indigo-950/20' });
        }
    };

    determineColors();

    const handleMouseMove = (e: MouseEvent) => {
        requestAnimationFrame(() => {
            const x = (e.clientX / window.innerWidth) - 0.5;
            const y = (e.clientY / window.innerHeight) - 0.5;
            if (blob1Ref.current) blob1Ref.current.style.transform = `translate(${x * 30}px, ${y * 30}px)`;
            if (blob2Ref.current) blob2Ref.current.style.transform = `translate(${x * -50}px, ${y * -50}px)`;
            if (blob3Ref.current) blob3Ref.current.style.transform = `translate(${y * 20}px, ${x * 20}px)`;
        });
    };
    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [manualTimeOfDay]);

  const showToast = (msg: string, type: 'success'|'info' = 'success') => {
      setToast({ msg, visible: true, type });
  };

  const handleSetupComplete = async (newProfile: CharacterProfile) => {
    setAppState(AppState.GENERATING_PROFILE);
    setIsGenerating(true);
    setProfileToEdit(null);
    
    try {
      // Generate Image
      usageService.trackRequest();
      const avatarUrl = await generatePersonaImage(
        newProfile.name, 
        newProfile.relationship, 
        newProfile.traits
      );
      
      const fullProfile = { ...newProfile, avatarUrl };
      
      // Save to list
      saveProfile(fullProfile);
      
      // Update state (replace if editing, add if new)
      setProfiles(prev => {
          const exists = prev.some(p => p.id === fullProfile.id);
          if (exists) return prev.map(p => p.id === fullProfile.id ? fullProfile : p);
          return [fullProfile, ...prev];
      });
      
      setActiveProfileId(fullProfile.id);

      setIsGenerating(false);
      setAppState(AppState.HOME);
    } catch (error) {
      console.error("Setup failed", error);
      setAppState(AppState.SETUP);
      setIsGenerating(false);
      alert("Something went wrong creating your companion. Please try again.");
    }
  };

  const handleStartChat = () => {
      if (!activeProfileId) return;
      const profile = profiles.find(p => p.id === activeProfileId);
      if (!profile) return;

      // Load History
      const history = getChatHistory(profile.id);
      setInitialMessages(history);
      
      // Create Session
      const chat = createChatSession(profile, history);
      setChatSession(chat);
      
      setAppState(AppState.CHAT);
  };

  const handleRegenerateAvatar = async () => {
    if (!activeProfileId) return;
    const profile = profiles.find(p => p.id === activeProfileId);
    if (!profile) return;

    setIsGenerating(true); // Show overlay
    try {
        usageService.trackRequest();
        const newAvatarUrl = await generatePersonaImage(profile.name, profile.relationship, profile.traits);
        const updatedProfile = { ...profile, avatarUrl: newAvatarUrl };
        
        saveProfile(updatedProfile);
        setProfiles(prev => prev.map(p => p.id === profile.id ? updatedProfile : p));
    } catch (error) {
        console.error("Regeneration failed", error);
    } finally {
        setIsGenerating(false);
    }
  };

  const handleRandomCompanion = async (gender: 'male' | 'female' | 'any' = 'any') => {
      setLastGenderPref(gender); // Store for "Reject/Retry" logic
      setIsGenerating(true);
      setAppState(AppState.GENERATING_PROFILE);
      
      try {
          // 1. Generate Data
          usageService.trackRequest();
          const data = await generateRandomProfileData(gender);
          const name = data.name || 'Unknown';
          const traits = data.traits || 'Mysterious';
          const relationship = data.relationship || 'Stranger';
          
          // 2. Generate Image
          usageService.trackRequest();
          const avatarUrl = await generatePersonaImage(name, relationship, traits);
          
          // 3. Create Candidate
          const candidate: CharacterProfile = {
              id: generateId(),
              createdAt: Date.now(),
              name,
              relationship,
              traits: traits + (data.tags ? `\nTags: ${data.tags.join(', ')}` : ''),
              themeId: 'midnight',
              intimacyLevel: data.intimacyLevel || 'normal',
              tags: data.tags || [],
              avatarUrl
          };
          
          setRandomCandidate(candidate);
          setIsGenerating(false);
          setAppState(AppState.RANDOM_REVIEW);
          
      } catch (error) {
          console.error("Random gen failed", error);
          setIsGenerating(false);
          setAppState(AppState.HOME);
      }
  };

  const handleRandomApprove = () => {
      if (!randomCandidate) return;
      saveProfile(randomCandidate);
      setProfiles(prev => [randomCandidate, ...prev]);
      setActiveProfileId(randomCandidate.id);
      
      // Start Chat Immediately
      const history = getChatHistory(randomCandidate.id);
      setInitialMessages(history);
      const chat = createChatSession(randomCandidate, history);
      setChatSession(chat);
      
      setRandomCandidate(null);
      setAppState(AppState.CHAT);
  };

  const handleRandomReject = () => {
      setRandomCandidate(null);
      handleRandomCompanion(lastGenderPref); // Retry with same preference
  };

  const handleEditProfile = (profile: CharacterProfile) => {
      setProfileToEdit(profile);
      setAppState(AppState.SETUP);
  };

  const handleDeleteProfile = (id: string) => {
      // Logic handles deletion directly. Confirmation is now in HomeView.
      deleteProfile(id);
      const remaining = profiles.filter(p => p.id !== id);
      setProfiles(remaining);
      
      if (remaining.length > 0) {
          setActiveProfileId(remaining[0].id);
      } else {
          setActiveProfileId(null);
          // If no profiles left, we stay on Home but it handles empty state
      }
  };

  const getActiveProfile = () => profiles.find(p => p.id === activeProfileId) || null;

  if (isLoadingSplash) {
    return <SplashScreen />;
  }

  return (
    <div className="h-[100dvh] w-full bg-black text-white flex items-center justify-center relative overflow-hidden selection:bg-brand-500/30">
        
        {/* Background */}
        <div ref={blob1Ref} className={`absolute top-[-20%] left-[-10%] w-[70%] h-[70%] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 animate-pulse-slow mix-blend-screen ${bgColors.blob1}`}></div>
        <div ref={blob2Ref} className={`absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] rounded-full blur-[120px] pointer-events-none transition-colors duration-1000 mix-blend-screen ${bgColors.blob2}`}></div>
        <div ref={blob3Ref} className={`absolute top-[40%] left-[30%] w-[40%] h-[40%] rounded-full blur-[100px] pointer-events-none transition-colors duration-1000 mix-blend-screen ${bgColors.blob3}`}></div>

        {/* Main Container */}
        <div className="relative z-10 w-full h-full md:h-[90vh] md:max-h-[850px] md:max-w-md lg:max-w-lg flex flex-col shadow-2xl md:rounded-3xl overflow-hidden bg-black/50 backdrop-blur-sm border-white/5 md:border">
            
            {appState === AppState.SETUP && (
                <div className="w-full h-full overflow-y-auto p-6 md:p-0 flex flex-col justify-center relative z-20">
                    <SetupView 
                        onComplete={handleSetupComplete}
                        onCancel={() => {
                            setProfileToEdit(null);
                            setAppState(AppState.HOME);
                        }}
                        isGenerating={isGenerating}
                        hasExistingProfiles={profiles.length > 0}
                        initialProfile={profileToEdit}
                    />
                </div>
            )}

            {appState === AppState.GENERATING_PROFILE && !isGenerating && (
                <LoadingScreen message="Finalizing..." />
            )}
            
            {appState === AppState.HOME && (
                <div className="w-full h-full animate-fade-in relative z-20">
                    <HomeView 
                        profiles={profiles}
                        activeProfileId={activeProfileId || ''}
                        onProfileSelect={(p) => setActiveProfileId(p.id)}
                        onStartChat={handleStartChat}
                        onCreateNew={() => {
                            setProfileToEdit(null);
                            setAppState(AppState.SETUP);
                        }}
                        onRandomCompanion={handleRandomCompanion}
                        onEditProfile={handleEditProfile}
                        onDeleteProfile={handleDeleteProfile}
                        onThemeChange={setManualTimeOfDay}
                        onCheckUpdate={() => setAppState(AppState.UPDATE_CHECK)}
                    />
                </div>
            )}

            {appState === AppState.CHAT && getActiveProfile() && (
                <div className="w-full h-full animate-fade-in absolute inset-0 z-10">
                    <ChatView 
                        chatSession={chatSession} 
                        profile={getActiveProfile()!} 
                        initialMessages={initialMessages}
                        onReset={() => setAppState(AppState.HOME)} // End session goes to Home
                        onRegenerateAvatar={handleRegenerateAvatar}
                        onGoHome={() => setAppState(AppState.HOME)}
                    />
                </div>
            )}

            {/* Random Review Overlay */}
            {appState === AppState.RANDOM_REVIEW && randomCandidate && (
                <div className="absolute inset-0 z-30 bg-black/95 flex flex-col animate-fade-in">
                     {/* Close Button */}
                     <button 
                        onClick={() => { triggerHaptic(10); setRandomCandidate(null); setAppState(AppState.HOME); }}
                        className="absolute top-6 right-6 p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white z-50 border border-white/10 shadow-lg"
                     >
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                     </button>

                     {/* Candidate Card */}
                     <div className="flex-1 relative">
                         <img src={randomCandidate.avatarUrl} className="w-full h-full object-cover" />
                         <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                         <div className="absolute bottom-0 left-0 w-full p-8 pb-32">
                             <h2 className="text-5xl font-bold text-white mb-2">{randomCandidate.name}</h2>
                             <p className="text-brand-400 font-bold uppercase tracking-widest mb-4">{randomCandidate.relationship}</p>
                             <div className="flex flex-wrap gap-2 mb-4">
                                 {randomCandidate.tags?.map(t => <span key={t} className="px-2 py-1 bg-white/10 rounded-full text-xs">{t}</span>)}
                             </div>
                             <p className="text-gray-300 italic opacity-80">{randomCandidate.traits.split('\n')[0]}</p>
                         </div>
                     </div>
                     
                     {/* Action Buttons */}
                     <div className="absolute bottom-8 left-0 w-full px-8 flex items-center justify-between">
                         <button 
                            onClick={() => { triggerHaptic(10); handleRandomReject(); }}
                            className="w-16 h-16 rounded-full bg-red-500/20 border border-red-500/50 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all"
                         >
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
                         </button>
                         
                         <p className="text-gray-500 font-medium uppercase text-xs tracking-widest">Accept Companion?</p>
                         
                         <button 
                            onClick={() => { triggerHaptic(10); handleRandomApprove(); }}
                            className="w-16 h-16 rounded-full bg-green-500/20 border border-green-500/50 text-green-500 flex items-center justify-center hover:bg-green-500 hover:text-white transition-all"
                         >
                             <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="20 6 9 17 4 12"></polyline></svg>
                         </button>
                     </div>
                </div>
            )}
            
            {/* Update Check Overlay */}
            {appState === AppState.UPDATE_CHECK && (
                <UpdateOverlay onComplete={(found) => {
                    setAppState(AppState.HOME);
                    if(found) {
                        // Simulate reload
                        window.location.reload(); 
                    } else {
                        showToast("App is latest version", "info");
                    }
                }} />
            )}

            {/* Global Loading Overlay */}
            {isGenerating && (
                <div className="absolute inset-0 z-50 bg-black/60 backdrop-blur-md flex flex-col justify-center animate-fade-in">
                    <LoadingScreen message={appState === AppState.SETUP ? "Updating companion..." : "Dreaming up someone special..."} />
                </div>
            )}

        </div>
        
        {/* Global Toast */}
        <Toast message={toast.msg} isVisible={toast.visible} onHide={() => setToast(prev => ({ ...prev, visible: false }))} type={toast.type} />
    </div>
  );
};

export default App;