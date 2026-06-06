import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import { PLAN_COMPTABLE } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { formatFCFA } from '@/engine/validation';
import { Search } from 'lucide-react';

export default function Balance() {
  const { ecritures } = useStore();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [classeFilter, setClasseFilter] = useState('');
  const [search, setSearch] = useState('');

  const lignes = useMemo(() => {
    const comptes: Record<string, { debit: number; credit: number }> = {};
    ecritures.forEach(e => {
      if (dateDebut && e.date < dateDebut) return;
      if (dateFin && e.date > dateFin) return;
      e.lignes.forEach(l => {
        if (!comptes[l.compte]) comptes[l.compte] = { debit: 0, credit: 0 };
        comptes[l.compte].debit += l.debit || 0;
        comptes[l.compte].credit += l.credit || 0;
      });
    });

    return Object.entries(comptes)
      .map(([compte, mvt]) => {
        const solde = mvt.debit - mvt.credit;
        return {
          compte,
          libelle: PLAN_COMPTABLE[compte] || 'Compte inconnu',
          debit: mvt.debit,
          credit: mvt.credit,
          soldeDebiteur: solde > 0 ? solde : 0,
          soldeCrediteur: solde < 0 ? -solde : 0,
          classe: compte[0]
        };
      })
      .filter(l => {
        if (classeFilter && l.classe !== classeFilter) return false;
        if (search && !(`${l.compte} ${l.libelle}`.toLowerCase().includes(search.toLowerCase()))) return false;
        return l.debit > 0 || l.credit > 0;
      })
      .sort((a, b) => a.compte.localeCompare(b.compte));
  }, [ecritures, dateDebut, dateFin, classeFilter, search]);

  const totaux = useMemo(() => ({
    td: lignes.reduce((s, l) => s + l.debit, 0),
    tc: lignes.reduce((s, l) => s + l.credit, 0),
    sd: lignes.reduce((s, l) => s + l.soldeDebiteur, 0),
    sc: lignes.reduce((s, l) => s + l.soldeCrediteur, 0),
  }), [lignes]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Balance générale</h1>
          <p className="text-xs text-gray-500 mt-1">Synthèse des mouvements et soldes par compte</p>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Du</span>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Au</span>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Classe</span>
          <select value={classeFilter} onChange={e => setClasseFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400">
            <option value="">Toutes</option>
            {Array.from({ length: 8 }, (_, i) => i + 1).map(c => (
              <option key={c} value={String(c)}>Classe {c}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
            <Search size={14} className="text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Compte ou libellé..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          </div>
          <button onClick={() => { setDateDebut(''); setDateFin(''); setClasseFilter(''); setSearch(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            ✕
          </button>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#0a0b10' }}>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Compte</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Libellé</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Mvt Débit</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Mvt Crédit</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Solde D</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Solde C</th>
            </tr>
          </thead>
          <tbody>
            {lignes.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Aucune donnée</td>
              </tr>
            ) : lignes.map(l => (
              <tr key={l.compte} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-amber-600 font-semibold">{l.compte}</td>
                <td className="px-3 py-2 text-gray-700">{l.libelle}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-600">{l.debit > 0 ? formatFCFA(l.debit) : ''}</td>
                <td className="px-3 py-2 text-right font-mono text-green-600">{l.credit > 0 ? formatFCFA(l.credit) : ''}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 font-semibold">{l.soldeDebiteur > 0 ? formatFCFA(l.soldeDebiteur) : ''}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 font-semibold">{l.soldeCrediteur > 0 ? formatFCFA(l.soldeCrediteur) : ''}</td>
              </tr>
            ))}
            {/* Totaux */}
            <tr className="font-bold" style={{ background: '#f0ece3' }}>
              <td colSpan={2} className="px-3 py-3 text-[10px] uppercase tracking-widest text-gray-600">TOTAL</td>
              <td className="px-3 py-3 text-right font-mono text-blue-700">{formatFCFA(totaux.td)}</td>
              <td className="px-3 py-3 text-right font-mono text-green-700">{formatFCFA(totaux.tc)}</td>
              <td className="px-3 py-3 text-right font-mono">{formatFCFA(totaux.sd)}</td>
              <td className="px-3 py-3 text-right font-mono">{formatFCFA(totaux.sc)}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
