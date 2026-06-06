import { useState } from 'react';
import { useStore } from '@/hooks';
import { useNavigate } from './AppRouter';
import { formatShort } from '@/engine/validation';
import ComeoAI from './ComeoAI';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PenLine, BookOpen, TrendingUp, AlertCircle } from 'lucide-react';

export default function Dashboard() {
  const { stats, ecritures } = useStore();
  const { navigate } = useNavigate();
  const [showAI, setShowAI] = useState(false);

  const recentOps = [...ecritures].reverse().slice(0, 5);

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Tableau de bord</h1>
          <p className="text-xs text-gray-500 mt-1">SYSCOHADA Révisé 2023 — Assistant comptable expert</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => navigate('saisie')}
            className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold text-amber-400 transition-all hover:-translate-y-0.5"
            style={{ background: '#0a0b10' }}>
            <PenLine size={16} /> ✎ Nouvelle écriture
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        <Card className="relative overflow-hidden border-amber-200/60">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
          <CardContent className="pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Écritures</div>
            <div className="font-mono text-xl text-gray-900">{stats.nbEcritures}</div>
            <div className="text-[10px] text-gray-400 mt-1">Exercice en cours</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-amber-200/60">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-blue-500" />
          <CardContent className="pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Total débit</div>
            <div className="font-mono text-xl text-blue-600">{formatShort(stats.totalDebit)}</div>
            <div className="text-[10px] text-gray-400 mt-1">FCFA</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-amber-200/60">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-green-500" />
          <CardContent className="pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Total crédit</div>
            <div className="font-mono text-xl text-green-600">{formatShort(stats.totalCredit)}</div>
            <div className="text-[10px] text-gray-400 mt-1">FCFA</div>
          </CardContent>
        </Card>
        <Card className="relative overflow-hidden border-amber-200/60">
          <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
          <CardContent className="pt-5 pb-4">
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1.5">Résultat provisoire</div>
            <div className={`font-mono text-xl ${stats.resultat >= 0 ? 'text-amber-600' : 'text-red-600'}`}>
              {formatShort(stats.resultat)}
            </div>
            <div className="text-[10px] text-gray-400 mt-1">Produits – Charges</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* COMEO AI Box */}
        <div className="lg:col-span-2">
          <div className="rounded-md border border-gray-200 overflow-hidden bg-white shadow-sm">
            <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-gray-200"
              style={{ background: '#0a0b10' }}>
              <div className="w-2 h-2 rounded-full bg-amber-400" style={{ boxShadow: '0 0 8px #d4a853' }} />
              <span className="font-serif text-sm font-bold text-amber-400 tracking-wider">COMEO AI v5</span>
              <span className="ml-auto text-[9px] font-mono text-white/20 tracking-widest">
                Expert Comptable SYSCOHADA
              </span>
            </div>
            <div className="p-5">
              <p className="text-sm text-gray-600 mb-4 leading-relaxed">
                Je suis <strong className="text-gray-900">COMEO AI v5</strong>, votre expert-comptable SYSCOHADA.
                Décrivez une opération en langage naturel et je prépare les écritures comptables conformément au
                plan comptable SYSCOHADA révisé. Chaque écriture est validée par le moteur de contrôle comptable
                avant enregistrement.
              </p>
              <div className="flex flex-wrap gap-2">
                <button onClick={() => setShowAI(true)}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold transition-all hover:-translate-y-0.5"
                  style={{ background: '#0a0b10', color: '#d4a853' }}>
                  <BookOpen size={16} /> Assistant IA
                </button>
                <button onClick={() => navigate('saisie')}
                  className="flex items-center gap-2 px-4 py-2 rounded text-sm font-semibold border transition-all hover:bg-gray-900 hover:text-amber-400">
                  <PenLine size={16} /> Saisie manuelle
                </button>
              </div>
            </div>
          </div>

          {/* Recent operations */}
          <div className="mt-5">
            <h2 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-3 flex items-center gap-2">
              <TrendingUp size={14} /> Opérations récentes
            </h2>
            {recentOps.length === 0 ? (
              <div className="text-center py-10 text-gray-400 bg-white rounded-md border border-gray-200">
                <AlertCircle size={32} className="mx-auto mb-2 opacity-20" />
                <p className="text-sm">Aucune opération enregistrée</p>
              </div>
            ) : (
              <div className="space-y-2">
                {recentOps.map(e => (
                  <div key={e.id} className="flex items-center justify-between p-3 bg-white rounded-md border border-gray-200 hover:border-amber-300 transition-all">
                    <div className="flex items-center gap-3">
                      <span className="px-2 py-0.5 rounded text-[9px] font-mono font-bold"
                        style={{
                          background: e.journal === 'AC' ? 'rgba(59,130,246,0.1)' :
                            e.journal === 'VE' ? 'rgba(34,197,94,0.1)' :
                            e.journal === 'BQ' ? 'rgba(139,92,246,0.1)' :
                            e.journal === 'CA' ? 'rgba(245,158,11,0.1)' :
                            'rgba(107,114,128,0.1)',
                          color: e.journal === 'AC' ? '#3b82f6' :
                            e.journal === 'VE' ? '#22c55e' :
                            e.journal === 'BQ' ? '#8b5cf6' :
                            e.journal === 'CA' ? '#f59e0b' : '#6b7280',
                          border: `1px solid ${e.journal === 'AC' ? 'rgba(59,130,246,0.25)' :
                            e.journal === 'VE' ? 'rgba(34,197,94,0.25)' :
                            e.journal === 'BQ' ? 'rgba(139,92,246,0.25)' :
                            e.journal === 'CA' ? 'rgba(245,158,11,0.25)' : 'rgba(107,114,128,0.25)'}`
                        }}>
                        {e.journal}
                      </span>
                      <div>
                        <div className="text-xs font-medium text-gray-900">{e.libelle}</div>
                        <div className="text-[10px] text-gray-500">{e.date} · {e.piece}</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-mono text-xs text-blue-600">
                        D: {e.lignes.reduce((s, l) => s + (l.debit || 0), 0).toLocaleString('fr-FR')}
                      </div>
                      <div className="font-mono text-xs text-green-600">
                        C: {e.lignes.reduce((s, l) => s + (l.credit || 0), 0).toLocaleString('fr-FR')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right column */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-gray-500">
                Raccourcis rapides
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {[
                { label: 'Nouvelle écriture', action: () => navigate('saisie') },
                { label: 'Journal général', action: () => navigate('journal') },
                { label: 'Balance générale', action: () => navigate('balance') },
                { label: 'Bilan', action: () => navigate('bilan') },
                { label: 'Nouvelle facture', action: () => navigate('factures') },
              ].map(item => (
                <button key={item.label} onClick={item.action}
                  className="w-full text-left px-3 py-2 rounded text-xs text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all border border-gray-100 hover:border-amber-200">
                  {item.label}
                </button>
              ))}
            </CardContent>
          </Card>

          <Card className="border-amber-200/60">
            <CardHeader className="pb-3">
              <CardTitle className="text-xs font-bold uppercase tracking-widest text-amber-600">
                TVA Côte d'Ivoire
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2 text-xs text-gray-600">
              <div className="flex justify-between">
                <span>Taux standard</span>
                <span className="font-mono font-semibold text-gray-900">18%</span>
              </div>
              <div className="flex justify-between">
                <span>Taux réduit</span>
                <span className="font-mono font-semibold text-gray-900">9%</span>
              </div>
              <div className="flex justify-between">
                <span>Export</span>
                <span className="font-mono font-semibold text-gray-900">Exonéré</span>
              </div>
              <div className="pt-2 border-t border-gray-100 text-[10px] text-gray-400">
                Tolérance d'arrondi: 1 FCFA
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* AI Modal */}
      {showAI && <ComeoAI onClose={() => setShowAI(false)} />}
    </div>
  );
}
