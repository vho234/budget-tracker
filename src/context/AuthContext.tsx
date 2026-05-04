import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';

interface AuthState {
  isLocked: boolean;
  isPinConfigured: boolean;
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
    try {
      const settings = localStorage.getItem('budget-tracker-settings');
      const isPinConfigured = settings ? JSON.parse(settings).hasPinEnabled : false;
      return {
        isLocked: isPinConfigured,
        isPinConfigured,
        encryptionKey: null,
      };
    } catch {
      localStorage.removeItem('budget-tracker-settings');
      return { isLocked: false, isPinConfigured: false, encryptionKey: null };
    }
  });

  const unlock = useCallback((key: CryptoKey) => {
    setState((prev) => ({ ...prev, isLocked: false, encryptionKey: key }));
  }, []);

  const lock = useCallback(() => {
    setState((prev) => ({ ...prev, isLocked: true, encryptionKey: null }));
  }, []);

  const setPinConfigured = useCallback((value: boolean) => {
    setState((prev) => ({ ...prev, isPinConfigured: value }));
  }, []);

  const skipPin = useCallback(() => {
    setState((prev) => ({ ...prev, isLocked: false, isPinConfigured: false }));
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
