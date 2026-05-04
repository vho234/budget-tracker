import { useState } from 'react';
import { verifyPin, recoverWithSecurityAnswer, getSecurityQuestion } from '../crypto/pinManager';
import { useAuth } from '../context/AuthContext';

export function PinLock() {
  const { unlock } = useAuth();
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isRecovering, setIsRecovering] = useState(false);
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [newPin, setNewPin] = useState('');
  const [recoveryError, setRecoveryError] = useState('');

  const securityQuestion = getSecurityQuestion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    const key = await verifyPin(pin);
    if (key) {
      unlock(key);
    } else {
      setError('Incorrect PIN');
      setPin('');
    }
  };

  const handleRecover = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError('');
    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setRecoveryError('New PIN must be 4-6 digits');
      return;
    }
    const key = await recoverWithSecurityAnswer(securityAnswer, newPin);
    if (key) {
      unlock(key);
    } else {
      setRecoveryError('Incorrect answer');
    }
  };

  if (isRecovering) {
    return (
      <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
        <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-orb" />
        <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-orb [animation-delay:4s]" />
        <div className="relative bg-slate-900/75 p-8 rounded-2xl border border-white/[0.22] shadow-2xl w-full max-w-md">
          <h1 className="text-2xl font-bold text-slate-100 mb-2">Recover PIN</h1>
          <p className="text-slate-400 mb-4">{securityQuestion}</p>
          {recoveryError && <p className="text-red-500 text-sm mb-4">{recoveryError}</p>}
          <form onSubmit={handleRecover} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">Your Answer</label>
              <input
                type="text"
                value={securityAnswer}
                onChange={(e) => setSecurityAnswer(e.target.value)}
                className="w-full px-4 py-2 glass-input"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300 mb-1">New PIN (4-6 digits)</label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={6}
                value={newPin}
                onChange={(e) => setNewPin(e.target.value)}
                className="w-full px-4 py-2 glass-input text-center text-2xl tracking-widest"
              />
            </div>
            <button
              type="submit"
              className="w-full btn-primary py-2"
            >
              Reset PIN
            </button>
          </form>
          <button
            onClick={() => setIsRecovering(false)}
            className="w-full mt-3 text-slate-500 hover:text-slate-300 transition-colors text-sm"
          >
            Back to PIN entry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center relative overflow-hidden">
      <div className="absolute top-1/4 -left-32 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-float-orb" />
      <div className="absolute bottom-1/4 -right-32 w-96 h-96 bg-violet-500/15 rounded-full blur-3xl animate-float-orb [animation-delay:4s]" />
      <div className="relative bg-slate-900/75 p-8 rounded-2xl border border-white/[0.22] shadow-2xl w-full max-w-md">
        <h1 className="text-2xl font-bold text-slate-100 mb-2">🔒 Budget Tracker</h1>
        <p className="text-slate-400 mb-6">Enter your PIN to unlock</p>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="password"
            inputMode="numeric"
            maxLength={6}
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="• • • •"
            className="w-full px-4 py-3 glass-input text-center text-3xl tracking-widest placeholder:text-slate-500"
            autoFocus
          />
          <button
            type="submit"
            className="w-full btn-primary py-2"
          >
            Unlock
          </button>
        </form>
        <button
          onClick={() => setIsRecovering(true)}
          className="w-full mt-3 text-slate-500 hover:text-slate-300 transition-colors text-sm"
        >
          Forgot PIN?
        </button>
      </div>
    </div>
  );
}
