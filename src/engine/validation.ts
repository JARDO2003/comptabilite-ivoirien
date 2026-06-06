// ══════════════════════════════════════════
// MOTEUR DE VALIDATION COMPTABLE
// SYSCOHADA Révisé 2017 — COMEO AI v5
// ══════════════════════════════════════════

import type { LigneEcriture, ValidationResult } from '@/types';

/**
 * Valide une écriture comptable selon les règles SYSCOHADA
 * - Σ Débit = Σ Crédit (équilibre parfait)
 * - Au moins 2 lignes
 * - TVA cohérente
 * - Comptes valides
 */
export function validerEcriture(lignes: LigneEcriture[]): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  const lignesValides = lignes.filter(l => l.compte && (l.debit > 0 || l.credit > 0));
  
  if (lignesValides.length < 2) {
    errors.push('Au moins 2 lignes requises (partie double obligatoire)');
  }
  
  let totalDebit = 0;
  let totalCredit = 0;
  
  lignesValides.forEach((l, i) => {
    const d = Math.round(l.debit || 0);
    const c = Math.round(l.credit || 0);
    
    if (d > 0 && c > 0) {
      errors.push(`Ligne ${i + 1}: une ligne ne peut être à la fois débitrice et créditrice`);
    }
    if (!l.compte.match(/^\d+$/)) {
      errors.push(`Ligne ${i + 1}: le compte "${l.compte}" n'est pas un numéro valide`);
    }
    
    totalDebit += d;
    totalCredit += c;
  });
  
  const difference = Math.abs(totalDebit - totalCredit);
  
  if (difference > 1) {
    errors.push(`Écriture non équilibrée — Débit: ${formatFCFA(totalDebit)} / Crédit: ${formatFCFA(totalCredit)} — Différence: ${formatFCFA(difference)}`);
  } else if (difference === 1) {
    warnings.push('Écart de 1 FCFA (tolérance acceptable)');
  }
  
  // Vérification TVA
  const tvaLignes = lignesValides.filter(l => 
    l.compte.startsWith('445') || l.compte.startsWith('443')
  );
  
  tvaLignes.forEach(l => {
    const montant = Math.round(l.debit || l.credit || 0);
    if (montant > 0) {
      const base = trouverBaseTVA(lignesValides, l.compte);
      if (base > 0) {
        const taux = getTauxTVA(l.compte);
        const tvaAttendue = Math.round(base * taux);
        const ecart = Math.abs(montant - tvaAttendue);
        if (ecart > 1) {
          warnings.push(`TVA ${l.compte}: montant ${formatFCFA(montant)} — attendu ${formatFCFA(tvaAttendue)} (base ${formatFCFA(base)} × ${Math.round(taux * 100)}%)`);
        }
      }
    }
  });
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    totalDebit,
    totalCredit,
    difference
  };
}

function trouverBaseTVA(lignes: LigneEcriture[], compteTVA: string): number {
  // Pour TVA récupérable (445x) → chercher le compte d'achat
  if (compteTVA.startsWith('445')) {
    const achat = lignes.find(l => 
      l.debit > 0 && (
        l.compte.startsWith('60') || 
        l.compte.startsWith('24') ||
        l.compte.startsWith('22') ||
        l.compte.startsWith('23')
      )
    );
    return achat ? Math.round(achat.debit) : 0;
  }
  // Pour TVA facturée (443x) → chercher le compte de vente
  if (compteTVA.startsWith('443')) {
    const vente = lignes.find(l => 
      l.credit > 0 && l.compte.startsWith('70')
    );
    return vente ? Math.round(vente.credit) : 0;
  }
  return 0;
}

function getTauxTVA(compte: string): number {
  // TVA Côte d'Ivoire: 18% standard, 9% réduit
  if (compte === '4451' || compte === '4431') return 0.18;
  return 0.18; // Taux par défaut
}

/**
 * Calcule HT et TVA à partir du montant TTC
 */
export function calculerHTTVA(ttc: number, taux: number = 0.18): { ht: number; tva: number } {
  const ht = Math.round(ttc / (1 + taux));
  const tva = ttc - ht;
  return { ht, tva };
}

/**
 * Calcule TTC à partir du montant HT
 */
export function calculerTTC(ht: number, taux: number = 0.18): { ttc: number; tva: number } {
  const tva = Math.round(ht * taux);
  const ttc = ht + tva;
  return { ttc, tva };
}

/**
 * Trie les lignes: débit avant crédit (norme SYSCOHADA)
 */
export function sortLignesDebitAvantCredit(lignes: LigneEcriture[]): LigneEcriture[] {
  return [...lignes].sort((a, b) => {
    const aIsDebit = (a.debit || 0) > 0;
    const bIsDebit = (b.debit || 0) > 0;
    if (aIsDebit && !bIsDebit) return -1;
    if (!aIsDebit && bIsDebit) return 1;
    return 0;
  });
}

/**
 * Formate un montant en FCFA
 */
export function formatFCFA(n: number): string {
  return Number(n || 0).toLocaleString('fr-FR', { maximumFractionDigits: 0 });
}

export function formatShort(n: number): string {
  const a = Math.abs(n);
  if (a >= 1e9) return (n / 1e9).toFixed(1) + ' Md FCFA';
  if (a >= 1e6) return (n / 1e6).toFixed(1) + ' M FCFA';
  if (a >= 1e3) return (n / 1e3).toFixed(0) + ' K FCFA';
  return (n || 0).toFixed(0) + ' FCFA';
}

/**
 * Correcteur automatique de comptes
 */
const MOTS_IMMOBILISATIONS = [
  'véhicule','camion','voiture','moto','transport','automobile',
  'ordinateur','informatique','bureau','mobilier','matériel',
  'machine','équipement','installation','bâtiment','terrain',
  'outillage','logiciel','brevet','licence','fonds commercial',
  'plantation','actif biologique','cheptel','aérien','fluvial',
  'ferroviaire','naval'
];

const COMPTES_IMMOB: Record<string, string> = {
  'véhicule': '2451', 'camion': '2451', 'voiture': '2451',
  'moto': '2451', 'automobile': '2451', 'transport': '2451',
  'ordinateur': '2442', 'informatique': '2442',
  'bureau': '2441', 'mobilier': '2444',
  'matériel': '2411', 'machine': '2411', 'équipement': '2411',
  'outillage': '2412', 'installation': '2341',
  'bâtiment': '2311', 'terrain': '2221',
  'logiciel': '2131', 'brevet': '2121', 'licence': '2122',
  'fonds commercial': '216',
  'plantation': '2465', 'actif biologique': '246',
  'cheptel': '2461', 'aérien': '2455',
  'fluvial': '2453', 'ferroviaire': '2452', 'naval': '2454'
};

export function corrigerComptesErreurs(lignes: LigneEcriture[]): LigneEcriture[] {
  return lignes.map(l => {
    const code = String(l.compte || '');
    const lib = (l.libelle || '').toLowerCase();
    let newCode = code;

    // 1. Achats mal classés → Immobilisations
    if (['601','6011','6012','6013','6014','602','604','6041','6042','6043','6044',
         '605','6056','6057','6058','607'].includes(code) && l.debit > 0) {
      const motTrouve = MOTS_IMMOBILISATIONS.find(m => lib.includes(m));
      if (motTrouve && !lib.includes('marchandis') && !lib.includes('consomm')) {
        newCode = COMPTES_IMMOB[motTrouve] || '2411';
      }
    }

    // 2. Amortissement terrain → 2824 uniquement
    if (['2821','2822','2823','2825','2826','2827','2828'].includes(code) && l.credit > 0) {
      newCode = '2824';
    }

    // 3. Banques locales — codes erreurs fréquents
    if (['511','512','513','514','515','518'].includes(code)) {
      newCode = '521';
    }

    // 4. TVA récupérable : achats vs immobilisations
    if (code === '4452' && l.debit > 0) {
      const motsImmo = ['véhicule','camion','ordinateur','mobilier',
        'matériel','machine','équipement','bâtiment','terrain',
        'installation','outillage','logiciel'];
      if (motsImmo.some(m => lib.includes(m))) newCode = '4451';
    }

    // 5. Fournisseurs : dettes courantes vs fournisseurs immobilisations
    if (code === '401' && l.credit > 0) {
      const motsImmo = ['immobilisation','terrain','bâtiment','véhicule',
        'matériel','équipement','machine','ordinateur','logiciel'];
      if (motsImmo.some(m => lib.includes(m))) newCode = '4812';
    }

    // 6. Mobile Money → 552
    if ((code === '571' || code === '521') && l.debit > 0) {
      if (['wave','orange money','mtn momo','moov money','mobile money'].some(m => lib.includes(m))) {
        newCode = '552';
      }
    }

    return {
      ...l,
      compte: newCode,
      libelle: l.libelle || newCode
    };
  });
}
