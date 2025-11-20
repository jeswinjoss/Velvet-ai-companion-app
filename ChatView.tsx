
import React, { useState, useRef, useEffect } from 'react';
import { Chat, GenerateContentResponse } from '@google/genai';
import { CharacterProfile, Message, ThemeId, MoodType } from '../types';
import { ChatBubble } from '../components/ChatBubble';
import { THEMES } from '../themes';
import { triggerHaptic } from '../utils/haptics';
import { saveChatHistory } from '../services/persistenceService';
import { usageService } from '../services/usageService';

interface ChatViewProps {
  chatSession: Chat | null;
  profile: CharacterProfile;
  initialMessages?: Message[];
  onReset: () => void;
  onRegenerateAvatar: () => void;
  onGoHome: () => void;
}

const MOOD_CONFIG: Record<MoodType, { color: string, label: string }> = {
  'Neutral': { color: 'bg-gray-400', label: 'Calm' },
  'Happy': { color: 'bg-emerald-400', label: 'Happy' },
  'Excited': { color: 'bg-yellow-400', label: 'Excited' },
  'Flirty': { color: 'bg-pink-500', label: 'Flirty' },
  'Romantic': { color: 'bg-rose-500', label: 'Romantic' },
  'Shy': { color: 'bg-violet-400', label: 'Shy' },
  'Sad': { color: 'bg-indigo-400', label: 'Sad' },
  'Annoyed': { color: 'bg-orange-500', label: 'Annoyed' },
  'Cold': { color: 'bg-blue-400', label: 'Cold' },
};

const REACTION_OPTIONS = ["❤️", "🔥", "🫦", "😆", "😢", "😮"];

export const ChatView: React.FC<ChatViewProps> = ({ chatSession, profile, initialMessages = [], onReset, onRegenerateAvatar, onGoHome }) => {
  const [messages, setMessages] = useState<Message[]>(initialMessages);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [currentThemeId, setCurrentThemeId] = useState<ThemeId>(profile.themeId);
  const [currentMood, setCurrentMood] = useState<MoodType>('Neutral');
  const [reactingMessageId, setReactingMessageId] = useState<string | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const theme = THEMES[currentThemeId] || THEMES.midnight;
  const moodStyle = MOOD_CONFIG[currentMood] || MOOD_CONFIG['Neutral'];

  // Save history specific to this profile
  useEffect(() => {
    if (messages.length > 0) {
        saveChatHistory(profile.id, messages);
    }
  }, [messages, profile.id]);

  useEffect(() => {
    if (messagesEndRef.current) {
        messagesEndRef.current.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }
  }, [messages, isTyping]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const sendMessageWithRetry = async (prompt: string, retryCount = 0): Promise<any> => {
      if (!chatSession) throw new Error("No chat session");
      
      // Track request start
      usageService.trackRequest();

      const performRequest = async () => {
          const timeoutMs = 20000; // 20s timeout
          let timeoutId: ReturnType<typeof setTimeout>;
          
          const timeoutPromise = new Promise((_, reject) => {
              timeoutId = setTimeout(() => reject(new Error("REQUEST_TIMEOUT")), timeoutMs);
          });

          const apiPromise = chatSession.sendMessageStream({ message: prompt });

          try {
              const result = await Promise.race([apiPromise, timeoutPromise]);
              clearTimeout(timeoutId!);
              return result;
          } catch (error) {
              clearTimeout(timeoutId!);
              throw error;
          }
      };

      try {
          return await performRequest();
      } catch (error: any) {
          const errStr = JSON.stringify(error) + (error.message || '') + error.toString();
          
          // CRITICAL: Check for Quota/Resource Exhausted. Do not retry.
          if (errStr.includes('quota') || errStr.includes('RESOURCE_EXHAUSTED') || errStr.includes('429')) {
             usageService.triggerCooldown(); // Set 60s cooldown
             throw new Error("QUOTA_EXHAUSTED");
          }

          const isTransient = errStr.includes('503') || errStr.includes('500') || errStr.includes('fetch failed') || errStr.includes('REQUEST_TIMEOUT');
          
          if (isTransient && retryCount < 3) {
              console.log(`Retrying message... Attempt ${retryCount + 1}`);
              const delay = Math.pow(2, retryCount) * 1000;
              await new Promise(resolve => setTimeout(resolve, delay));
              return sendMessageWithRetry(prompt, retryCount + 1);
          }
          throw error;
      }
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!inputValue.trim() || !chatSession || isTyping) return;

    // Pre-check Usage
    const stats = usageService.getStats();
    if (stats.isRateLimited) {
         setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'model', content: `(I'm a bit overwhelmed right now. Let me rest for ${stats.cooldownRemaining} seconds. 🌙)`, timestamp: Date.now() }]);
         return;
    }

    triggerHaptic([10]);
    const uniqueId = `msg-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    
    const userMsg: Message = {
      id: `user-${uniqueId}`,
      role: 'user',
      content: inputValue,
      timestamp: Date.now(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    try {
      const prompt = `(Mood:${currentMood}) ${userMsg.content}`;
      const stream = await sendMessageWithRetry(prompt);
      
      let fullText = '';
      let isFirst = true;
      const modelId = `model-${uniqueId}`;

      for await (const chunk of stream) {
         const text = (chunk as GenerateContentResponse).text || '';
         if (!text) continue;
         
         fullText += text;
         
         // Filter Mood tag
         const moodMatch = fullText.match(/\[MOOD:\s*([a-zA-Z]+)\]/);
         let display = fullText;
         
         if (moodMatch) {
            const m = moodMatch[1] as MoodType;
            if (MOOD_CONFIG[m]) setCurrentMood(m);
            display = fullText.replace(moodMatch[0], '').trimStart();
         } else if (fullText.trim().startsWith('[')) {
            display = ''; // Wait for tag completion
         }

         if (!display && !isFirst) continue;

         if (isFirst && display) {
             triggerHaptic(15);
             isFirst = false;
             setMessages(prev => [...prev, { id: modelId, role: 'model', content: display, timestamp: Date.now() }]);
         } else if (!isFirst) {
             setMessages(prev => prev.map(m => m.id === modelId ? { ...m, content: display } : m));
         }
      }

      // Handle Empty/Safety Blocked Responses
      if (!fullText && isFirst) {
         throw new Error("EMPTY_RESPONSE");
      }

    } catch (error: any) {
      console.error("Chat Error", error);
      
      let errMsg = "(I got distracted... say again?)";
      if (error.message === 'QUOTA_EXHAUSTED') {
          errMsg = "(I'm feeling really drained right now... let's take a break and talk later. 🌙)";
      } else if (error.message === 'EMPTY_RESPONSE') {
          errMsg = "(I don't know how to respond to that...)";
      }

      setMessages(prev => [...prev, { id: `err-${Date.now()}`, role: 'model', content: errMsg, timestamp: Date.now() }]);
    } finally {
       // ALWAYS ensure typing state is reset
       setIsTyping(false);
    }
  };

  const handleAddReaction = (emoji: string) => {
    triggerHaptic(10);
    if (!reactingMessageId) return;
    setMessages(prev => prev.map(m => {
        if (m.id === reactingMessageId) {
            const r = m.reactions || [];
            return { ...m, reactions: r.includes(emoji) ? r.filter(x => x !== emoji) : [...r, emoji] };
        }
        return m;
    }));
    setReactingMessageId(null);
  };

  return (
    <div className={`flex flex-col h-full w-full relative transition-colors duration-500 ease-in-out ${theme.containerBg} ${theme.fontFamily}`}>
      
      {/* Header */}
      <div className={`flex-none flex items-center justify-between px-5 py-4 backdrop-blur-xl border-b z-20 ${theme.headerBg} ${theme.menuBorder || 'border-white/5'}`}>
        <div className="flex items-center space-x-3.5">
            <div className="relative">
                <img 
                  src={profile.avatarUrl || `https://ui-avatars.com/api/?name=${profile.name}`} 
                  className={`w-10 h-10 rounded-full object-cover ring-2 shadow-md ${theme.id === 'pastel' ? 'ring-white' : 'ring-brand-500'}`}
                />
                <span className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-dark-900 ${moodStyle.color} animate-pulse`}></span>
            </div>
            <div>
                <h3 className={`text-base font-bold leading-none mb-1 ${theme.headerText}`}>{profile.name}</h3>
                <div className="flex items-center space-x-2">
                    <p className={`text-[10px] font-semibold tracking-widest uppercase opacity-70 ${theme.headerSubtext}`}>{profile.relationship}</p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-bold uppercase bg-opacity-20 ${moodStyle.color.replace('bg-', 'text-')} bg-white/10`}>
                        {moodStyle.label}
                    </span>
                </div>
            </div>
        </div>

        <div className="relative" ref={menuRef}>
          <button onClick={() => { triggerHaptic(10); setIsMenuOpen(!isMenuOpen); }} className="p-2 text-gray-300 hover:text-white">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="1"/><circle cx="12" cy="5" r="1"/><circle cx="12" cy="19" r="1"/></svg>
          </button>
          {isMenuOpen && (
            <div className={`absolute right-0 top-full mt-3 w-64 rounded-2xl shadow-2xl border backdrop-blur-2xl animate-fade-in z-50 ${theme.menuBg} ${theme.menuBorder}`}>
              <div className="py-1">
                 <div className={`px-4 py-2 text-[10px] font-bold uppercase opacity-50 ${theme.headerText}`}>Themes</div>
                 {Object.values(THEMES).map((t) => (
                    <button key={t.id} onClick={() => { triggerHaptic(15); setCurrentThemeId(t.id); }} className={`w-full flex items-center justify-between px-4 py-2 text-xs font-medium ${t.id === currentThemeId ? theme.accentColor + ' text-white' : 'text-gray-400 hover:text-white'}`}>
                        {t.name}
                    </button>
                 ))}
                 <div className="border-t border-white/10 my-1"></div>
                 <button onClick={() => { triggerHaptic(10); onRegenerateAvatar(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10">Regenerate Look</button>
                 <button onClick={() => { triggerHaptic(10); onGoHome(); setIsMenuOpen(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-200 hover:bg-white/10">Return Home</button>
                 <button onClick={onReset} className="w-full text-left px-4 py-3 text-sm text-red-400 hover:bg-red-500/10">End Session</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-5 scroll-smooth no-scrollbar">
        {messages.length === 0 && !isTyping && (
            <div className="h-full flex flex-col items-center justify-center opacity-50">
                <p className={`text-lg font-medium ${theme.headerText}`}>Chat with {profile.name}</p>
            </div>
        )}
        {messages.map((msg) => (
          <ChatBubble key={msg.id} message={msg} avatarUrl={profile.avatarUrl} theme={theme} onLongPress={setReactingMessageId} />
        ))}
        {isTyping && (
           <div className={`flex items-center space-x-2 px-4 py-3 rounded-2xl w-fit ${theme.modelBubbleBg}`}>
              <div className="flex space-x-1"><div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce"></div><div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-75"></div><div className="w-1.5 h-1.5 bg-current rounded-full animate-bounce delay-150"></div></div>
           </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className={`flex-none p-4 backdrop-blur-sm ${theme.headerBg}`}>
        <form onSubmit={handleSendMessage} className={`relative flex items-center p-1.5 rounded-[2rem] border transition-all ${isInputFocused ? 'ring-1 ' + theme.accentColor : ''} ${theme.inputBg} ${theme.inputBorder}`}>
            <input
                ref={inputRef}
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onFocus={() => setIsInputFocused(true)}
                onBlur={() => setIsInputFocused(false)}
                placeholder="Message..."
                className={`w-full bg-transparent border-none outline-none py-3 pl-4 pr-12 text-base ${theme.inputText} ${theme.inputPlaceholder}`}
                disabled={isTyping}
            />
            <button type="submit" disabled={!inputValue.trim() || isTyping} className={`absolute right-2 p-2 rounded-full text-white disabled:opacity-50 ${theme.sendButtonBg}`}>
                <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor"><path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z"></path></svg>
            </button>
        </form>
      </div>

      {reactingMessageId && (
        <div className="absolute inset-0 z-50 bg-black/40 backdrop-blur-[1px] flex items-end justify-center pb-24" onClick={() => setReactingMessageId(null)}>
            <div className={`p-3 rounded-full flex space-x-4 shadow-xl ${theme.modelBubbleBg} animate-slide-up`} onClick={(e) => e.stopPropagation()}>
                {REACTION_OPTIONS.map(e => <button key={e} onClick={() => handleAddReaction(e)} className="text-2xl hover:scale-125 transition">{e}</button>)}
            </div>
        </div>
      )}
    </div>
  );
};
