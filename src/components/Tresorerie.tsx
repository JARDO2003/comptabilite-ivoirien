import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import { PLAN_COMPTABLE } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { formatFCFA } from '@/engine/validation';

export default function Tresorerie() {
  const { ecritures } = useStore();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  const comptesTreso = useMemo(() => {
    const comptes: Record<string, { debit: number; credit: number; solde: number }> = {};
    ecritures.forEach(e => {
      if (dateDebut && e.date < dateDebut) return;
      if (dateFin && e.date > dateFin) return;
      e.lignes.forEach(l => {
        if (l.compte.startsWith('5')) {
          if (!comptes[l.compte]) comptes[l.compte] = { debit: 0, credit: 0, solde: 0 };
          comptes[l.compte].debit += l.debit || 0;
          comptes[l.compte].credit += l.credit || 0;
          comptes[l.compte].solde += (l.debit || 0) - (l.credit || 0);
        }
      });
    });
    return Object.entries(comptes)
      .map(([code, data]) => ({
        code, ...data,
        libelle: PLAN_COMPTABLE[code] || 'Compte de trésorerie'
      }))
      .filter(c => c.debit > 0 || c.credit > 0)
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [ecritures, dateDebut, dateFin]);

  const totaux = useMemo(() => ({
    debit: comptesTreso.reduce((s, c) => s + c.debit, 0),
    credit: comptesTreso.reduce((s, c) => s + c.credit, 0),
    solde: comptesTreso.reduce((s, c) => s + c.solde, 0)
  }), [comptesTreso]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Trésorerie</h1>
          <p className="text-xs text-gray-500 mt-1">Flux de trésorerie — Classe 5</p>
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
          <button onClick={() => { setDateDebut(''); setDateFin(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            ✕
          </button>
        </div>
      </Card>

      <Card className="p-4">
        {comptesTreso.length === 0 ? (
          <div className="text-center py-8 text-gray-400">
            <div className="text-3xl mb-2 opacity-20">◎</div>
            <p className="text-sm">Comptes de trésorerie (5xxx)</p>
            <p className="text-xs mt-1">Aucun mouvement enregistré</p>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr style={{ background: '#0a0b10' }}>
                    <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Compte</th>
                    <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Libellé</th>
                    <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Entrées (D)</th>
                    <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Sorties (C)</th>
                    <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Solde</th>
                  </tr>
                </thead>
                <tbody>
                  {comptesTreso.map(c => (
                    <tr key={c.code} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="px-3 py-2 font-mono text-amber-600 font-semibold">{c.code}</td>
                      <td className="px-3 py-2 text-gray-700">{c.libelle}</td>
                      <td className="px-3 py-2 text-right font-mono text-blue-600">{formatFCFA(c.debit)}</td>
                      <td className="px-3 py-2 text-right font-mono text-green-600">{formatFCFA(c.credit)}</td>
                      <td className={`px-3 py-2 text-right font-mono font-semibold ${c.solde >= 0 ? 'text-blue-700' : 'text-red-600'}`}>
                        {formatFCFA(c.solde)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex flex-wrap items-center justify-end gap-5 p-3 rounded"
              style={{ background: '#0a0b10' }}>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Entrées</span>
                <span className="font-mono text-sm text-blue-400">{formatFCFA(totaux.debit)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Sorties</span>
                <span className="font-mono text-sm text-green-400">{formatFCFA(totaux.credit)}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Solde net</span>
                <span className={`font-mono text-sm font-semibold ${totaux.solde >= 0 ? 'text-amber-400' : 'text-red-400'}`}>
                  {formatFCFA(totaux.solde)}
                </span>
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}
