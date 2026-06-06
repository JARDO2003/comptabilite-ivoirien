import { useMemo } from 'react';
import { useStore } from '@/hooks';
import { PLAN_COMPTABLE } from '@/data/planComptable';
import { Card } from '@/components/ui/card';
import { formatFCFA } from '@/engine/validation';

export default function Resultat() {
  const { ecritures } = useStore();

  const data = useMemo(() => {
    const comptes: Record<string, number> = {};
    ecritures.forEach(e => {
      e.lignes.forEach(l => {
        const c = l.compte[0];
        if (c === '6' || c === '7') {
          if (!comptes[l.compte]) comptes[l.compte] = 0;
          comptes[l.compte] += (l.credit || 0) - (l.debit || 0);
        }
      });
    });

    const charges = Object.entries(comptes).filter(([c]) => c[0] === '6').map(([code, val]) => ({
      code, libelle: PLAN_COMPTABLE[code] || code, value: Math.abs(val < 0 ? val : 0)
    })).filter(c => c.value > 0);

    const produits = Object.entries(comptes).filter(([c]) => c[0] === '7').map(([code, val]) => ({
      code, libelle: PLAN_COMPTABLE[code] || code, value: Math.abs(val > 0 ? val : 0)
    })).filter(p => p.value > 0);

    const totalCharges = charges.reduce((s, c) => s + c.value, 0);
    const totalProduits = produits.reduce((s, p) => s + p.value, 0);
    const resultat = totalProduits - totalCharges;

    return { charges, produits, totalCharges, totalProduits, resultat };
  }, [ecritures]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Compte de résultat</h1>
          <p className="text-xs text-gray-500 mt-1">Exercice en cours</p>
        </div>
      </div>

      {ecritures.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-md border border-gray-200">
          <div className="text-3xl mb-2 opacity-20">↗</div>
          <p className="text-sm">Aucune donnée</p>
        </div>
      ) : (
        <div className="space-y-4">
          <Card className="p-0 overflow-hidden">
            {/* PRODUITS */}
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-400"
              style={{ background: '#0a0b10' }}>
              PRODUITS (Classe 7)
            </div>
            <div className="divide-y divide-gray-100">
              {data.produits.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">Aucun produit</div>
              ) : data.produits.map(p => (
                <div key={p.code} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-amber-600">{p.code}</span>
                    <span className="text-xs text-gray-700">{p.libelle}</span>
                  </div>
                  <span className="font-mono text-xs text-green-600">{formatFCFA(p.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-2.5 font-bold bg-gray-50"
                style={{ borderTop: '2px solid #d0c8b4' }}>
                <span className="text-xs uppercase tracking-wider text-gray-700">Total Produits</span>
                <span className="font-mono text-sm text-gray-900">{formatFCFA(data.totalProduits)}</span>
              </div>
            </div>

            {/* CHARGES */}
            <div className="px-4 py-2.5 text-xs font-bold uppercase tracking-widest text-amber-400"
              style={{ background: '#0a0b10', borderTop: '2px solid #d4a853' }}>
              CHARGES (Classe 6)
            </div>
            <div className="divide-y divide-gray-100">
              {data.charges.length === 0 ? (
                <div className="px-4 py-3 text-sm text-gray-400">Aucune charge</div>
              ) : data.charges.map(c => (
                <div key={c.code} className="flex justify-between items-center px-4 py-2 hover:bg-gray-50">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[9px] text-amber-600">{c.code}</span>
                    <span className="text-xs text-gray-700">{c.libelle}</span>
                  </div>
                  <span className="font-mono text-xs text-red-500">{formatFCFA(c.value)}</span>
                </div>
              ))}
              <div className="flex justify-between items-center px-4 py-2.5 font-bold bg-gray-50"
                style={{ borderTop: '2px solid #d0c8b4' }}>
                <span className="text-xs uppercase tracking-wider text-gray-700">Total Charges</span>
                <span className="font-mono text-sm text-gray-900">{formatFCFA(data.totalCharges)}</span>
              </div>
            </div>

            {/* RÉSULTAT */}
            <div className="flex justify-between items-center px-4 py-4 font-bold"
              style={{ background: '#0a0b10', border: '1.5px solid #d4a853' }}>
              <span className="font-serif text-sm tracking-wide"
                style={{ color: data.resultat >= 0 ? '#4ade80' : '#f87171' }}>
                RÉSULTAT {data.resultat >= 0 ? 'BÉNÉFICE' : 'PERTE'}
              </span>
              <span className="font-mono text-lg font-semibold"
                style={{ color: data.resultat >= 0 ? '#4ade80' : '#f87171' }}>
                {formatFCFA(Math.abs(data.resultat))}
              </span>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
