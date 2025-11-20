
import React, { useState, useRef, useEffect } from 'react';
import { Message } from '../types';
import { ThemeConfig } from '../themes';
import { triggerHaptic } from '../utils/haptics';

interface ChatBubbleProps {
  message: Message;
  avatarUrl?: string;
  theme: ThemeConfig;
  onLongPress: (messageId: string) => void;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message, avatarUrl, theme, onLongPress }) => {
  const isModel = message.role === 'model';
  const [isPressed, setIsPressed] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Cleanup timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  const startPress = () => {
    setIsPressed(true);
    timerRef.current = setTimeout(() => {
      triggerHaptic(50); // Heavy vibration for activation
      onLongPress(message.id);
      setIsPressed(false); // Reset visual state after trigger
    }, 500);
  };

  const cancelPress = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setIsPressed(false);
  };

  return (
    <div 
      className={`flex w-full ${isModel ? 'justify-start' : 'justify-end'} mb-6 animate-slide-up relative group select-none`}
    >
      {isModel && (
        <div className="flex-shrink-0 mr-3 self-end mb-1">
          {avatarUrl ? (
            <img 
              src={avatarUrl} 
              alt="AI" 
              className="w-10 h-10 rounded-full object-cover border border-white/10 shadow-lg"
            />
          ) : (
            <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold text-white ${theme.sendButtonBg}`}>
              AI
            </div>
          )}
        </div>
      )}
      
      <div className="relative max-w-[75%]">
        <div
          onMouseDown={startPress}
          onMouseUp={cancelPress}
          onMouseLeave={cancelPress}
          onTouchStart={startPress}
          onTouchEnd={cancelPress}
          onTouchMove={cancelPress} // Cancel if scrolling
          onContextMenu={(e) => e.preventDefault()} // Prevent native menu on long press
          className={`px-5 py-3 rounded-2xl text-sm leading-relaxed shadow-md backdrop-blur-sm transition-transform duration-200 ease-out ${theme.fontFamily} ${
            isPressed ? 'scale-95 opacity-90' : 'scale-100'
          } ${
            isModel
              ? `${theme.modelBubbleBg} ${theme.modelBubbleText} border ${theme.modelBubbleBorder} rounded-bl-none`
              : `${theme.userBubbleBg} ${theme.userBubbleText} rounded-br-none`
          }`}
          style={{ touchAction: 'manipulation', userSelect: 'none', WebkitUserSelect: 'none' }}
        >
          {message.content}
        </div>

        {/* Reactions Display */}
        {message.reactions && message.reactions.length > 0 && (
          <div className={`absolute -bottom-3 ${isModel ? 'left-2' : 'right-2'} flex items-center space-x-0.5 bg-dark-800/80 backdrop-blur-md border border-white/10 rounded-full px-1.5 py-0.5 shadow-lg z-10 animate-fade-in`}>
            {message.reactions.map((emoji, idx) => (
              <span key={idx} className="text-xs leading-none p-0.5">{emoji}</span>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
