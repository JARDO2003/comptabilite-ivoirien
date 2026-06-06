import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import { JOURNAL_NAMES, JOURNAL_ICONS } from '@/data/planComptable';
import { getLibelleCompte } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { Trash2, Search } from 'lucide-react';

export default function Journal() {
  const { ecritures, deleteEcriture, deleteGroupe } = useStore();
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');
  const [journalFilter, setJournalFilter] = useState('');
  const [search, setSearch] = useState('');

  const filtered = useMemo(() => {
    return ecritures.filter(e => {
      if (dateDebut && e.date < dateDebut) return false;
      if (dateFin && e.date > dateFin) return false;
      if (journalFilter && e.journal !== journalFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        return e.libelle.toLowerCase().includes(q) ||
          e.lignes.some(l => (l.compte + getLibelleCompte(l.compte)).toLowerCase().includes(q));
      }
      return true;
    }).sort((a, b) => a.date.localeCompare(b.date));
  }, [ecritures, dateDebut, dateFin, journalFilter, search]);

  // Group by date then by groupId
  const grouped = useMemo(() => {
    const byDate: Record<string, typeof filtered> = {};
    filtered.forEach(e => {
      if (!byDate[e.date]) byDate[e.date] = [];
      byDate[e.date].push(e);
    });
    return byDate;
  }, [filtered]);

  const totals = useMemo(() => {
    let td = 0, tc = 0;
    filtered.forEach(e => e.lignes.forEach(l => { td += l.debit; tc += l.credit; }));
    return { td, tc };
  }, [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Journal général</h1>
          <p className="text-xs text-gray-500 mt-1">Opérations regroupées par date</p>
        </div>
      </div>

      {/* Filters */}
      <Card className="p-3">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Du</span>
          <input type="date" value={dateDebut} onChange={e => setDateDebut(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Au</span>
          <input type="date" value={dateFin} onChange={e => setDateFin(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Journal</span>
          <select value={journalFilter} onChange={e => setJournalFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400">
            <option value="">Tous</option>
            {Object.entries(JOURNAL_NAMES).map(([code, name]) => (
              <option key={code} value={code}>{code} — {name}</option>
            ))}
          </select>
          <div className="flex items-center gap-1 flex-1 min-w-[140px]">
            <Search size={14} className="text-gray-400" />
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Rechercher..." className="flex-1 bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          </div>
          <button onClick={() => { setDateDebut(''); setDateFin(''); setJournalFilter(''); setSearch(''); }}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            ✕ Effacer
          </button>
        </div>
      </Card>

      {/* Content */}
      {Object.keys(grouped).length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-md border border-gray-200">
          <div className="text-3xl mb-2 opacity-20">≡</div>
          <p className="text-sm">Aucune écriture</p>
        </div>
      ) : (
        <div className="space-y-4">
          {Object.entries(grouped).map(([date, ecrs]) => (
            <div key={date}>
              {/* Date separator */}
              <div className="flex items-center gap-3 mb-2">
                <div className="flex-1 h-px bg-gray-300" />
                <span className="text-[10px] font-mono font-bold text-gray-500 uppercase tracking-wider">
                  {new Date(date).toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                </span>
                <div className="flex-1 h-px bg-gray-300" />
              </div>

              <div className="space-y-3">
                {ecrs.map(e => (
                  <div key={e.id} className="rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
                    {/* Operation header */}
                    <div className="px-4 py-3 flex items-center gap-3 flex-wrap"
                      style={{ background: '#0a0b10', borderBottom: '2px solid rgba(212,168,83,0.3)' }}>
                      <div className="w-8 h-8 rounded-md flex items-center justify-center text-sm"
                        style={{ background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.2)' }}>
                        {JOURNAL_ICONS[e.journal] || '📋'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-sm font-bold text-white/90 truncate max-w-md font-serif">{e.libelle}</div>
                        <div className="text-[9px] font-mono text-white/30 tracking-wider mt-0.5">
                          {e.piece} · {e.date}
                        </div>
                      </div>
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold tracking-wider"
                        style={{
                          background: e.journal === 'AC' ? 'rgba(59,130,246,0.15)' :
                            e.journal === 'VE' ? 'rgba(34,197,94,0.15)' :
                            e.journal === 'BQ' ? 'rgba(139,92,246,0.15)' :
                            e.journal === 'CA' ? 'rgba(245,158,11,0.15)' :
                            'rgba(212,168,83,0.12)',
                          color: e.journal === 'AC' ? '#60a5fa' :
                            e.journal === 'VE' ? '#4ade80' :
                            e.journal === 'BQ' ? '#c4b5fd' :
                            e.journal === 'CA' ? '#fde047' : '#d4a853',
                          border: `1px solid ${e.journal === 'AC' ? 'rgba(59,130,246,0.25)' :
                            e.journal === 'VE' ? 'rgba(34,197,94,0.25)' :
                            e.journal === 'BQ' ? 'rgba(139,92,246,0.25)' :
                            e.journal === 'CA' ? 'rgba(245,158,11,0.25)' : 'rgba(212,168,83,0.2)'}`
                        }}>
                        {e.journal}
                      </span>
                      <div className="text-right">
                        <div className="font-mono text-sm font-semibold text-amber-400">
                          {(e.lignes.reduce((s, l) => s + l.debit, 0)).toLocaleString('fr-FR')} FCFA
                        </div>
                      </div>
                      <button onClick={() => e.groupId ? deleteGroupe(e.groupId) : deleteEcriture(e.id)}
                        className="text-red-400/30 hover:text-red-400 hover:bg-red-500/10 p-1 rounded transition-all">
                        <Trash2 size={13} />
                      </button>
                    </div>

                    {/* Lines */}
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="text-left" style={{ background: '#faf8f4' }}>
                            <th className="px-4 py-1.5 text-[7px] font-bold uppercase tracking-widest text-gray-400">Compte</th>
                            <th className="px-4 py-1.5 text-[7px] font-bold uppercase tracking-widest text-gray-400">Libellé</th>
                            <th className="px-4 py-1.5 text-[7px] font-bold uppercase tracking-widest text-gray-400 text-right">Débit</th>
                            <th className="px-4 py-1.5 text-[7px] font-bold uppercase tracking-widest text-gray-400 text-right">Crédit</th>
                          </tr>
                        </thead>
                        <tbody>
                          {e.lignes.map((l, i) => (
                            <tr key={i} className="border-b border-gray-100 hover:bg-gray-50">
                              <td className="px-4 py-2">
                                <span className="inline-flex items-center gap-1">
                                  <span className="font-mono text-[10px] font-semibold text-amber-600 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                                    {l.compte}
                                  </span>
                                  <span className="text-[9px] text-gray-400 truncate max-w-[100px]">
                                    {getLibelleCompte(l.compte)}
                                  </span>
                                </span>
                              </td>
                              <td className="px-4 py-2 text-gray-700">{l.libelle}</td>
                              <td className="px-4 py-2 text-right font-mono text-blue-600 font-semibold">
                                {l.debit > 0 ? l.debit.toLocaleString('fr-FR') : ''}
                              </td>
                              <td className="px-4 py-2 text-right font-mono text-green-600 font-semibold">
                                {l.credit > 0 ? l.credit.toLocaleString('fr-FR') : ''}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}

          {/* Footer totals */}
          <div className="flex flex-wrap items-center justify-end gap-5 p-4 rounded-md"
            style={{ background: '#0a0b10' }}>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Opérations</span>
              <span className="font-mono text-sm text-amber-400 font-semibold">{filtered.length}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Total Débit</span>
              <span className="font-mono text-sm text-blue-400 font-semibold">{totals.td.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-[8px] font-mono font-bold uppercase tracking-widest text-white/30">Total Crédit</span>
              <span className="font-mono text-sm text-green-400 font-semibold">{totals.tc.toLocaleString('fr-FR')}</span>
            </div>
            <span className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded ${
              Math.abs(totals.td - totals.tc) < 1
                ? 'text-green-400 bg-green-400/10 border border-green-400/20'
                : 'text-red-400 bg-red-400/10 border border-red-400/20'
            }`}>
              {Math.abs(totals.td - totals.tc) < 1 ? '✓ Équilibré' : '✗ Non équilibré'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
