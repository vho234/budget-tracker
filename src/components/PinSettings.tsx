import { useState } from 'react';
import { Lock, Unlock, KeyRound } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { setupPin, changePin, disablePin } from '../crypto/pinManager';

export function PinSettings() {
  const { pinSetupStatus, setPinConfigured, unlock } = useAuth();
  const [mode, setMode] = useState<'idle' | 'enable' | 'change' | 'disable'>('idle');
  const [currentPin, setCurrentPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [securityQuestion, setSecurityQuestion] = useState('');
  const [securityAnswer, setSecurityAnswer] = useState('');
  const [step, setStep] = useState<'pin' | 'security'>('pin');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const resetForm = () => {
    setMode('idle');
    setStep('pin');
    setCurrentPin('');
    setNewPin('');
    setConfirmPin('');
    setSecurityQuestion('');
    setSecurityAnswer('');
    setError('');
  };

  const handleEnable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (step === 'pin') {
      if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
        setError('PIN must be 4-6 digits');
        return;
      }
      if (newPin !== confirmPin) {
        setError('PINs do not match');
        return;
      }
      setStep('security');
      return;
    }

    // Security step
    if (!securityQuestion.trim() || !securityAnswer.trim()) {
      setError('Please fill in both fields');
      return;
    }

    try {
      const key = await setupPin(newPin, securityQuestion, securityAnswer);
      setPinConfigured(true);
      unlock(key);
      setSuccess('PIN lock enabled successfully');
      resetForm();
    } catch {
      setError('Failed to set up PIN. Please try again.');
    }
  };

  const handleChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPin.length < 4 || newPin.length > 6 || !/^\d+$/.test(newPin)) {
      setError('New PIN must be 4-6 digits');
      return;
    }
    if (newPin !== confirmPin) {
      setError('PINs do not match');
      return;
    }

    const key = await changePin(currentPin, newPin);
    if (key) {
      unlock(key);
      setSuccess('PIN changed successfully');
      resetForm();
    } else {
      setError('Current PIN is incorrect');
    }
  };

  const handleDisable = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await disablePin(currentPin);
    if (result) {
      setPinConfigured(false);
      setSuccess('PIN lock disabled');
      resetForm();
    } else {
      setError('Incorrect PIN');
    }
  };

  const isConfigured = pinSetupStatus === 'configured';

  return (
    <div className="bg-slate-900/60 rounded-2xl border border-white/[0.16] p-6">
      <h3 className="text-lg font-semibold text-slate-100 mb-4 flex items-center gap-2">
        <Lock className="w-5 h-5 text-indigo-400" /> PIN Lock
      </h3>

      {success && (
        <p className="text-emerald-400 text-sm mb-4 bg-emerald-500/10 rounded-lg px-3 py-2">{success}</p>
      )}

      {mode === 'idle' && (
        <div className="space-y-3">
          <p className="text-slate-400 text-sm">
            {isConfigured
              ? 'Your app is protected with a PIN lock.'
              : 'Add a PIN lock to protect your budget data.'}
          </p>
          <div className="flex gap-3 flex-wrap">
            {!isConfigured && (
              <button
                onClick={() => { setSuccess(''); setMode('enable'); }}
                className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm"
              >
                <Lock className="w-4 h-4" /> Enable PIN Lock
              </button>
            )}
            {isConfigured && (
              <>
                <button
                  onClick={() => { setSuccess(''); setMode('change'); }}
                  className="btn-primary px-4 py-2 flex items-center gap-1.5 text-sm"
                >
                  <KeyRound className="w-4 h-4" /> Change PIN
                </button>
                <button
                  onClick={() => { setSuccess(''); setMode('disable'); }}
                  className="btn-secondary px-4 py-2 flex items-center gap-1.5 text-sm"
                >
                  <Unlock className="w-4 h-4" /> Disable PIN Lock
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {mode === 'enable' && (
        <form onSubmit={handleEnable} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          {step === 'pin' ? (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">New PIN (4-6 digits)</label>
                <input
                  type="password"
                  inputMode="numeric"
                  maxLength={6}
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Enter PIN"
                  className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
                  autoFocus
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
                  className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
                />
              </div>
            </>
          ) : (
            <>
              <p className="text-slate-400 text-sm">Set a security question for PIN recovery.</p>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Security Question</label>
                <input
                  type="text"
                  value={securityQuestion}
                  onChange={(e) => setSecurityQuestion(e.target.value)}
                  placeholder="e.g., What is your pet's name?"
                  className="w-full px-4 py-2 glass-input"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-300 mb-1">Answer</label>
                <input
                  type="text"
                  value={securityAnswer}
                  onChange={(e) => setSecurityAnswer(e.target.value)}
                  placeholder="Your answer"
                  className="w-full px-4 py-2 glass-input"
                />
              </div>
            </>
          )}
          <div className="flex gap-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">
              {step === 'pin' ? 'Next' : 'Enable PIN'}
            </button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">
              Cancel
            </button>
          </div>
        </form>
      )}

      {mode === 'change' && (
        <form onSubmit={handleChange} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Current PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
              autoFocus
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
              className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Confirm New PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={confirmPin}
              onChange={(e) => setConfirmPin(e.target.value)}
              className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm">Change PIN</button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}

      {mode === 'disable' && (
        <form onSubmit={handleDisable} className="space-y-4">
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <p className="text-slate-400 text-sm">Enter your current PIN to disable the lock.</p>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Current PIN</label>
            <input
              type="password"
              inputMode="numeric"
              maxLength={6}
              value={currentPin}
              onChange={(e) => setCurrentPin(e.target.value)}
              className="w-full px-4 py-2 glass-input text-center text-xl tracking-widest"
              autoFocus
            />
          </div>
          <div className="flex gap-3">
            <button type="submit" className="btn-primary px-4 py-2 text-sm bg-red-600 hover:bg-red-500">Disable PIN</button>
            <button type="button" onClick={resetForm} className="btn-secondary px-4 py-2 text-sm">Cancel</button>
          </div>
        </form>
      )}
    </div>
  );
}
