import { useMemo } from 'react';
import { useStore } from '@/hooks';
import { Button } from '@/components/ui/button';
import { formatFCFA } from '@/engine/validation';
import { Plus } from 'lucide-react';

export default function Devis() {
  const { factures } = useStore();

  const devisList = useMemo(() =>
    factures.filter(f => f.type === 'proforma')
      .sort((a, b) => b.dateEmission.localeCompare(a.dateEmission)),
  [factures]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Devis & Proformas</h1>
          <p className="text-xs text-gray-500 mt-1">Gérez vos devis et convertissez-les en factures</p>
        </div>
        <Button className="bg-gray-900 text-amber-400 hover:bg-gray-800" onClick={() => {}}>
          <Plus size={16} className="mr-1.5" /> Nouveau devis
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#0a0b10' }}>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">N° Devis</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Date</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Client</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Montant TTC</th>
              <th className="px-3 py-2.5 text-center text-[8px] font-bold uppercase tracking-widest text-amber-400">Statut</th>
            </tr>
          </thead>
          <tbody>
            {devisList.length === 0 ? (
              <tr><td colSpan={5} className="text-center py-8 text-gray-400 text-sm">Aucun devis</td></tr>
            ) : devisList.map(d => (
              <tr key={d.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-amber-600">{d.numero}</td>
                <td className="px-3 py-2 text-gray-600">{d.dateEmission}</td>
                <td className="px-3 py-2 text-gray-900">{d.clientNom}</td>
                <td className="px-3 py-2 text-right font-mono font-semibold">{formatFCFA(d.totalTTC)}</td>
                <td className="px-3 py-2 text-center">
                  <span className="px-2 py-0.5 rounded text-[9px] font-semibold bg-gray-100 text-gray-600">
                    {d.statut === 'brouillon' ? 'Brouillon' : d.statut}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
