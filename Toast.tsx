
import React, { useEffect, useState } from 'react';

interface ToastProps {
  message: string;
  isVisible: boolean;
  onHide: () => void;
  type?: 'success' | 'info';
}

export const Toast: React.FC<ToastProps> = ({ message, isVisible, onHide, type = 'success' }) => {
  const [show, setShow] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setShow(true);
      const timer = setTimeout(() => {
        setShow(false);
        setTimeout(onHide, 300); // Wait for fade out animation
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [isVisible, onHide]);

  if (!isVisible && !show) return null;

  return (
    <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 z-[100] transition-all duration-300 ${show ? 'translate-y-0 opacity-100' : '-translate-y-4 opacity-0'}`}>
      <div className={`px-6 py-3 rounded-2xl shadow-2xl backdrop-blur-xl border flex items-center space-x-3 ${
        type === 'success' 
          ? 'bg-emerald-900/80 border-emerald-500/30 text-emerald-100' 
          : 'bg-dark-800/80 border-white/10 text-gray-100'
      }`}>
        {type === 'success' ? (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"></polyline></svg>
        ) : (
           <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="16" x2="12" y2="12"></line><line x1="12" y1="8" x2="12.01" y2="8"></line></svg>
        )}
        <span className="text-sm font-medium">{message}</span>
      </div>
    </div>
  );
};
