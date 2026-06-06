import { useState, useMemo } from 'react';
import { useStore } from '@/hooks';
import type { Facture, FactureLigne, FactureStatut, FactureType } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatFCFA } from '@/engine/validation';
import { Plus, Trash2, Eye, X } from 'lucide-react';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

const STATUS_LABELS: Record<FactureStatut, string> = {
  brouillon: 'Brouillon', envoyee: 'Envoyée', payee: 'Payée',
  partielle: 'Partielle', annulee: 'Annulée', retard: 'En retard'
};

const STATUS_COLORS: Record<FactureStatut, string> = {
  brouillon: 'bg-gray-100 text-gray-600',
  envoyee: 'bg-blue-100 text-blue-600',
  payee: 'bg-green-100 text-green-600',
  partielle: 'bg-amber-100 text-amber-600',
  annulee: 'bg-red-100 text-red-600',
  retard: 'bg-red-100 text-red-600',
};

export default function Factures() {
  const { factures, clients, addFacture, updateFacture, deleteFacture } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [statutFilter, setStatutFilter] = useState('');
  const [search, setSearch] = useState('');
  const [dateDebut, setDateDebut] = useState('');
  const [dateFin, setDateFin] = useState('');

  // Form state
  const [fType, setFType] = useState<FactureType>('facture');
  const [fDate, setFDate] = useState(new Date().toISOString().split('T')[0]);
  const [fEcheance, setFEcheance] = useState('');
  const [fClientId, setFClientId] = useState('');
  const [fLignes, setFLignes] = useState<FactureLigne[]>([
    { id: genId(), designation: '', quantite: 1, prixUnitaireHT: 0, remise: 0, tva: 18, totalHT: 0 }
  ]);
  const [fRemiseGlobale, setFRemiseGlobale] = useState(0);
  const [fModeReglement, setFModeReglement] = useState('virement');

  const filtered = useMemo(() => {
    return factures.filter(f => {
      if (statutFilter && f.statut !== statutFilter) return false;
      if (dateDebut && f.dateEmission < dateDebut) return false;
      if (dateFin && f.dateEmission > dateFin) return false;
      if (search) {
        const q = search.toLowerCase();
        return f.clientNom.toLowerCase().includes(q) || f.numero.toLowerCase().includes(q);
      }
      return true;
    }).sort((a, b) => b.dateEmission.localeCompare(a.dateEmission));
  }, [factures, statutFilter, dateDebut, dateFin, search]);

  const kpis = useMemo(() => ({
    total: factures.reduce((s, f) => s + f.totalTTC, 0),
    paye: factures.filter(f => f.statut === 'payee').reduce((s, f) => s + f.totalTTC, 0),
    attente: factures.filter(f => ['envoyee', 'partielle'].includes(f.statut)).reduce((s, f) => s + f.totalTTC, 0),
    retard: factures.filter(f => f.statut === 'retard').reduce((s, f) => s + f.totalTTC, 0),
    nb: factures.length
  }), [factures]);

  const totals = useMemo(() => {
    const subTotal = fLignes.reduce((s, l) => s + l.quantite * l.prixUnitaireHT * (1 - l.remise / 100), 0);
    const afterRemise = subTotal * (1 - fRemiseGlobale / 100);
    const totalTVA = fLignes.reduce((s, l) => {
      const lineTotal = l.quantite * l.prixUnitaireHT * (1 - l.remise / 100) * (1 - fRemiseGlobale / 100);
      return s + Math.round(lineTotal * l.tva / 100);
    }, 0);
    return { subTotal, afterRemise, totalTVA, ttc: afterRemise + totalTVA };
  }, [fLignes, fRemiseGlobale]);

  const addLigne = () => setFLignes(prev => [...prev, { id: genId(), designation: '', quantite: 1, prixUnitaireHT: 0, remise: 0, tva: 18, totalHT: 0 }]);
  const removeLigne = (id: string) => setFLignes(prev => prev.length > 1 ? prev.filter(l => l.id !== id) : prev);
  const updateLigne = (id: string, field: keyof FactureLigne, value: any) => {
    setFLignes(prev => prev.map(l => l.id === id ? { ...l, [field]: value } : l));
  };

  const handleSave = () => {
    const client = clients.find(c => c.id === fClientId);
    const newFacture: Facture = {
      id: editingFacture?.id || genId(),
      numero: editingFacture?.numero || `FAC-${String(factures.length + 1).padStart(4, '0')}`,
      type: fType,
      dateEmission: fDate,
      dateEcheance: fEcheance,
      clientId: fClientId,
      clientNom: client?.nom || 'Client divers',
      clientAdresse: client?.adresse || '',
      clientEmail: client?.email || '',
      clientTel: client?.telephone || '',
      reference: '',
      lignes: fLignes,
      sousTotalHT: totals.subTotal,
      remiseGlobale: fRemiseGlobale,
      totalTVA: totals.totalTVA,
      totalTTC: totals.ttc,
      modeReglement: fModeReglement,
      conditions: '30j',
      monnaie: 'FCFA',
      notes: '',
      statut: editingFacture?.statut || 'brouillon',
      paye: editingFacture?.paye || 0,
      createdAt: editingFacture?.createdAt || new Date().toISOString()
    };
    if (editingFacture) updateFacture(newFacture);
    else addFacture(newFacture);
    setShowModal(false);
    resetForm();
  };

  const resetForm = () => {
    setFType('facture');
    setFDate(new Date().toISOString().split('T')[0]);
    setFEcheance('');
    setFClientId('');
    setFLignes([{ id: genId(), designation: '', quantite: 1, prixUnitaireHT: 0, remise: 0, tva: 18, totalHT: 0 }]);
    setFRemiseGlobale(0);
    setFModeReglement('virement');
    setEditingFacture(null);
  };

  const openEdit = (f: Facture) => {
    setEditingFacture(f);
    setFType(f.type);
    setFDate(f.dateEmission);
    setFEcheance(f.dateEcheance);
    setFClientId(f.clientId);
    setFLignes(f.lignes);
    setFRemiseGlobale(f.remiseGlobale);
    setFModeReglement(f.modeReglement);
    setShowModal(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Factures</h1>
          <p className="text-xs text-gray-500 mt-1">Gestion complète des factures clients</p>
        </div>
        <Button onClick={() => { resetForm(); setShowModal(true); }} className="bg-gray-900 text-amber-400 hover:bg-gray-800">
          <Plus size={16} className="mr-1.5" /> Nouvelle facture
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: 'Total facturé', value: kpis.total, color: 'text-amber-600' },
          { label: 'Payé', value: kpis.paye, color: 'text-green-600' },
          { label: 'En attente', value: kpis.attente, color: 'text-blue-600' },
          { label: 'En retard', value: kpis.retard, color: 'text-red-600' },
          { label: 'Nb factures', value: kpis.nb, color: 'text-gray-700', isCount: true },
        ].map(kpi => (
          <Card key={kpi.label} className="relative overflow-hidden p-4">
            <div className="absolute top-0 left-0 right-0 h-0.5 bg-amber-400" />
            <div className="text-[9px] font-bold uppercase tracking-widest text-gray-500 mb-1">{kpi.label}</div>
            <div className={`font-mono text-lg ${kpi.color}`}>
              {kpi.isCount ? kpi.value : formatFCFA(kpi.value)}
            </div>
            <div className="text-[10px] text-gray-400 mt-0.5">{kpi.isCount ? 'factures' : 'FCFA TTC'}</div>
          </Card>
        ))}
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
          <select value={statutFilter} onChange={e => setStatutFilter(e.target.value)}
            className="bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400">
            <option value="">Tous les statuts</option>
            {Object.entries(STATUS_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <input type="text" value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Client, N° facture..."
            className="flex-1 min-w-[140px] bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
        </div>
      </Card>

      {/* Table */}
      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#0a0b10' }}>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">N°</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Date</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Client</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">HT</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">TVA</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">TTC</th>
              <th className="px-3 py-2.5 text-center text-[8px] font-bold uppercase tracking-widest text-amber-400">Statut</th>
              <th className="px-3 py-2.5 text-center text-[8px] font-bold uppercase tracking-widest text-amber-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-8 text-gray-400 text-sm">Aucune facture</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-amber-600 font-semibold">{f.numero}</td>
                <td className="px-3 py-2 text-gray-600">{f.dateEmission}</td>
                <td className="px-3 py-2 text-gray-700">{f.clientNom}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-600">{formatFCFA(f.sousTotalHT)}</td>
                <td className="px-3 py-2 text-right font-mono text-blue-600">{formatFCFA(f.totalTVA)}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900 font-semibold">{formatFCFA(f.totalTTC)}</td>
                <td className="px-3 py-2 text-center">
                  <span className={`px-2 py-0.5 rounded text-[9px] font-semibold ${STATUS_COLORS[f.statut]}`}>
                    {STATUS_LABELS[f.statut]}
                  </span>
                </td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-amber-600 p-1 transition-all">
                      <Eye size={14} />
                    </button>
                    <button onClick={() => deleteFacture(f.id)} className="text-gray-400 hover:text-red-600 p-1 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,11,16,0.7)' }}>
          <div className="bg-white rounded-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-serif text-lg font-bold text-gray-900">{editingFacture ? 'Modifier' : 'Nouvelle'} Facture</h2>
              <button onClick={() => { setShowModal(false); resetForm(); }} className="text-gray-400 hover:text-gray-600">
                <X size={20} />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Header */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Type</label>
                  <select value={fType} onChange={e => setFType(e.target.value as FactureType)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400">
                    <option value="facture">Facture</option>
                    <option value="proforma">Proforma</option>
                    <option value="avoir">Avoir</option>
                    <option value="acompte">Acompte</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Date émission</label>
                  <input type="date" value={fDate} onChange={e => setFDate(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Date échéance</label>
                  <input type="date" value={fEcheance} onChange={e => setFEcheance(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Mode de règlement</label>
                  <select value={fModeReglement} onChange={e => setFModeReglement(e.target.value)}
                    className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400">
                    <option value="virement">Virement bancaire</option>
                    <option value="cheque">Chèque</option>
                    <option value="especes">Espèces</option>
                    <option value="mobile">Mobile Money</option>
                    <option value="carte">Carte bancaire</option>
                  </select>
                </div>
              </div>

              {/* Lines */}
              <div className="text-[10px] font-bold uppercase tracking-widest text-gray-500 flex items-center gap-2">
                <div className="w-0.5 h-3.5 bg-amber-400 rounded" /> Lignes de facturation
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr style={{ background: '#0a0b10' }}>
                      <th className="px-3 py-2 text-left text-[7px] font-bold uppercase tracking-widest text-amber-400">Désignation</th>
                      <th className="px-3 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-amber-400 w-16">Qté</th>
                      <th className="px-3 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-amber-400 w-28">P.U. HT</th>
                      <th className="px-3 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-amber-400 w-16">Remise%</th>
                      <th className="px-3 py-2 text-right text-[7px] font-bold uppercase tracking-widest text-amber-400 w-16">TVA%</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {fLignes.map(l => (
                      <tr key={l.id} className="border-b border-gray-100">
                        <td className="px-2 py-1.5">
                          <input value={l.designation} onChange={e => updateLigne(l.id, 'designation', e.target.value)}
                            placeholder="Désignation..."
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs outline-none focus:border-amber-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.quantite} onChange={e => updateLigne(l.id, 'quantite', Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-right font-mono outline-none focus:border-amber-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.prixUnitaireHT || ''} onChange={e => updateLigne(l.id, 'prixUnitaireHT', Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-right font-mono outline-none focus:border-amber-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.remise || ''} onChange={e => updateLigne(l.id, 'remise', Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-right font-mono outline-none focus:border-amber-400" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.tva} onChange={e => updateLigne(l.id, 'tva', Number(e.target.value))}
                            className="w-full bg-gray-50 border border-gray-200 rounded px-2 py-1.5 text-xs text-right font-mono outline-none focus:border-amber-400" />
                        </td>
                        <td className="px-2 py-1.5 text-center">
                          <button onClick={() => removeLigne(l.id)} className="text-red-400 hover:text-red-600 p-1">
                            <Trash2 size={14} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <button onClick={addLigne}
                className="w-full flex items-center justify-center gap-2 py-2.5 border-2 border-dashed border-gray-300 rounded-md text-xs text-gray-500 hover:border-amber-400 hover:text-amber-600 transition-all">
                <Plus size={14} /> Ajouter une ligne
              </button>

              {/* Totals */}
              <div className="flex justify-end">
                <div className="rounded-lg p-4 min-w-[280px]" style={{ background: '#0a0b10' }}>
                  <div className="flex justify-between py-1 text-xs text-white/50 border-b border-white/5">
                    <span>Sous-total HT</span>
                    <span className="font-mono text-white/70">{formatFCFA(totals.subTotal)} FCFA</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-white/50 border-b border-white/5">
                    <span>Remise globale</span>
                    <span className="font-mono text-amber-400">{fRemiseGlobale}%</span>
                  </div>
                  <div className="flex justify-between py-1 text-xs text-white/50 border-b border-white/5">
                    <span>TVA</span>
                    <span className="font-mono text-blue-400">{formatFCFA(totals.totalTVA)} FCFA</span>
                  </div>
                  <div className="flex justify-between pt-2 text-base font-bold text-amber-400">
                    <span>TOTAL TTC</span>
                    <span className="font-mono">{formatFCFA(totals.ttc)} FCFA</span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-2 justify-end pt-2">
                <button onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 rounded text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">
                  Annuler
                </button>
                <button onClick={handleSave}
                  className="px-5 py-2 rounded text-sm font-semibold text-white transition-all hover:-translate-y-0.5"
                  style={{ background: 'linear-gradient(135deg, #d4a853, #b8912e)' }}>
                  {editingFacture ? 'Modifier' : 'Enregistrer'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
