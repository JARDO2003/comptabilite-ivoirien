import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import { PLAN_COMPTABLE } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { formatFCFA } from '@/engine/validation';
import { Search, ChevronDown, ChevronRight } from 'lucide-react';

export default function GrandLivre() {
  const { ecritures } = useStore();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [search, setSearch] = useState('');
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const comptesData = useMemo(() => {
    const comptes: Record<string, { debit: number; credit: number; mvts: Array<{ date: string; piece: string; journal: string; libelle: string; debit: number; credit: number }> }> = {};
    ecritures.forEach(e => {
      if (dateDebut && e.date < dateDebut) return;
      if (dateFin && e.date > dateFin) return;
      e.lignes.forEach(l => {
        if (!comptes[l.compte]) comptes[l.compte] = { debit: 0, credit: 0, mvts: [] };
        comptes[l.compte].debit += l.debit || 0;
        comptes[l.compte].credit += l.credit || 0;
        comptes[l.compte].mvts.push({
          date: e.date, piece: e.piece, journal: e.journal,
          libelle: l.libelle || e.libelle, debit: l.debit || 0, credit: l.credit || 0
        });
      });
    });
    return Object.entries(comptes)
      .map(([code, data]) => ({
        code, ...data,
        libelle: PLAN_COMPTABLE[code] || 'Compte inconnu',
        solde: data.debit - data.credit
      }))
      .filter(c => {
        if (search && !(`${c.code} ${c.libelle}`.toLowerCase().includes(search.toLowerCase()))) return false;
        return c.debit > 0 || c.credit > 0;
      })
      .sort((a, b) => a.code.localeCompare(b.code));
  }, [ecritures, dateDebut, dateFin, search]);

  const toggleExpand = (code: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Grand Livre</h1>
          <p className="text-xs text-gray-500 mt-1">Mouvements détaillés par compte</p>
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
          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
            <Search size={14} className="text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Compte ou libellé..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          </div>
          <button onClick={() => { setDateDebut(''); setDateFin(''); setSearch(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            ✕
          </button>
        </div>
      </Card>

      {comptesData.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-md border border-gray-200">
          <div className="text-3xl mb-2 opacity-20">⊞</div>
          <p className="text-sm">Aucun mouvement</p>
        </div>
      ) : (
        <div className="space-y-2">
          {comptesData.map(c => (
            <div key={c.code} className="rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
              <button onClick={() => toggleExpand(c.code)}
                className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-all"
                style={{ background: '#0a0b10' }}>
                {expanded.has(c.code) ? <ChevronDown size={16} className="text-white/40" />
                  : <ChevronRight size={16} className="text-white/40" />}
                <span className="font-mono text-amber-400 font-semibold text-sm min-w-[50px]">{c.code}</span>
                <span className="text-white/70 text-sm flex-1">{c.libelle}</span>
                <span className={`font-mono text-[10px] px-2 py-0.5 rounded font-semibold ${
                  c.solde > 0
                    ? 'bg-blue-100 text-blue-600' : c.solde < 0
                    ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-500'
                }`}>
                  {c.solde > 0 ? 'D' : c.solde < 0 ? 'C' : '—'} {formatFCFA(Math.abs(c.solde))}
                </span>
              </button>

              {expanded.has(c.code) && (
                <div className="overflow-x-auto">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="text-left" style={{ background: '#faf8f4' }}>
                        <th className="px-4 py-2 text-[7px] font-bold uppercase tracking-widest text-gray-400">Date</th>
                        <th className="px-4 py-2 text-[7px] font-bold uppercase tracking-widest text-gray-400">Pièce</th>
                        <th className="px-4 py-2 text-[7px] font-bold uppercase tracking-widest text-gray-400">Journal</th>
                        <th className="px-4 py-2 text-[7px] font-bold uppercase tracking-widest text-gray-400">Libellé</th>
                        <th className="px-4 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-gray-400">Débit</th>
                        <th className="px-4 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-gray-400">Crédit</th>
                      </tr>
                    </thead>
                    <tbody>
                      {c.mvts.map((m, i) => (
                        <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                          <td className="px-4 py-2 text-gray-600">{m.date}</td>
                          <td className="px-4 py-2 font-mono text-gray-500">{m.piece}</td>
                          <td className="px-4 py-2">
                            <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold"
                              style={{ background: 'rgba(212,168,83,0.1)', color: '#d4a853' }}>
                              {m.journal}
                            </span>
                          </td>
                          <td className="px-4 py-2 text-gray-700">{m.libelle}</td>
                          <td className="px-4 py-2 text-right font-mono text-blue-600">{m.debit > 0 ? formatFCFA(m.debit) : ''}</td>
                          <td className="px-4 py-2 text-right font-mono text-green-600">{m.credit > 0 ? formatFCFA(m.credit) : ''}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
