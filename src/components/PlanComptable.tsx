import { useState, useMemo } from 'react';
import { PLAN_COMPTABLE, CLASS_NAMES } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { Search } from 'lucide-react';

export default function PlanComptableView() {
  const [search, setSearch] = useState('');
  const [classeFilter, setClasseFilter] = useState('');

  const entries = useMemo(() => {
    return Object.entries(PLAN_COMPTABLE)
      .filter(([code, libelle]) => {
        if (classeFilter && !code.startsWith(classeFilter)) return false;
        if (search) {
          const q = search.toLowerCase();
          return code.includes(q) || libelle.toLowerCase().includes(q);
        }
        return true;
      })
      .sort((a, b) => a[0].localeCompare(b[0]));
  }, [search, classeFilter]);

  const grouped = useMemo(() => {
    const g: Record<string, typeof entries> = {};
    entries.forEach(([code, lib]) => {
      const c = code[0] || '?';
      if (!g[c]) g[c] = [];
      g[c].push([code, lib]);
    });
    return g;
  }, [entries]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Plan Comptable SYSCOHADA</h1>
          <p className="text-xs text-gray-500 mt-1">Révisé 2023 — {Object.keys(PLAN_COMPTABLE).length} comptes</p>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <div className="flex items-center gap-1 flex-1 min-w-[200px]">
            <Search size={14} className="text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Code ou libellé..."
              className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          </div>
          <select value={classeFilter} onChange={e => setClasseFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400 min-w-[140px]">
            <option value="">Toutes les classes</option>
            {Object.entries(CLASS_NAMES).map(([num, name]) => (
              <option key={num} value={num}>Classe {num} — {name}</option>
            ))}
          </select>
          <button onClick={() => { setSearch(''); setClasseFilter(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            ✕
          </button>
        </div>
      </Card>

      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#0a0b10' }}>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400 w-20">Code</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Libellé</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400 w-24">Classe</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400 w-20">Nature</th>
            </tr>
          </thead>
          <tbody>
            {Object.entries(grouped).map(([classeNum, items]) => (
              items.map(([code, libelle], idx) => (
                <tr key={code} className="border-b border-gray-100 hover:bg-amber-50/30 transition-all">
                  {idx === 0 && (
                    <td colSpan={4} className="px-3 py-1.5 bg-gray-50">
                      <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">
                        Classe {classeNum} — {CLASS_NAMES[classeNum] || ''}
                      </span>
                    </td>
                  )}
                  {idx !== 0 && (
                    <>
                      <td className="px-3 py-1.5 font-mono text-amber-600 font-semibold">{code}</td>
                      <td className="px-3 py-1.5 text-gray-700">{libelle}</td>
                      <td className="px-3 py-1.5 text-gray-500">{classeNum}</td>
                      <td className="px-3 py-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[8px] font-mono font-bold"
                          style={{
                            background: classeNum === '1' ? 'rgba(74,222,128,0.1)' :
                              classeNum === '2' ? 'rgba(96,165,250,0.1)' :
                              classeNum === '3' ? 'rgba(139,92,246,0.1)' :
                              classeNum === '4' ? 'rgba(245,158,11,0.1)' :
                              classeNum === '5' ? 'rgba(20,184,166,0.1)' :
                              classeNum === '6' ? 'rgba(248,113,113,0.1)' :
                              classeNum === '7' ? 'rgba(34,197,94,0.1)' :
                              'rgba(107,114,128,0.1)',
                            color: classeNum === '1' ? '#4ade80' :
                              classeNum === '2' ? '#60a5fa' :
                              classeNum === '3' ? '#8b5cf6' :
                              classeNum === '4' ? '#f59e0b' :
                              classeNum === '5' ? '#14b8a6' :
                              classeNum === '6' ? '#f87171' :
                              classeNum === '7' ? '#22c55e' :
                              '#6b7280'
                          }}>
                          {classeNum === '1' ? 'Passif' :
                            classeNum === '2' ? 'Actif' :
                            classeNum === '3' ? 'Actif' :
                            classeNum === '4' ? 'Mixte' :
                            classeNum === '5' ? 'Actif' :
                            classeNum === '6' ? 'Charge' :
                            classeNum === '7' ? 'Produit' : 'Spécial'}
                        </span>
                      </td>
                    </>
                  )}
                </tr>
              ))
            ))}
          </tbody>
        </table>
      </div>

      <div className="text-center text-xs text-gray-400 py-2">
        {entries.length} compte(s) affiché(s) sur {Object.keys(PLAN_COMPTABLE).length}
      </div>
    </div>
  );
}
