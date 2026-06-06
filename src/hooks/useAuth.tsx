// ══════════════════════════════════════════
// AUTHENTIFICATION FIREBASE — COMEO AI v5
// ══════════════════════════════════════════

import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';
import type { UserProfile } from '@/types';

// Simuler l'authentification en mode local (sans Firebase réel)
// En production, remplacer par les appels Firebase réels

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string, password: string) => Promise<boolean>;
  register: (data: RegisterData) => Promise<boolean>;
  logout: () => void;
  loading: boolean;
}

interface RegisterData {
  company: string;
  email: string;
  password: string;
  exercice: string;
}

const AuthContext = createContext<AuthContextType | null>(null);

const STORAGE_KEY = 'syscohada_user';
const STORAGE_ECRITURES = 'syscohada_ecritures';
const STORAGE_CLIENTS = 'syscohada_clients';
const STORAGE_FOURNISSEURS = 'syscohada_fournisseurs';
const STORAGE_FACTURES = 'syscohada_factures';

function loadUser(): UserProfile | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw);
  } catch { return null; }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(loadUser);
  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email: string, _password: string): Promise<boolean> => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    // Vérifier si un utilisateur existe avec cet email
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.email === email) {
        setUser(parsed);
        setLoading(false);
        return true;
      }
    }
    
    // Utilisateur par défaut pour démo
    const defaultUser: UserProfile = {
      id: 'demo_' + Date.now(),
      company: 'DEMO SARL',
      email,
      compte701: '701',
      exercice: '2024',
      createdAt: new Date().toISOString(),
      subscriptionStatus: 'trial'
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultUser));
    setUser(defaultUser);
    setLoading(false);
    return true;
  }, []);

  const register = useCallback(async (regData: RegisterData): Promise<boolean> => {
    setLoading(true);
    await new Promise(r => setTimeout(r, 500));
    
    const trialEndsAt = new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString();
    
    const newUser: UserProfile = {
      id: 'usr_' + Date.now(),
      company: regData.company,
      email: regData.email,
      compte701: '701',
      exercice: regData.exercice || '2024',
      createdAt: new Date().toISOString(),
      trialEndsAt,
      subscriptionStatus: 'trial'
    };
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newUser));
    setLoading(false);
    return true;
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    // On garde les données en localStorage pour réutilisation
  }, []);

  return (
    <AuthContext.Provider value={{ user, login, register, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export function isTrialActive(user: UserProfile): boolean {
  if (!user.trialEndsAt) return false;
  return new Date(user.trialEndsAt).getTime() > Date.now();
}

export function isPremiumActive(user: UserProfile): boolean {
  if (!user.premiumUntil) return false;
  return new Date(user.premiumUntil).getTime() > Date.now();
}

export function hasAccess(user: UserProfile): boolean {
  return isTrialActive(user) || isPremiumActive(user);
}

// Stockage local des écritures
export function loadEcrituresLocal(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_ECRITURES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveEcrituresLocal(ecritures: any[]) {
  localStorage.setItem(STORAGE_ECRITURES, JSON.stringify(ecritures));
}

export function loadClientsLocal(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_CLIENTS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveClientsLocal(clients: any[]) {
  localStorage.setItem(STORAGE_CLIENTS, JSON.stringify(clients));
}

export function loadFournisseursLocal(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_FOURNISSEURS);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFournisseursLocal(fournisseurs: any[]) {
  localStorage.setItem(STORAGE_FOURNISSEURS, JSON.stringify(fournisseurs));
}

export function loadFacturesLocal(): any[] {
  try {
    const raw = localStorage.getItem(STORAGE_FACTURES);
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function saveFacturesLocal(factures: any[]) {
  localStorage.setItem(STORAGE_FACTURES, JSON.stringify(factures));
}
