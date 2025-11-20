
import React, { useState, useEffect } from 'react';
import { generateSecurityChallenge, validateSecurityAnswer } from '../services/geminiService';
import { Button } from '../components/Button';
import { triggerHaptic } from '../utils/haptics';

interface SecurityViewProps {
    onSuccess: () => void;
}

export const SecurityView: React.FC<SecurityViewProps> = ({ onSuccess }) => {
    const [step, setStep] = useState<'loading' | 'challenge' | 'locked'>('loading');
    const [challenge, setChallenge] = useState<{ question: string, answer: string } | null>(null);
    const [userAnswer, setUserAnswer] = useState('');
    const [isChecking, setIsChecking] = useState(false);
    
    // Admin Unlock Logic
    const [tapCount, setTapCount] = useState(0);
    const [showAdminInput, setShowAdminInput] = useState(false);
    const [adminPass, setAdminPass] = useState('');

    useEffect(() => {
        loadChallenge();
    }, []);

    const loadChallenge = async () => {
        setStep('loading');
        try {
            const data = await generateSecurityChallenge();
            setChallenge(data);
            setStep('challenge');
        } catch (e) {
            // Fallback to simple hardcoded if API fails
            setChallenge({ question: "What is 5 + 5?", answer: "10" });
            setStep('challenge');
        }
    };

    const handleVerify = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!userAnswer.trim() || !challenge) return;

        setIsChecking(true);
        try {
            const valid = await validateSecurityAnswer(challenge.question, challenge.answer, userAnswer);
            if (valid) {
                triggerHaptic([10, 50, 10]);
                onSuccess();
            } else {
                triggerHaptic([50, 50, 50]);
                setStep('locked');
            }
        } catch (error) {
            console.error("Verification failed", error);
        } finally {
            setIsChecking(false);
        }
    };

    const handleCopy = () => {
        if (challenge) {
            navigator.clipboard.writeText(challenge.question);
            triggerHaptic(10);
        }
    };

    const handleLockTap = () => {
        triggerHaptic(5);
        const newCount = tapCount + 1;
        setTapCount(newCount);
        if (newCount === 3) {
            setShowAdminInput(true);
        }
    };

    const handleAdminUnlock = (e: React.FormEvent) => {
        e.preventDefault();
        if (adminPass === 'admin2025') {
            triggerHaptic(20);
            onSuccess();
        } else {
            triggerHaptic([50, 50]);
            setAdminPass('');
            // Optionally reset logic or stay locked
        }
    };

    if (step === 'locked') {
        return (
            <div className="h-full w-full bg-red-950 flex flex-col items-center justify-center p-8 text-center relative overflow-hidden">
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMiIgY3k9IjIiIHI9IjIiIGZpbGw9InJnYmEoMjU1LCAwLCAwLCAwLjEpIi8+PC9zdmc+')] opacity-20"></div>
                
                <div className="w-24 h-24 rounded-full bg-red-900/50 border-4 border-red-600 flex items-center justify-center mb-6 animate-pulse">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-red-500"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg>
                </div>

                <h1 onClick={handleLockTap} className="text-4xl font-black text-red-500 tracking-widest mb-2 cursor-pointer select-none">
                    ACCESS DENIED
                </h1>
                <p className="text-red-300 mb-8">Security protocol initiated. Chat locked.</p>

                {showAdminInput && (
                    <form onSubmit={handleAdminUnlock} className="w-full max-w-xs animate-fade-in">
                        <input 
                            type="password" 
                            placeholder="Enter Passcode"
                            value={adminPass}
                            onChange={(e) => setAdminPass(e.target.value)}
                            className="w-full bg-black/50 border border-red-500 rounded-xl px-4 py-3 text-white text-center tracking-widest focus:border-red-400 mb-4"
                            autoFocus
                        />
                        <button type="submit" className="w-full py-3 bg-red-600 text-white font-bold rounded-xl hover:bg-red-500">
                            UNLOCK
                        </button>
                    </form>
                )}
            </div>
        );
    }

    return (
        <div className="h-full w-full bg-black flex flex-col items-center justify-center p-6 relative z-50">
            <div className="w-full max-w-sm bg-dark-900 border border-white/10 rounded-3xl p-6 shadow-2xl">
                <div className="text-center mb-6">
                    <div className="w-12 h-12 rounded-full bg-blue-900/20 flex items-center justify-center mx-auto mb-3">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="text-blue-400"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path></svg>
                    </div>
                    <h2 className="text-xl font-bold text-white">Security Verification</h2>
                    <p className="text-gray-400 text-xs mt-2">This content is restricted (20+). Solve the riddle to proceed.</p>
                </div>

                {step === 'loading' ? (
                    <div className="flex flex-col items-center py-8">
                        <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                        <p className="text-gray-500 text-xs">Generating security challenge...</p>
                    </div>
                ) : (
                    <div className="space-y-6">
                        <div className="bg-white/5 rounded-xl p-4 border border-dashed border-white/10">
                            <p className="text-sm text-gray-200 italic leading-relaxed">
                                "{challenge?.question}"
                            </p>
                            <button 
                                onClick={handleCopy}
                                className="mt-3 text-xs text-blue-400 hover:text-blue-300 flex items-center space-x-1"
                            >
                                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg>
                                <span>Copy Question</span>
                            </button>
                        </div>

                        <p className="text-[10px] text-gray-500 text-center">
                            Tip: Copy the question and ask Gemini/Google for the answer.
                        </p>

                        <form onSubmit={handleVerify} className="space-y-4">
                            <input 
                                type="text" 
                                value={userAnswer}
                                onChange={(e) => setUserAnswer(e.target.value)}
                                placeholder="Paste Answer Here"
                                className="w-full bg-black border border-gray-700 rounded-xl px-4 py-3 text-white focus:border-blue-500 transition-colors text-sm"
                            />
                            <Button 
                                type="submit" 
                                className="w-full" 
                                isLoading={isChecking}
                            >
                                VERIFY ACCESS
                            </Button>
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
};
