import { useState } from 'react';
import { setupPin } from '../crypto/pinManager';
import { useAuth } from '../context/AuthContext';

export function PinSetup() {
  const { unlock, setPinConfigured, skipPin } = useAuth();
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [step, setStep] = useState<'pin' | 'security'>('pin');
  const [error, setError] = useState('');

  const handlePinSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (pin.length < 4 || pin.length > 6) {
      setError('PIN must be 4-6 digits');
      return;
    }
    if (pin !== confirmPin) {
      setError('PINs do not match');
      return;
    }
    if (!/^\d+$/.test(pin)) {
      setError('PIN must contain only digits');
      return;
    }
    setError('');
    setStep('security');
  };

  const handleSecuritySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setError('Please fill in both fields');
      return;
    }
    try {
      const key = await setupPin(pin, securityQuestion, securityAnswer);
      setPinConfigured(true);
      unlock(key);
    } catch {
      setError('Failed to set up PIN. Please try again.');
    }
  };

  if (step === 'security') {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-orb" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-orb [animation-delay:4s]" />
        <div className="relative bg-slate-900/75 p-8 rounded-2xl border border-white/[0.22] shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Security Question</h1>
          <p className="text-slate-400 mb-6">This will be used to recover your PIN if forgotten.</p>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <form onSubmit={handleSecuritySubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Security Question</label>
              <input
                type="text"
                value={securityQuestion}
                onChange={(e) => setSecurityQuestion(e.target.value)}
                placeholder="e.g., What is your pet's name?"
                className="w-full px-4 py-2 glass-input placeholder:text-slate-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Answer</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                placeholder="Your answer"
                className="w-full px-4 py-2 glass-input placeholder:text-slate-500"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary py-2"
            >
              Complete Setup
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-orb" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-orb [animation-delay:4s]" />
      <div className="relative bg-slate-900/75 p-8 rounded-2xl border border-white/[0.22] shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">Set Up PIN</h1>
        <p className="text-slate-400 mb-6">Protect your budget data with a PIN lock. Data is stored locally in your browser.</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handlePinSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">PIN (4-6 digits)</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={pin}
              onChange={(e) => setPin(e.target.value)}
              placeholder="Enter PIN"
              className="w-full px-4 py-2 glass-input text-center text-2xl tracking-widest placeholder:text-slate-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              placeholder="Confirm PIN"
              className="w-full px-4 py-2 glass-input text-center text-2xl tracking-widest placeholder:text-slate-500"
            />
          </div>
          <button
            type="submit"
            className="w-full btn-primary py-2"
          >
            Next
          </button>
        </form>
        <button
          onClick={skipPin}
          className="w-full mt-3 text-slate-500 hover:text-slate-300 transition-colors text-sm"
        >
          Skip — use without PIN
        </button>
      </div>
    </div>
  );
}
