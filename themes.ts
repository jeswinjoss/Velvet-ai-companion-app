
import { ThemeId } from './types';

export interface ThemeConfig {
  id: ThemeId;
  name: string;
  description: string;
  fontFamily: string;
  // Container styles
  containerBg: string;
  headerBg: string;
  headerText: string;
  headerSubtext: string;
  // Chat Bubble Styles
  userBubbleBg: string;
  userBubbleText: string;
  modelBubbleBg: string;
  modelBubbleText: string;
  modelBubbleBorder: string;
  // Input Area Styles
  inputBg: string;
  inputText: string;
  inputPlaceholder: string;
  inputBorder: string;
  sendButtonBg: string;
  // Scrollbar thumb color (mapped to Tailwind classes roughly)
  scrollbarThumb: string;
  // Menu specific
  menuBg: string;
  menuBorder: string;
  menuItemHover: string;
  accentColor: string; // For active states
}

export const THEMES: Record<ThemeId, ThemeConfig> = {
  midnight: {
    id: 'midnight',
    name: 'Midnight Velvet',
    description: 'Deep, mysterious, and elegant.',
    fontFamily: 'font-sans',
    containerBg: 'bg-[#050505]',
    headerBg: 'bg-[#0a0a0a]/80',
    headerText: 'text-gray-100',
    headerSubtext: 'text-brand-400',
    
    userBubbleBg: 'bg-gradient-to-br from-brand-700 to-brand-900',
    userBubbleText: 'text-white',
    
    modelBubbleBg: 'bg-[#1a1a1a]',
    modelBubbleText: 'text-gray-200',
    modelBubbleBorder: 'border-white/5',
    
    inputBg: 'bg-[#121212]',
    inputText: 'text-gray-100',
    inputPlaceholder: 'placeholder-gray-600',
    inputBorder: 'border-white/10',
    sendButtonBg: 'bg-brand-600 hover:bg-brand-500 shadow-lg shadow-brand-900/20',
    scrollbarThumb: 'bg-gray-800',
    
    menuBg: 'bg-[#0f0f0f]/95',
    menuBorder: 'border-white/10',
    menuItemHover: 'hover:bg-white/5',
    accentColor: 'bg-brand-500'
  },
  crimson: {
    id: 'crimson',
    name: 'Wine & Roses',
    description: 'Romantic, intense, and passionate.',
    fontFamily: 'font-serif',
    containerBg: 'bg-[#1a0505]',
    headerBg: 'bg-[#2a0a0a]/80',
    headerText: 'text-rose-50',
    headerSubtext: 'text-rose-300',
    
    userBubbleBg: 'bg-gradient-to-br from-[#881337] to-[#4c0519]', // Rose 900 to 950
    userBubbleText: 'text-rose-50',
    
    modelBubbleBg: 'bg-[#2a0a0a]',
    modelBubbleText: 'text-rose-100',
    modelBubbleBorder: 'border-rose-900/20',
    
    inputBg: 'bg-[#2a0a0a]',
    inputText: 'text-rose-50',
    inputPlaceholder: 'placeholder-rose-800/50',
    inputBorder: 'border-rose-900/30',
    sendButtonBg: 'bg-[#9f1239] hover:bg-[#be123c] shadow-lg shadow-rose-900/30',
    scrollbarThumb: 'bg-rose-900',
    
    menuBg: 'bg-[#1f0505]/95',
    menuBorder: 'border-rose-900/20',
    menuItemHover: 'hover:bg-rose-900/20',
    accentColor: 'bg-rose-600'
  },
  aurora: {
    id: 'aurora',
    name: 'Northern Lights',
    description: 'Cool, mystic, and serene.',
    fontFamily: 'font-sans',
    containerBg: 'bg-[#0f172a]', // Slate 900
    headerBg: 'bg-[#1e293b]/80', // Slate 800
    headerText: 'text-teal-50',
    headerSubtext: 'text-teal-300',
    
    userBubbleBg: 'bg-gradient-to-r from-teal-600 to-cyan-600',
    userBubbleText: 'text-white',
    
    modelBubbleBg: 'bg-[#1e293b]',
    modelBubbleText: 'text-teal-100',
    modelBubbleBorder: 'border-teal-500/20',
    
    inputBg: 'bg-[#1e293b]',
    inputText: 'text-teal-50',
    inputPlaceholder: 'placeholder-teal-700',
    inputBorder: 'border-teal-500/20',
    sendButtonBg: 'bg-cyan-600 hover:bg-cyan-500 shadow-lg shadow-cyan-900/20',
    scrollbarThumb: 'bg-slate-700',
    
    menuBg: 'bg-[#0f172a]/95',
    menuBorder: 'border-teal-500/20',
    menuItemHover: 'hover:bg-teal-500/10',
    accentColor: 'bg-cyan-400'
  },
  sunset: {
    id: 'sunset',
    name: 'Golden Hour',
    description: 'Warm, nostalgic, and glowing.',
    fontFamily: 'font-serif',
    containerBg: 'bg-[#1c1917]', // Stone 900
    headerBg: 'bg-[#292524]/80', // Stone 800
    headerText: 'text-orange-50',
    headerSubtext: 'text-amber-400',
    
    userBubbleBg: 'bg-gradient-to-br from-orange-600 to-amber-600',
    userBubbleText: 'text-white',
    
    modelBubbleBg: 'bg-[#292524]',
    modelBubbleText: 'text-orange-100',
    modelBubbleBorder: 'border-orange-500/20',
    
    inputBg: 'bg-[#292524]',
    inputText: 'text-orange-50',
    inputPlaceholder: 'placeholder-orange-800',
    inputBorder: 'border-orange-500/20',
    sendButtonBg: 'bg-orange-600 hover:bg-orange-500 shadow-lg shadow-orange-900/20',
    scrollbarThumb: 'bg-stone-700',
    
    menuBg: 'bg-[#1c1917]/95',
    menuBorder: 'border-orange-500/20',
    menuItemHover: 'hover:bg-orange-500/10',
    accentColor: 'bg-amber-500'
  },
  pastel: {
    id: 'pastel',
    name: 'Morning Mist',
    description: 'Soft, ethereal, and light.',
    fontFamily: 'font-rounded',
    containerBg: 'bg-[#fdfcfc]',
    headerBg: 'bg-white/70',
    headerText: 'text-slate-700',
    headerSubtext: 'text-violet-400',
    
    userBubbleBg: 'bg-gradient-to-br from-violet-400 to-fuchsia-400',
    userBubbleText: 'text-white',
    
    modelBubbleBg: 'bg-white shadow-sm',
    modelBubbleText: 'text-slate-600',
    modelBubbleBorder: 'border-slate-100',
    
    inputBg: 'bg-white',
    inputText: 'text-slate-700',
    inputPlaceholder: 'placeholder-slate-300',
    inputBorder: 'border-slate-100',
    sendButtonBg: 'bg-violet-400 hover:bg-violet-500 shadow-lg shadow-violet-200',
    scrollbarThumb: 'bg-slate-200',
    
    menuBg: 'bg-white/95',
    menuBorder: 'border-slate-100',
    menuItemHover: 'hover:bg-slate-50',
    accentColor: 'bg-violet-400'
  }
};
