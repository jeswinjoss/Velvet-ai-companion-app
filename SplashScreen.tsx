import React from 'react';

export const SplashScreen: React.FC = () => {
  return (
    <div className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black text-white overflow-hidden">
      {/* Ambient Background */}
      <div className="absolute top-[-20%] left-[-10%] w-[70%] h-[70%] bg-brand-900/20 rounded-full blur-[120px] animate-pulse-slow mix-blend-screen pointer-events-none"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[70%] h-[70%] bg-purple-900/20 rounded-full blur-[120px] animate-pulse-slow mix-blend-screen pointer-events-none"></div>

      <div className="relative z-10 flex flex-col items-center text-center p-8 animate-fade-in">
        <h1 className="text-7xl md:text-9xl font-bold tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-brand-300 via-brand-500 to-brand-800 drop-shadow-[0_0_30px_rgba(225,29,72,0.4)]">
          VELVET
        </h1>
        <div className="h-px w-32 bg-gradient-to-r from-transparent via-brand-500 to-transparent my-6 opacity-50"></div>
        <p className="text-lg md:text-xl font-light tracking-[0.4em] text-brand-100/80 uppercase">
          Intelligent Intimacy
        </p>
      </div>

      {/* Subtle loader */}
      <div className="absolute bottom-16 flex items-center space-x-2 opacity-60">
        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
        <div className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce"></div>
      </div>
    </div>
  );
};
