import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import { getPinSetupStatus, dismissPinSetup } from '../crypto/pinManager';

type PinSetupStatus = 'unseen' | 'dismissed' | 'configured';

interface AuthState {
  isLocked: boolean;
  pinSetupStatus: PinSetupStatus;
  encryptionKey: CryptoKey | null;
}

interface AuthContextValue extends AuthState {
  unlock: (key: CryptoKey) => void;
  lock: () => void;
  setPinConfigured: (value: boolean) => void;
  skipPin: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AuthState>(() => {
    const status = getPinSetupStatus();
    return {
      isLocked: status === 'configured' || status === 'unseen',
      pinSetupStatus: status,
      encryptionKey: null,
    };
  });

  const unlock = useCallback((key: CryptoKey) => {
    setState((prev) => ({ ...prev, isLocked: false, encryptionKey: key }));
  }, []);

  const lock = useCallback(() => {
    setState((prev) => ({ ...prev, isLocked: true, encryptionKey: null }));
  }, []);

  const setPinConfigured = useCallback((value: boolean) => {
    setState((prev) => ({
      ...prev,
      pinSetupStatus: value ? 'configured' : 'dismissed',
    }));
  }, []);

  const skipPin = useCallback(() => {
    dismissPinSetup();
    setState((prev) => ({ ...prev, isLocked: false, pinSetupStatus: 'dismissed' }));
  }, []);

  const value = useMemo(
    () => ({ ...state, unlock, lock, setPinConfigured, skipPin }),
    [state, unlock, lock, setPinConfigured, skipPin]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

// eslint-disable-next-line react-refresh/only-export-components -- hook must co-locate with context
export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
}
