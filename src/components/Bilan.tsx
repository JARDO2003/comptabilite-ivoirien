import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import { Card } from '@/components/ui/card';
import { formatFCFA } from '@/engine/validation';

export default function Bilan() {
  const { ecritures } = useStore();
  const [dateArrete, setDateArrete] = useState('');

  const bilan = useMemo(() => {
    const actif: Array<{ label: string; amount: number; code: string }> = [];
    const passif: Array<{ label: string; amount: number; code: string }> = [];

    const comptes: Record<string, number> = {};
    ecritures.forEach(e => {
      if (dateArrete && e.date > dateArrete) return;
      e.lignes.forEach(l => {
        if (!comptes[l.compte]) comptes[l.compte] = 0;
        comptes[l.compte] += (l.debit || 0) - (l.credit || 0);
      });
    });

    // Actif: Classes 2, 3, 4D, 5D
    const actifSections = [
      { title: 'ACTIF IMMOBILISÉ', codes: ['21', '22', '23', '24', '25', '26', '27', '28', '29'] },
      { title: 'ACTIF CIRCULANT', codes: ['31', '32', '33', '34', '35', '36', '37', '38', '39'] },
      { title: 'CRÉANCES', codes: ['41', '42', '43', '44', '45', '46', '47', '48', '49'] },
      { title: 'TRÉSORERIE ACTIF', codes: ['50', '51', '52', '53', '54', '55', '56', '57', '58', '59'] },
    ];

    const passifSections = [
      { title: 'CAPITAUX PROPRES', codes: ['10', '11', '12', '13', '14', '15'] },
      { title: 'DETTES FINANCIÈRES', codes: ['16', '17'] },
      { title: 'DETTES CIRCULANTES', codes: ['40', '41C', '42', '43', '44', '45', '46', '47', '48', '49'] },
      { title: 'TRÉSORERIE PASSIF', codes: ['50P', '51P', '52P', '53P', '54P', '55P', '56P', '57P', '58P', '59P'] },
    ];

    let totalActif = 0;
    let totalPassif = 0;

    actifSections.forEach(sec => {
      let secTotal = 0;
      Object.entries(comptes).forEach(([code, solde]) => {
        if (sec.codes.some(p => code.startsWith(p)) && solde > 0) {
          actif.push({ label: code, amount: solde, code });
          secTotal += solde;
        }
      });
      if (secTotal > 0) totalActif += secTotal;
    });

    passifSections.forEach(sec => {
      let secTotal = 0;
      Object.entries(comptes).forEach(([code, solde]) => {
        if (sec.codes.some(p => code.startsWith(p)) && solde < 0) {
          passif.push({ label: code, amount: -solde, code });
          secTotal += -solde;
        }
      });
      if (secTotal > 0) totalPassif += secTotal;
    });

    // Si pas assez de données, montrer un exemple structuré
    if (totalActif === 0 && totalPassif === 0 && ecritures.length > 0) {
      return { actif: [], passif: [], totalActif: 0, totalPassif: 0, empty: true };
    }

    return { actif, passif, totalActif, totalPassif, empty: false };
  }, [ecritures, dateArrete]);

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Bilan</h1>
          <p className="text-xs text-gray-500 mt-1">
            Situation au {dateArrete || new Date().toLocaleDateString('fr-FR')}
          </p>
        </div>
      </div>

      <Card className="p-3">
        <div className="flex items-center gap-3">
          <span className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Arrêté au</span>
          <input type="date" value={dateArrete} onChange={e => setDateArrete(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
          <button onClick={() => setDateArrete('')}
            className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1 border border-gray-200 rounded hover:border-gray-300 transition-all">
            Tout l'exercice
          </button>
        </div>
      </Card>

      {ecritures.length === 0 ? (
        <div className="text-center py-12 text-gray-400 bg-white rounded-md border border-gray-200">
          <div className="text-3xl mb-2 opacity-20">⊠</div>
          <p className="text-sm">Saisissez des écritures pour générer le bilan</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* ACTIF */}
          <div className="rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b-2 border-blue-400" style={{ background: '#0a0b10' }}>
              <span className="font-serif text-base font-bold text-blue-400 tracking-wide">ACTIF</span>
            </div>
            <div className="p-4">
              {bilan.actif.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun actif</p>
              ) : (
                <div className="space-y-1">
                  {bilan.actif.map(item => (
                    <div key={item.code} className="flex justify-between items-center py-1 border-b border-dotted border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-amber-600 font-semibold min-w-[34px]">{item.code}</span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold">{formatFCFA(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex justify-between font-mono font-semibold text-sm"
              style={{ background: '#0a0b10', color: '#d4a853' }}>
              <span>TOTAL ACTIF</span>
              <span>{formatFCFA(bilan.totalActif)}</span>
            </div>
          </div>

          {/* PASSIF */}
          <div className="rounded-md overflow-hidden border border-gray-200 bg-white shadow-sm">
            <div className="px-4 py-3 border-b-2 border-green-400" style={{ background: '#0a0b10' }}>
              <span className="font-serif text-base font-bold text-green-400 tracking-wide">PASSIF</span>
            </div>
            <div className="p-4">
              {bilan.passif.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">Aucun passif</p>
              ) : (
                <div className="space-y-1">
                  {bilan.passif.map(item => (
                    <div key={item.code} className="flex justify-between items-center py-1 border-b border-dotted border-gray-200">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[9px] text-amber-600 font-semibold min-w-[34px]">{item.code}</span>
                      </div>
                      <span className="font-mono text-[10px] font-semibold">{formatFCFA(item.amount)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="px-4 py-3 flex justify-between font-mono font-semibold text-sm"
              style={{ background: '#0a0b10', color: '#d4a853' }}>
              <span>TOTAL PASSIF</span>
              <span>{formatFCFA(bilan.totalPassif)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
