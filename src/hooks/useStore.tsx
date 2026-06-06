// ══════════════════════════════════════════
// STORE GLOBAL — COMEO AI v5
// Gère toutes les données comptables en localStorage
// ══════════════════════════════════════════

import { createContext, useContext, useState, useCallback, useMemo, type ReactNode } from 'react';
import type { Ecriture, Client, Fournisseur, Facture } from '@/types';
import {
  loadEcrituresLocal, saveEcrituresLocal,
  loadClientsLocal, saveClientsLocal,
  loadFournisseursLocal, saveFournisseursLocal,
  loadFacturesLocal, saveFacturesLocal
} from './useAuth';

interface StoreContextType {
  ecritures: Ecriture[];
  clients: Client[];
  fournisseurs: Fournisseur[];
  factures: Facture[];
  addEcriture: (e: Ecriture) => void;
  addEcritures: (es: Ecriture[]) => void;
  deleteEcriture: (id: string) => void;
  deleteGroupe: (groupId: string) => void;
  addClient: (c: Client) => void;
  updateClient: (c: Client) => void;
  deleteClient: (id: string) => void;
  addFournisseur: (f: Fournisseur) => void;
  updateFournisseur: (f: Fournisseur) => void;
  deleteFournisseur: (id: string) => void;
  addFacture: (f: Facture) => void;
  updateFacture: (f: Facture) => void;
  deleteFacture: (id: string) => void;
  stats: {
    nbEcritures: number;
    totalDebit: number;
    totalCredit: number;
    resultat: number;
    equilibre: boolean;
  };
  pieceCounter: number;
}

const StoreContext = createContext<StoreContextType | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [ecritures, setEcritures] = useState<Ecriture[]>(loadEcrituresLocal);
  const [clients, setClients] = useState<Client[]>(loadClientsLocal);
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>(loadFournisseursLocal);
  const [factures, setFactures] = useState<Facture[]>(loadFacturesLocal);

  const addEcriture = useCallback((e: Ecriture) => {
    setEcritures(prev => {
      const next = [...prev, e];
      saveEcrituresLocal(next);
      return next;
    });
  }, []);

  const addEcritures = useCallback((es: Ecriture[]) => {
    setEcritures(prev => {
      const next = [...prev, ...es];
      saveEcrituresLocal(next);
      return next;
    });
  }, []);

  const deleteEcriture = useCallback((id: string) => {
    setEcritures(prev => {
      const next = prev.filter(e => e.id !== id);
      saveEcrituresLocal(next);
      return next;
    });
  }, []);

  const deleteGroupe = useCallback((groupId: string) => {
    setEcritures(prev => {
      const next = prev.filter(e => e.groupId !== groupId);
      saveEcrituresLocal(next);
      return next;
    });
  }, []);

  const addClient = useCallback((c: Client) => {
    setClients(prev => {
      const next = [...prev, c];
      saveClientsLocal(next);
      return next;
    });
  }, []);

  const updateClient = useCallback((c: Client) => {
    setClients(prev => {
      const next = prev.map(x => x.id === c.id ? c : x);
      saveClientsLocal(next);
      return next;
    });
  }, []);

  const deleteClient = useCallback((id: string) => {
    setClients(prev => {
      const next = prev.filter(x => x.id !== id);
      saveClientsLocal(next);
      return next;
    });
  }, []);

  const addFournisseur = useCallback((f: Fournisseur) => {
    setFournisseurs(prev => {
      const next = [...prev, f];
      saveFournisseursLocal(next);
      return next;
    });
  }, []);

  const updateFournisseur = useCallback((f: Fournisseur) => {
    setFournisseurs(prev => {
      const next = prev.map(x => x.id === f.id ? f : x);
      saveFournisseursLocal(next);
      return next;
    });
  }, []);

  const deleteFournisseur = useCallback((id: string) => {
    setFournisseurs(prev => {
      const next = prev.filter(x => x.id !== id);
      saveFournisseursLocal(next);
      return next;
    });
  }, []);

  const addFacture = useCallback((f: Facture) => {
    setFactures(prev => {
      const next = [...prev, f];
      saveFacturesLocal(next);
      return next;
    });
  }, []);

  const updateFacture = useCallback((f: Facture) => {
    setFactures(prev => {
      const next = prev.map(x => x.id === f.id ? f : x);
      saveFacturesLocal(next);
      return next;
    });
  }, []);

  const deleteFacture = useCallback((id: string) => {
    setFactures(prev => {
      const next = prev.filter(x => x.id !== id);
      saveFacturesLocal(next);
      return next;
    });
  }, []);

  const stats = useMemo(() => {
    let tD = 0, tC = 0;
    ecritures.forEach(e => e.lignes.forEach(l => {
      tD += l.debit || 0;
      tC += l.credit || 0;
    }));
    const all = ecritures.flatMap(e => e.lignes);
    const prod = all.filter(l => l.compte?.[0] === '7').reduce((s, l) => s + (l.credit || 0), 0);
    const chg = all.filter(l => l.compte?.[0] === '6').reduce((s, l) => s + (l.debit || 0), 0);
    return {
      nbEcritures: ecritures.length,
      totalDebit: tD,
      totalCredit: tC,
      resultat: prod - chg,
      equilibre: Math.abs(tD - tC) < 1
    };
  }, [ecritures]);

  const pieceCounter = useMemo(() => ecritures.length + 1, [ecritures]);

  return (
    <StoreContext.Provider value={{
      ecritures, clients, fournisseurs, factures,
      addEcriture, addEcritures, deleteEcriture, deleteGroupe,
      addClient, updateClient, deleteClient,
      addFournisseur, updateFournisseur, deleteFournisseur,
      addFacture, updateFacture, deleteFacture,
      stats, pieceCounter
    }}>
      {children}
    </StoreContext.Provider>
  );
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
