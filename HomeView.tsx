
import React, { useRef, useState, useEffect } from 'react';
import { CharacterProfile, UserProfile } from '../types';
import { THEMES } from '../themes';
import { triggerHaptic } from '../utils/haptics';
import { getUserProfile, saveUserProfile } from '../services/persistenceService';
import { usageService } from '../services/usageService';

interface HomeViewProps {
    profiles: CharacterProfile[];
    activeProfileId: string;
    onProfileSelect: (profile: CharacterProfile) => void;
    onStartChat: () => void;
    onCreateNew: () => void;
    onRandomCompanion: (gender: 'male' | 'female') => void;
    onEditProfile: (profile: CharacterProfile) => void;
    onDeleteProfile: (id: string) => void;
    onThemeChange: (mode: 'morning' | 'afternoon' | 'night') => void;
    onCheckUpdate: () => void;
}

const VERSION_HISTORY = [
    { ver: "v1.4.2", desc: "Improved deletion flow with animations." },
    { ver: "v1.4.1", desc: "Added API Usage Tracker & Rate Limit Timer." },
    { ver: "v1.4.0", desc: "User Profile System, Interest Tags & Avatar Customization. Enhanced Photorealism." },
    { ver: "v1.3.0", desc: "Photorealistic Image Engine, Enhanced Random Generation UI, Close options added." },
    { ver: "v1.2.0", desc: "Added Edit/Delete, Activity stats, and Update checker." },
    { ver: "v1.1.5", desc: "Added random companion generator & gender selection." },
    { ver: "v1.1.0", desc: "Performance improvements & Malayalam support." },
    { ver: "v1.0.0", desc: "Initial Release." }
];

const TAG_GROUPS = [
  {
    title: "Region & Origin",
    tags: ["Asian", "American", "African", "Russian", "Japan", "Indian", "Mallu", "Malayalam"]
  },
  {
    title: "Appearance",
    tags: ["Blonde hair", "Black hair", "Curly hair", "Pony tail", "Boy cut"]
  },
  {
    title: "Identity & Age",
    tags: ["Teen", "Young", "Milf", "Aged", "Girl", "Boy", "Men", "Women", "Trans", "Shemale", "LGBTQ+"]
  },
  {
    title: "Other Interests",
    tags: ["Roleplay"]
  }
];

export const HomeView: React.FC<HomeViewProps> = ({ 
    profiles, 
    activeProfileId, 
    onProfileSelect, 
    onStartChat, 
    onCreateNew,
    onRandomCompanion,
    onEditProfile,
    onDeleteProfile,
    onThemeChange,
    onCheckUpdate
}) => {
    const activeProfile = profiles.find(p => p.id === activeProfileId) || profiles[0];
    const theme = THEMES[activeProfile?.themeId || 'midnight'];
    const scrollRef = useRef<HTMLDivElement>(null);
    
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [isUpdatesOpen, setIsUpdatesOpen] = useState(false);
    const [activeCardMenuId, setActiveCardMenuId] = useState<string | null>(null);
    
    // Usage Stats State
    const [usageStats, setUsageStats] = useState(usageService.getStats());

    // Gender Modal State
    const [showGenderModal, setShowGenderModal] = useState(false);

    // User Profile State
    const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
    const [showProfileModal, setShowProfileModal] = useState(false);
    const [editName, setEditName] = useState('');

    // Deletion State
    const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    useEffect(() => {
        const p = getUserProfile();
        setUserProfile(p);
        setEditName(p.name);
        
        // Update stats interval
        const interval = setInterval(() => {
            setUsageStats(usageService.getStats());
        }, 1000);
        return () => clearInterval(interval);
    }, []);

    // Close menus when clicking outside
    useEffect(() => {
        const handleClick = () => setActiveCardMenuId(null);
        window.addEventListener('click', handleClick);
        return () => window.removeEventListener('click', handleClick);
    }, []);

    const handleSaveUserProfile = () => {
        if (!userProfile) return;
        const updated = { ...userProfile, name: editName };
        saveUserProfile(updated);
        setUserProfile(updated);
        setShowProfileModal(false);
        triggerHaptic(10);
    };

    const toggleInterest = (tag: string) => {
        if (!userProfile) return;
        triggerHaptic(5);
        const exists = userProfile.interests.includes(tag);
        const newInterests = exists 
            ? userProfile.interests.filter(t => t !== tag) 
            : [...userProfile.interests, tag];
        
        const updated = { ...userProfile, interests: newInterests };
        setUserProfile(updated);
        saveUserProfile(updated);
    };

    const handleDeleteRequest = (id: string) => {
        triggerHaptic(10);
        setDeleteTargetId(id);
        setActiveCardMenuId(null);
    };

    const confirmDelete = () => {
        if (!deleteTargetId) return;
        triggerHaptic(20);
        setIsDeleting(true);

        // 3 Second Animation Sequence
        setTimeout(() => {
            onDeleteProfile(deleteTargetId);
            setIsDeleting(false);
            setDeleteTargetId(null);
            triggerHaptic(50); // Completion vibration
        }, 3000);
    };

    const totalCompanions = profiles.length;
    const mostUsedRel = profiles.length > 0 ? profiles[0].relationship : 'N/A';
    
    // Calculate usage percentages
    const rpmPercent = Math.min((usageStats.rpm / usageStats.rpmLimit) * 100, 100);

    return (
        <div className={`flex flex-col h-full w-full ${theme?.containerBg || 'bg-black'} relative overflow-hidden transition-colors duration-500`}>
            
            {/* Drawer / Slider */}
            <div className={`absolute inset-0 z-50 transform transition-transform duration-300 ease-in-out ${isDrawerOpen ? 'translate-x-0' : '-translate-x-full'} flex`}>
                <div className="w-3/4 max-w-xs h-full bg-dark-900/95 backdrop-blur-xl border-r border-white/10 p-6 flex flex-col shadow-2xl relative z-50 overflow-y-auto">
                     <h2 className="text-2xl font-bold text-white mb-8 tracking-tight">Menu</h2>
                     
                     {/* Theme Section */}
                     <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-wider">Ambience Theme</h3>
                        <div className="grid grid-cols-3 gap-3">
                            {/* Morning */}
                            <button 
                                onClick={() => { onThemeChange('morning'); triggerHaptic(5); }} 
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-rose-400 to-orange-300 shadow-lg shadow-rose-900/20 group-hover:scale-105 transition-transform duration-300 border-2 border-white/5 group-hover:border-white/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">Morning</span>
                            </button>

                            {/* Afternoon */}
                            <button 
                                onClick={() => { onThemeChange('afternoon'); triggerHaptic(5); }} 
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-amber-400 to-orange-600 shadow-lg shadow-orange-900/20 group-hover:scale-105 transition-transform duration-300 border-2 border-white/5 group-hover:border-white/20 relative overflow-hidden">
                                    <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">Sunset</span>
                            </button>

                            {/* Night */}
                            <button 
                                onClick={() => { onThemeChange('night'); triggerHaptic(5); }} 
                                className="flex flex-col items-center space-y-2 group"
                            >
                                <div className="w-full aspect-square rounded-2xl bg-gradient-to-br from-indigo-900 to-brand-900 shadow-lg shadow-indigo-900/20 group-hover:scale-105 transition-transform duration-300 border-2 border-white/5 group-hover:border-white/20 relative overflow-hidden">
                                     <div className="absolute top-2 right-3 w-0.5 h-0.5 bg-white rounded-full opacity-70"></div>
                                     <div className="absolute bottom-3 left-3 w-0.5 h-0.5 bg-white rounded-full opacity-40"></div>
                                     <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                                </div>
                                <span className="text-[10px] font-medium text-gray-400 group-hover:text-white transition-colors">Midnight</span>
                            </button>
                        </div>
                     </div>

                     {/* Activity Section */}
                     <div className="mb-8">
                        <h3 className="text-xs font-bold uppercase text-gray-500 mb-4 tracking-wider">Activity</h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <div className="bg-white/5 rounded-2xl p-4">
                                <p className="text-2xl font-bold text-brand-500">{totalCompanions}</p>
                                <p className="text-[10px] text-gray-400 uppercase mt-1">Companions</p>
                            </div>
                            <div className="bg-white/5 rounded-2xl p-4">
                                <p className="text-xl font-bold text-purple-400 truncate">{mostUsedRel.split(' ')[0]}</p>
                                <p className="text-[10px] text-gray-400 uppercase mt-1">Top Type</p>
                            </div>
                        </div>

                        {/* API Usage Limit */}
                        <div className="bg-white/5 rounded-2xl p-4 border border-white/5">
                            <div className="flex justify-between items-center mb-2">
                                <span className="text-[10px] font-bold uppercase text-gray-400">AI Energy (RPM)</span>
                                {usageStats.cooldownRemaining > 0 ? (
                                    <span className="text-[10px] font-bold text-red-400 animate-pulse">
                                        {usageStats.cooldownRemaining}s cooldown
                                    </span>
                                ) : (
                                    <span className={`text-[10px] font-bold ${usageStats.rpm >= 10 ? 'text-yellow-400' : 'text-green-400'}`}>
                                        {usageStats.rpm} / {usageStats.rpmLimit}
                                    </span>
                                )}
                            </div>
                            
                            <div className="w-full h-2 bg-gray-800 rounded-full overflow-hidden mb-3">
                                <div 
                                    className={`h-full transition-all duration-500 ${usageStats.cooldownRemaining > 0 ? 'bg-red-500' : 'bg-gradient-to-r from-brand-600 to-brand-400'}`} 
                                    style={{ width: `${usageStats.cooldownRemaining > 0 ? 100 : rpmPercent}%` }}
                                ></div>
                            </div>
                            
                            <div className="flex justify-between text-[10px] text-gray-500">
                                <span>Daily Usage</span>
                                <span>{usageStats.rpd} / {usageStats.rpdLimit}</span>
                            </div>
                        </div>
                     </div>

                     {/* Updates Section */}
                     <div className="mb-8">
                        <button 
                            onClick={() => { triggerHaptic(5); setIsUpdatesOpen(!isUpdatesOpen); }}
                            className="w-full flex items-center justify-between text-xs font-bold uppercase text-gray-500 mb-4 tracking-wider"
                        >
                            <span>What's New ?</span>
                            <svg className={`w-4 h-4 transition-transform ${isUpdatesOpen ? 'rotate-180' : ''}`} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="6 9 12 15 18 9"></polyline></svg>
                        </button>
                        
                        {isUpdatesOpen && (
                            <div className="animate-fade-in space-y-4">
                                <div className="space-y-3 border-l-2 border-white/10 pl-4">
                                    {VERSION_HISTORY.map((item, i) => (
                                        <div key={i}>
                                            <p className="text-white font-bold text-sm">{item.ver}</p>
                                            <p className="text-gray-400 text-xs leading-snug">{item.desc}</p>
                                        </div>
                                    ))}
                                </div>
                                <button 
                                    onClick={() => { triggerHaptic(10); onCheckUpdate(); }}
                                    className="w-full py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white text-xs font-bold tracking-wider shadow-lg shadow-blue-900/20 hover:brightness-110 transition-all"
                                >
                                    CHECK FOR UPDATE
                                </button>
                            </div>
                        )}
                     </div>

                     <div className="mt-auto">
                        <p className="text-xs text-gray-600 text-center">Velvet AI v1.4.2</p>
                     </div>
                </div>
                <div className="flex-1 bg-black/50 backdrop-blur-sm" onClick={() => setIsDrawerOpen(false)}></div>
            </div>

            {/* Header */}
            <div className="flex-none px-6 py-5 flex items-center justify-between z-30">
                <button 
                    onClick={() => { triggerHaptic(10); setIsDrawerOpen(true); }}
                    className="text-white/80 p-2 -ml-2 hover:text-white transition-colors"
                >
                     <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                </button>
                
                <h1 className="text-xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-brand-600 drop-shadow-sm">
                    VELVET
                </h1>
                
                {/* User Profile Avatar */}
                <button 
                    onClick={() => { triggerHaptic(10); setShowProfileModal(true); }}
                    className="relative w-10 h-10 rounded-full overflow-hidden border-2 border-white/10 hover:border-brand-500 transition-colors shadow-lg"
                >
                    <img 
                        src={userProfile?.avatarUrl} 
                        alt="User" 
                        className="w-full h-full object-cover bg-white"
                    />
                </button>
            </div>

            {/* Carousel Container */}
            <div className="flex-1 flex items-center z-10 overflow-hidden">
                <div 
                    ref={scrollRef}
                    className="w-full h-[75vh] flex overflow-x-auto snap-x snap-mandatory no-scrollbar px-4 items-center space-x-4"
                    style={{ scrollBehavior: 'smooth' }}
                >
                    {profiles.map(profile => (
                        <div 
                            key={profile.id} 
                            className="snap-center shrink-0 w-full h-full flex flex-col items-center justify-center py-4"
                            style={{ width: '100%' }}
                            onClick={() => {
                                if(activeProfileId !== profile.id) {
                                    triggerHaptic(5);
                                    onProfileSelect(profile);
                                }
                            }}
                        >
                            <div className={`w-full max-w-sm h-full bg-white/5 backdrop-blur-xl border ${activeProfileId === profile.id ? 'border-brand-500/50 shadow-2xl shadow-brand-900/20' : 'border-white/10 opacity-60 scale-95'} rounded-[2.5rem] overflow-hidden transition-all duration-300 flex flex-col relative`}>
                                
                                {/* Image Area */}
                                <div className="relative flex-1">
                                     <img 
                                        src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.name}`} 
                                        alt={profile.name}
                                        className="w-full h-full object-cover"
                                     />
                                     <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/30 to-transparent"></div>
                                     
                                     {/* Card Menu (Edit/Delete) */}
                                     {activeProfileId === profile.id && (
                                         <div className="absolute top-4 right-4 z-40">
                                             <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    triggerHaptic(5);
                                                    setActiveCardMenuId(activeCardMenuId === profile.id ? null : profile.id);
                                                }}
                                                className="p-2 bg-black/20 hover:bg-black/40 backdrop-blur-md rounded-full text-white transition-colors"
                                             >
                                                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
                                             </button>
                                             
                                             {activeCardMenuId === profile.id && (
                                                 <div className="absolute top-full right-0 mt-2 w-40 bg-dark-800 border border-white/10 rounded-xl shadow-xl overflow-hidden animate-fade-in z-50">
                                                     <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            triggerHaptic(10);
                                                            onEditProfile(profile);
                                                            setActiveCardMenuId(null);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10 flex items-center space-x-2"
                                                     >
                                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 3a2.828 2.828 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5L17 3z"></path></svg>
                                                         <span>Edit Identity</span>
                                                     </button>
                                                     <button 
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            handleDeleteRequest(profile.id);
                                                        }}
                                                        className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10 flex items-center space-x-2"
                                                     >
                                                         <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6"></polyline><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path></svg>
                                                         <span>Delete</span>
                                                     </button>
                                                 </div>
                                             )}
                                         </div>
                                     )}
                                     
                                     {/* Info Overlay */}
                                     <div className="absolute bottom-0 left-0 w-full p-6 pb-8">
                                         <h2 className="text-4xl font-bold text-white mb-2 tracking-tight">{profile.name}</h2>
                                         <div className="flex items-center space-x-2 mb-4">
                                             <span className={`h-2 w-2 rounded-full ${activeProfileId === profile.id ? 'bg-brand-500 animate-pulse' : 'bg-gray-500'}`}></span>
                                             <p className="text-brand-300 font-medium tracking-wide uppercase text-xs">{profile.relationship}</p>
                                         </div>
                                         
                                         <p className="text-gray-400 text-sm leading-relaxed italic opacity-90 line-clamp-2 mb-4">
                                            "{profile.traits.split('.')[0]}..."
                                         </p>

                                         {/* Tags */}
                                         {profile.tags && (
                                            <div className="flex flex-wrap gap-2 mb-4">
                                                {profile.tags.slice(0, 3).map(tag => (
                                                    <span key={tag} className="px-2 py-0.5 rounded-full bg-white/10 text-[10px] font-medium text-gray-300 border border-white/5">
                                                        {tag}
                                                    </span>
                                                ))}
                                            </div>
                                         )}

                                         {/* Action Button - Only visible/active on active card */}
                                         {activeProfileId === profile.id && (
                                            <button 
                                                onClick={(e) => { 
                                                    e.stopPropagation();
                                                    triggerHaptic(10); 
                                                    onStartChat(); 
                                                }}
                                                className="w-full py-4 rounded-2xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-800 hover:from-brand-500 hover:to-brand-700 shadow-lg shadow-brand-900/30 transition-all flex items-center justify-center space-x-2 animate-fade-in"
                                            >
                                                <span>Chat Now</span>
                                            </button>
                                         )}
                                     </div>
                                </div>
                            </div>
                        </div>
                    ))}

                    {/* Create New / Random Card */}
                    <div 
                        className="snap-center shrink-0 w-full h-full flex flex-col items-center justify-center py-4 px-2 space-y-4"
                        style={{ width: '100%' }}
                    >
                        <button 
                            onClick={() => { triggerHaptic(10); onCreateNew(); }}
                            className="w-full max-w-sm h-[50%] bg-dark-800/40 border-2 border-dashed border-white/10 hover:border-brand-500/50 hover:bg-brand-900/10 rounded-[2.5rem] flex flex-col items-center justify-center space-y-4 transition-all group"
                        >
                            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center group-hover:scale-110 transition-transform">
                                <svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 group-hover:text-brand-400"><line x1="12" y1="5" x2="12" y2="19"></line><line x1="5" y1="12" x2="19" y2="12"></line></svg>
                            </div>
                            <span className="text-lg font-medium text-gray-400 group-hover:text-white">Design Custom</span>
                        </button>

                        <button 
                            onClick={() => { triggerHaptic(10); setShowGenderModal(true); }}
                            className="w-full max-w-sm h-[20%] bg-gradient-to-r from-violet-600/20 to-fuchsia-600/20 border border-violet-500/30 hover:border-violet-500 rounded-[2rem] flex items-center justify-center space-x-3 transition-all group"
                        >
                            <div className="w-10 h-10 rounded-full bg-violet-500/20 flex items-center justify-center group-hover:rotate-180 transition-transform duration-500">
                                <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-violet-200"><polyline points="23 4 23 10 17 10"></polyline><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path></svg>
                            </div>
                            <span className="text-base font-bold text-violet-200 group-hover:text-white">Random Companion</span>
                        </button>
                    </div>

                </div>
            </div>
            
            {/* Pagination Dots */}
            <div className="flex-none h-10 flex items-center justify-center space-x-2 pb-4">
                {profiles.map((p) => (
                    <div 
                        key={p.id} 
                        className={`h-1.5 rounded-full transition-all duration-300 ${activeProfileId === p.id ? 'w-6 bg-brand-500' : 'w-1.5 bg-white/20'}`}
                    />
                ))}
                <div className="w-1.5 h-1.5 rounded-full bg-white/20"></div> {/* For Create New */}
            </div>

            {/* Delete Confirmation Modal */}
            {deleteTargetId && !isDeleting && (
                <div className="absolute inset-0 z-[80] bg-black/90 backdrop-blur-md flex items-center justify-center animate-fade-in p-8">
                    <div className="w-full max-w-sm bg-dark-800 border border-red-900/50 rounded-3xl p-6 text-center shadow-[0_0_50px_rgba(220,38,38,0.2)]">
                        <div className="w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 animate-pulse">
                            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Delete Persona?</h2>
                        <p className="text-gray-400 text-sm mb-8">
                            This companion and all chat history will be permanently erased.
                        </p>
                        <div className="grid grid-cols-2 gap-4">
                             <button 
                                onClick={() => { triggerHaptic(5); setDeleteTargetId(null); }}
                                className="px-4 py-3 rounded-xl bg-white/5 text-gray-300 font-bold hover:bg-white/10"
                             >
                                Cancel
                             </button>
                             <button 
                                onClick={confirmDelete}
                                className="px-4 py-3 rounded-xl bg-red-600 text-white font-bold hover:bg-red-700 shadow-lg shadow-red-900/20"
                             >
                                Yes, Delete
                             </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Deletion Animation Overlay */}
            {isDeleting && (
                <div className="absolute inset-0 z-[90] bg-black flex flex-col items-center justify-center">
                     <div className="relative w-64 h-64 flex items-center justify-center">
                         {/* Glitch Effect Elements */}
                         <div className="absolute inset-0 border-4 border-red-600 rounded-full animate-ping opacity-20"></div>
                         <div className="absolute inset-0 border-2 border-red-500 rounded-full animate-[spin_1s_linear_infinite_reverse] opacity-50"></div>
                         <div className="text-red-500 animate-pulse font-mono text-lg tracking-widest">
                             ERASING DATA...
                         </div>
                     </div>
                     
                     <div className="w-64 h-1 bg-gray-900 rounded-full mt-8 overflow-hidden">
                         <div className="h-full bg-red-600 animate-[slideUp_3s_ease-in-out_forwards]" style={{ width: '100%' }}></div>
                     </div>
                </div>
            )}

            {/* User Profile Modal */}
            {showProfileModal && userProfile && (
                <div className="absolute inset-0 z-[70] bg-black/95 backdrop-blur-lg flex flex-col animate-fade-in overflow-y-auto custom-scrollbar">
                    {/* Header / Nav */}
                    <div className="sticky top-0 z-10 flex justify-between items-center px-6 py-4 bg-black/80 backdrop-blur-md border-b border-white/5">
                        <h2 className="text-lg font-bold text-white">Your Profile</h2>
                        <button 
                            onClick={() => handleSaveUserProfile()}
                            className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-bold hover:bg-gray-200 transition-colors"
                        >
                            Save
                        </button>
                    </div>

                    <div className="p-6 pb-24 max-w-md mx-auto w-full">
                        {/* Avatar & Name */}
                        <div className="flex flex-col items-center mb-8">
                            <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-brand-500/50 shadow-2xl mb-4 relative bg-white">
                                <img src={userProfile.avatarUrl} className="w-full h-full object-cover" alt="Avatar" />
                            </div>
                            <div className="w-full max-w-xs">
                                <label className="block text-xs text-gray-500 uppercase tracking-wider font-bold text-center mb-1">Display Name</label>
                                <input 
                                    type="text"
                                    value={editName}
                                    onChange={(e) => setEditName(e.target.value)}
                                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-center text-white font-bold focus:border-brand-500 transition-colors"
                                    placeholder="Your Name"
                                />
                            </div>
                        </div>

                        {/* Tags Sections */}
                        <div className="space-y-8">
                            {TAG_GROUPS.map((group, idx) => (
                                <div key={idx}>
                                    <h3 className="text-sm font-bold text-brand-400 uppercase tracking-wider mb-3">{group.title}</h3>
                                    <div className="flex flex-wrap gap-2">
                                        {group.tags.map(tag => {
                                            const isSelected = userProfile.interests.includes(tag);
                                            return (
                                                <button
                                                    key={tag}
                                                    onClick={() => toggleInterest(tag)}
                                                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all duration-200 ${
                                                        isSelected 
                                                            ? 'bg-brand-600 border-brand-500 text-white shadow-lg shadow-brand-900/30' 
                                                            : 'bg-white/5 border-white/10 text-gray-400 hover:bg-white/10 hover:text-gray-200'
                                                    }`}
                                                >
                                                    {tag}
                                                </button>
                                            );
                                        })}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}

            {/* Gender Selection Modal */}
            {showGenderModal && (
                <div className="absolute inset-0 z-[60] bg-black/90 backdrop-blur-sm flex items-center justify-center animate-fade-in">
                    <div className="w-full max-w-xs bg-dark-800 border border-white/10 rounded-3xl p-6 text-center shadow-2xl">
                        <h3 className="text-2xl font-bold text-white mb-2">Select Preference</h3>
                        <p className="text-gray-400 text-sm mb-8">Who would you like to meet?</p>
                        
                        <div className="space-y-3">
                            <button 
                                onClick={() => { triggerHaptic(10); setShowGenderModal(false); onRandomCompanion('female'); }}
                                className="w-full py-4 rounded-2xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-300 font-bold flex items-center justify-center space-x-3 transition-all"
                            >
                                <span>Female</span>
                            </button>
                            <button 
                                onClick={() => { triggerHaptic(10); setShowGenderModal(false); onRandomCompanion('male'); }}
                                className="w-full py-4 rounded-2xl bg-blue-500/10 border border-blue-500/30 hover:bg-blue-500/20 text-blue-300 font-bold flex items-center justify-center space-x-3 transition-all"
                            >
                                <span>Male</span>
                            </button>
                        </div>
                        <button 
                            onClick={() => { setShowGenderModal(false); }}
                            className="mt-6 text-gray-500 text-sm hover:text-white"
                        >
                            Cancel
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};
