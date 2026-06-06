import { useState } from 'react';
import { useStore } from '@/hooks';
import { validerEcriture, sortLignesDebitAvantCredit, corrigerComptesErreurs } from '@/engine/validation';
import { searchComptes, getLibelleCompte, JOURNAL_NAMES } from '@/data/planComptable';
import type { LigneEcriture, JournalCode } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function Saisie() {
  const { addEcriture, pieceCounter } = useStore();
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [journal, setJournal] = useState<JournalCode>('AC');
  const [libelle, setLibelle] = useState('');
  const [lignes, setLignes] = useState<LigneEcriture[]>([
    { compte: '', libelle: '', debit: 0, credit: 0 },
    { compte: '', libelle: '', debit: 0, credit: 0 }
  ]);
  const [searchResults, setSearchResults] = useState<Record<number, Array<{ code: string; libelle: string }>>>({});
  const [validation, setValidation] = useState<ReturnType<typeof validerEcriture> | null>(null);
  const [showValidation, setShowValidation] = useState(false);

  const addLigne = () => setLignes(prev => [...prev, { compte: '', libelle: '', debit: 0, credit: 0 }]);
  
  const removeLigne = (idx: number) => {
    if (lignes.length <= 2) return;
    setLignes(prev => prev.filter((_, i) => i !== idx));
  };

  const updateLigne = (idx: number, field: keyof LigneEcriture, value: string | number) => {
    setLignes(prev => prev.map((l, i) => i === idx ? { ...l, [field]: value } : l));
  };

  const handleCompteSearch = (idx: number, value: string) => {
    updateLigne(idx, 'compte', value);
    if (value.length >= 2) {
      const results = searchComptes(value);
      setSearchResults(prev => ({ ...prev, [idx]: results }));
    } else {
      setSearchResults(prev => { const n = { ...prev }; delete n[idx]; return n; });
    }
  };

  const selectCompte = (idx: number, code: string) => {
    const lib = getLibelleCompte(code);
    setLignes(prev => prev.map((l, i) => i === idx ? { ...l, compte: code, libelle: lib || l.libelle } : l));
    setSearchResults(prev => { const n = { ...prev }; delete n[idx]; return n; });
  };

  const handleSave = () => {
    const result = validerEcriture(lignes);
    setValidation(result);
    setShowValidation(true);
    if (!result.valid) return;

    const corrige = corrigerComptesErreurs(lignes);
    const triees = sortLignesDebitAvantCredit(corrige);

    addEcriture({
      id: genId(),
      date,
      journal,
      piece: `ECR-${String(pieceCounter).padStart(4, '0')}`,
      libelle: libelle || 'Écriture sans libellé',
      createdAt: new Date().toISOString(),
      lignes: triees.map(l => ({
        compte: l.compte,
        libelle: l.libelle || getLibelleCompte(l.compte),
        debit: Math.round(l.debit || 0),
        credit: Math.round(l.credit || 0)
      }))
    });

    // Reset
    setLibelle('');
    setLignes([
      { compte: '', libelle: '', debit: 0, credit: 0 },
      { compte: '', libelle: '', debit: 0, credit: 0 }
    ]);
    setShowValidation(false);
    setValidation(null);
  };

  const totalDebit = lignes.reduce((s, l) => s + (Number(l.debit) || 0), 0);
  const totalCredit = lignes.reduce((s, l) => s + (Number(l.credit) || 0), 0);
  const solde = totalDebit - totalCredit;

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Saisie des écritures</h1>
          <p className="text-xs text-gray-500 mt-1">Saisie manuelle assistée par le moteur de validation</p>
        </div>
        <Button onClick={handleSave} className="bg-gray-900 text-amber-400 hover:bg-gray-800">
          <CheckCircle size={16} className="mr-1.5" /> Valider l'écriture
        </Button>
      </div>

      {/* En-tête */}
      <Card className="p-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Date</label>
            <input type="date" value={date} onChange={e => setDate(e.target.value)}
              className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400 transition-all" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Journal</label>
            <select value={journal} onChange={e => setJournal(e.target.value as JournalCode)}
              className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400 transition-all">
              {Object.entries(JOURNAL_NAMES).map(([code, name]) => (
                <option key={code} value={code}>{code} — {name}</option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">N° Pièce</label>
            <input value={`ECR-${String(pieceCounter).padStart(4, '0')}`} readOnly
              className="bg-gray-100 border border-gray-200 rounded px-3 py-2 text-sm text-gray-500" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Libellé général</label>
            <input type="text" value={libelle} onChange={e => setLibelle(e.target.value)}
              placeholder="Description de l'opération..."
              className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400 transition-all placeholder:text-gray-300" />
          </div>
        </div>
      </Card>

      {/* Lignes */}
      <Card className="p-4">
        <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
          <div className="w-0.5 h-3.5 bg-amber-400 rounded" /> Lignes d'écriture
        </div>

        {/* Desktop table */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left" style={{ background: '#0a0b10' }}>
                <th className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-amber-400">Compte</th>
                <th className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-amber-400">Libellé</th>
                <th className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-amber-400 text-right">Débit (FCFA)</th>
                <th className="px-3 py-2 text-[8px] font-bold uppercase tracking-widest text-amber-400 text-right">Crédit (FCFA)</th>
                <th className="w-10"></th>
              </tr>
            </thead>
            <tbody>
              {lignes.map((l, i) => (
                <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-2 py-2 relative">
                    <input value={l.compte}
                      onChange={e => handleCompteSearch(i, e.target.value)}
                      placeholder="N° compte"
                      className="w-full bg-transparent border-none px-1 py-1 text-sm font-mono focus:bg-gray-100 rounded outline-none" />
                    {searchResults[i]?.length > 0 && (
                      <div className="absolute z-20 top-full left-0 right-0 bg-white border border-amber-400 rounded shadow-lg max-h-40 overflow-y-auto mt-1">
                        {searchResults[i].map(r => (
                          <button key={r.code} onClick={() => selectCompte(i, r.code)}
                            className="w-full text-left px-3 py-1.5 text-xs hover:bg-amber-50 flex items-center gap-2">
                            <span className="font-mono text-amber-600 font-semibold text-[10px]">{r.code}</span>
                            <span className="text-gray-600 truncate">{r.libelle}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </td>
                  <td className="px-2 py-2">
                    <input value={l.libelle}
                      onChange={e => updateLigne(i, 'libelle', e.target.value)}
                      placeholder="Libellé de la ligne"
                      className="w-full bg-transparent border-none px-1 py-1 text-sm focus:bg-gray-100 rounded outline-none" />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" value={l.debit || ''}
                      onChange={e => updateLigne(i, 'debit', Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-transparent border-none px-1 py-1 text-sm text-right font-mono text-blue-600 focus:bg-gray-100 rounded outline-none" />
                  </td>
                  <td className="px-2 py-2">
                    <input type="number" value={l.credit || ''}
                      onChange={e => updateLigne(i, 'credit', Number(e.target.value))}
                      placeholder="0"
                      className="w-full bg-transparent border-none px-1 py-1 text-sm text-right font-mono text-green-600 focus:bg-gray-100 rounded outline-none" />
                  </td>
                  <td className="px-2 py-2 text-center">
                    <button onClick={() => removeLigne(i)}
                      className="text-red-400 hover:text-red-600 opacity-25 hover:opacity-100 transition-all p-1">
                      <Trash2 size={14} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="md:hidden space-y-2">
          {lignes.map((l, i) => (
            <div key={i} className="p-3 bg-white border border-gray-200 rounded-md space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Ligne {i + 1}</span>
                <button onClick={() => removeLigne(i)} className="text-red-400 p-1"><Trash2 size={14} /></button>
              </div>
              <input value={l.compte} onChange={e => handleCompteSearch(i, e.target.value)}
                placeholder="N° compte" className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm font-mono" />
              <input value={l.libelle} onChange={e => updateLigne(i, 'libelle', e.target.value)}
                placeholder="Libellé" className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm" />
              <div className="grid grid-cols-2 gap-2">
                <input type="number" value={l.debit || ''} onChange={e => updateLigne(i, 'debit', Number(e.target.value))}
                  placeholder="Débit" className="bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm font-mono text-blue-600 text-right" />
                <input type="number" value={l.credit || ''} onChange={e => updateLigne(i, 'credit', Number(e.target.value))}
                  placeholder="Crédit" className="bg-gray-50 border border-gray-200 rounded px-2 py-2 text-sm font-mono text-green-600 text-right" />
              </div>
            </div>
          ))}
        </div>

        <button onClick={addLigne}
          className="mt-3 w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all">
          <Plus size={14} /> Ajouter une ligne
        </button>

        {/* Balance bar */}
        <div className="mt-4 flex flex-wrap items-center gap-4 p-3 rounded"
          style={{ background: '#0a0b10' }}>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Débit</span>
            <span className="font-mono text-sm text-blue-400">{totalDebit.toLocaleString('fr-FR')}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Crédit</span>
            <span className="font-mono text-sm text-green-400">{totalCredit.toLocaleString('fr-FR')}</span>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="text-[9px] font-bold uppercase tracking-widest text-white/30">Solde</span>
            <span className={`font-mono text-sm font-semibold ${Math.abs(solde) < 1 ? 'text-green-400' : 'text-red-400'}`}>
              {Math.abs(solde).toLocaleString('fr-FR')}
            </span>
          </div>
        </div>
      </Card>

      {/* Validation results */}
      {showValidation && validation && (
        <Card className={`p-4 ${validation.valid ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'}`}>
          <div className="flex items-center gap-2 mb-2">
            {validation.valid ? <CheckCircle size={16} className="text-green-600" />
              : <AlertTriangle size={16} className="text-red-600" />}
            <span className={`text-sm font-bold ${validation.valid ? 'text-green-700' : 'text-red-700'}`}>
              {validation.valid ? 'Écriture valide' : 'Erreurs détectées'}
            </span>
          </div>
          {validation.errors.length > 0 && (
            <ul className="space-y-1">
              {validation.errors.map((e, i) => (
                <li key={i} className="text-xs text-red-600 flex items-start gap-1.5">
                  <span className="mt-0.5">•</span> {e}
                </li>
              ))}
            </ul>
          )}
          {validation.warnings.length > 0 && (
            <ul className="space-y-1 mt-2">
              {validation.warnings.map((w, i) => (
                <li key={i} className="text-xs text-amber-600 flex items-start gap-1.5">
                  <span className="mt-0.5">⚠</span> {w}
                </li>
              ))}
            </ul>
          )}
        </Card>
      )}
    </div>
  );
}
