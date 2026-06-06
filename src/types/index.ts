// ══════════════════════════════════════════
// TYPES SYSCOHADA PRO — COMEO AI v5
// ══════════════════════════════════════════

export interface LigneEcriture {
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
}

export interface Ecriture {
  id: string;
  date: string;
  journal: JournalCode;
  piece: string;
  libelle: string;
  groupId?: string;
  groupLibelle?: string;
  groupSize?: number;
  groupIdx?: number;
  createdAt: string;
  lignes: LigneEcriture[];
}

export type JournalCode = 'AC' | 'VE' | 'BQ' | 'CA' | 'OD' | 'AN' | 'IN';

export interface Compte {
  code: string;
  libelle: string;
  classe: string;
  nature: string;
}

export interface BalanceLigne {
  compte: string;
  libelle: string;
  debit: number;
  credit: number;
  soldeDebiteur: number;
  soldeCrediteur: number;
}

export interface GrandLivreCompte {
  code: string;
  libelle: string;
  debit: number;
  credit: number;
  mvts: Mouvement[];
}

export interface Mouvement {
  date: string;
  piece: string;
  journal: string;
  libelle: string;
  debit: number;
  credit: number;
}

export interface Client {
  id: string;
  code: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  nif: string;
  notes: string;
  caTotal: number;
  soldeDu: number;
}

export interface Fournisseur {
  id: string;
  code: string;
  nom: string;
  telephone: string;
  email: string;
  adresse: string;
  ville: string;
  nif: string;
  notes: string;
  totalAchats: number;
  soldeDu: number;
}

export interface FactureLigne {
  id: string;
  designation: string;
  quantite: number;
  prixUnitaireHT: number;
  remise: number;
  tva: number;
  totalHT: number;
}

export type FactureType = 'facture' | 'proforma' | 'avoir' | 'acompte';
export type FactureStatut = 'brouillon' | 'envoyee' | 'payee' | 'partielle' | 'annulee' | 'retard';

export interface Facture {
  id: string;
  numero: string;
  type: FactureType;
  dateEmission: string;
  dateEcheance: string;
  clientId: string;
  clientNom: string;
  clientAdresse: string;
  clientEmail: string;
  clientTel: string;
  reference: string;
  lignes: FactureLigne[];
  sousTotalHT: number;
  remiseGlobale: number;
  totalTVA: number;
  totalTTC: number;
  modeReglement: string;
  conditions: string;
  monnaie: string;
  notes: string;
  statut: FactureStatut;
  paye: number;
  createdAt: string;
}

export interface UserProfile {
  id: string;
  company: string;
  email: string;
  compte701: string;
  exercice: string;
  createdAt: string;
  trialEndsAt?: string;
  premiumUntil?: string;
  subscriptionStatus: 'trial' | 'active' | 'pending_payment' | 'cancelled' | 'expired';
}

export type ViewName =
  | 'dashboard'
  | 'saisie'
  | 'journal'
  | 'grandlivre'
  | 'balance'
  | 'bilan'
  | 'resultat'
  | 'tresorerie'
  | 'plancomptable'
  | 'factures'
  | 'devis'
  | 'clients'
  | 'fournisseurs';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  totalDebit: number;
  totalCredit: number;
  difference: number;
}

export interface ExportOptions {
  docType: string;
  format: 'pdf' | 'word' | 'excel';
  dateDebut?: string;
  dateFin?: string;
  journal?: string;
}
