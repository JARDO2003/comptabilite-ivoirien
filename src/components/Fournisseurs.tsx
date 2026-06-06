import { useState } from 'react';
import { useStore } from '@/hooks';
import type { Fournisseur } from '@/types';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Plus, Trash2, Pencil, X, CheckCircle } from 'lucide-react';

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

export default function FournisseursView() {
  const { fournisseurs, addFournisseur, updateFournisseur, deleteFournisseur } = useStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Fournisseur | null>(null);
  const [search, setSearch] = useState('');
  const [nom, setNom] = useState('');
  const [tel, setTel] = useState('');
  const [email, setEmail] = useState('');
  const [adresse, setAdresse] = useState('');
  const [ville, setVille] = useState('');
  const [nif, setNif] = useState('');

  const filtered = fournisseurs.filter(f =>
    !search || f.nom.toLowerCase().includes(search.toLowerCase()) ||
    f.email.toLowerCase().includes(search.toLowerCase()) ||
    f.telephone.includes(search)
  );

  const openNew = () => {
    setEditing(null);
    setNom(''); setTel(''); setEmail(''); setAdresse(''); setVille(''); setNif('');
    setShowModal(true);
  };

  const openEdit = (f: Fournisseur) => {
    setEditing(f);
    setNom(f.nom); setTel(f.telephone); setEmail(f.email);
    setAdresse(f.adresse); setVille(f.ville); setNif(f.nif);
    setShowModal(true);
  };

  const handleSave = () => {
    if (!nom.trim()) return;
    const fourn: Fournisseur = {
      id: editing?.id || genId(),
      code: editing?.code || `FRN-${String(fournisseurs.length + 1).padStart(3, '0')}`,
      nom, telephone: tel, email, adresse, ville, nif, notes: '',
      totalAchats: editing?.totalAchats || 0, soldeDu: editing?.soldeDu || 0
    };
    if (editing) updateFournisseur(fourn); else addFournisseur(fourn);
    setShowModal(false);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="font-serif text-2xl font-bold text-gray-900">Fournisseurs</h1>
          <p className="text-xs text-gray-500 mt-1">Répertoire et suivi des fournisseurs</p>
        </div>
        <Button onClick={openNew} className="bg-gray-900 text-amber-400 hover:bg-gray-800">
          <Plus size={16} className="mr-1.5" /> Nouveau fournisseur
        </Button>
      </div>

      <Card className="p-3">
        <input type="text" value={search} onChange={e => setSearch(e.target.value)}
          placeholder="Nom, email, téléphone..."
          className="w-full bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
      </Card>

      <div className="overflow-x-auto rounded-md border border-gray-200 shadow-sm">
        <table className="w-full text-xs">
          <thead>
            <tr style={{ background: '#0a0b10' }}>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Code</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Nom</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Téléphone</th>
              <th className="px-3 py-2.5 text-left text-[8px] font-bold uppercase tracking-widest text-amber-400">Email</th>
              <th className="px-3 py-2.5 text-right text-[8px] font-bold uppercase tracking-widest text-amber-400">Solde dû</th>
              <th className="px-3 py-2.5 text-center text-[8px] font-bold uppercase tracking-widest text-amber-400">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-400 text-sm">Aucun fournisseur</td></tr>
            ) : filtered.map(f => (
              <tr key={f.id} className="border-b border-gray-100 hover:bg-gray-50">
                <td className="px-3 py-2 font-mono text-amber-600">{f.code}</td>
                <td className="px-3 py-2 text-gray-900 font-medium">{f.nom}</td>
                <td className="px-3 py-2 text-gray-600">{f.telephone || '—'}</td>
                <td className="px-3 py-2 text-gray-600">{f.email || '—'}</td>
                <td className="px-3 py-2 text-right font-mono text-gray-900">{f.soldeDu.toLocaleString('fr-FR')} FCFA</td>
                <td className="px-3 py-2 text-center">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => openEdit(f)} className="text-gray-400 hover:text-amber-600 p-1 transition-all"><Pencil size={14} /></button>
                    <button onClick={() => deleteFournisseur(f.id)} className="text-gray-400 hover:text-red-600 p-1 transition-all"><Trash2 size={14} /></button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(10,11,16,0.7)' }}>
          <div className="bg-white rounded-xl w-full max-w-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="font-serif text-lg font-bold text-gray-900">{editing ? 'Modifier' : 'Nouveau'} fournisseur</h2>
              <button onClick={() => setShowModal(false)} className="text-gray-400 hover:text-gray-600"><X size={20} /></button>
            </div>
            <div className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Nom / Raison sociale *</label>
                  <input value={nom} onChange={e => setNom(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Téléphone</label>
                  <input value={tel} onChange={e => setTel(e.target.value)} placeholder="+225 00 00 00 00" className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Email</label>
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Ville</label>
                  <input value={ville} onChange={e => setVille(e.target.value)} placeholder="Abidjan" className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
                </div>
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">Adresse</label>
                <input value={adresse} onChange={e => setAdresse(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-[9px] font-bold uppercase tracking-widest text-gray-500">NIF</label>
                <input value={nif} onChange={e => setNif(e.target.value)} className="bg-gray-50 border border-gray-200 rounded px-3 py-2 text-sm outline-none focus:border-amber-400" />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button onClick={() => setShowModal(false)} className="px-4 py-2 rounded text-sm text-gray-500 border border-gray-200 hover:bg-gray-50 transition-all">Annuler</button>
                <button onClick={handleSave} className="px-5 py-2 rounded text-sm font-semibold text-white transition-all hover:-translate-y-0.5" style={{ background: 'linear-gradient(135deg, #d4a853, #b8912e)' }}><CheckCircle size={16} className="inline mr-1.5" />{editing ? 'Modifier' : 'Enregistrer'}</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
