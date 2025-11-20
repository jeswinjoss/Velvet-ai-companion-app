import React from 'react';

export const LoadingScreen: React.FC<{ message?: string }> = ({ message = "Creating your companion..." }) => {
  return (
    <div className="flex flex-col items-center justify-center h-full w-full min-h-[400px] p-8 text-center">
      <div className="relative w-24 h-24 mb-8">
        {/* Outer glowing ring */}
        <div className="absolute inset-0 rounded-full border-2 border-brand-500/30 animate-[spin_3s_linear_infinite]"></div>
        {/* Middle ring */}
        <div className="absolute inset-2 rounded-full border-t-2 border-brand-500 animate-[spin_2s_linear_infinite]"></div>
        {/* Inner pulsing core */}
        <div className="absolute inset-8 rounded-full bg-brand-500 animate-pulse blur-md"></div>
        <div className="absolute inset-8 rounded-full bg-brand-400 animate-pulse"></div>
      </div>
      
      <h2 className="text-2xl font-bold text-white mb-2 animate-pulse">
        Generating Persona
      </h2>
      <p className="text-gray-400 max-w-xs mx-auto">
        {message}
      </p>
      <p className="text-xs text-gray-600 mt-4">
        Powered by Google Gemini & Imagen
      </p>
    </div>
  );
};