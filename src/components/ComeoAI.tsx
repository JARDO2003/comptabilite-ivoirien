import { useState, useRef, useEffect } from 'react';
import { useStore } from '@/hooks';
import { validerEcriture, sortLignesDebitAvantCredit, corrigerComptesErreurs, formatFCFA } from '@/engine/validation';
import { getLibelleCompte } from '@/data/planComptable';
import type { LigneEcriture, JournalCode } from '@/types';
import { Send, Loader2, CheckCircle, AlertTriangle, Sparkles } from 'lucide-react';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  ecritures?: ProposedEcriture[];
}

interface ProposedEcriture {
  date: string;
  journal: JournalCode;
  libelle: string;
  lignes: LigneEcriture[];
  validation: ReturnType<typeof validerEcriture>;
}

function genId() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 7); }

// ══════════════════════════════════════════
// API MISTRAL — COMEO AI v5
// ══════════════════════════════════════════

const MISTRAL_API_KEY = ''; // L'utilisateur doit configurer sa clé
const MISTRAL_API_URL = 'https://api.mistral.ai/v1/chat/completions';
const MISTRAL_MODEL = 'mistral-large-latest';

const SYSTEM_PROMPT = `Tu es COMEO AI, un expert-comptable spécialisé dans le plan comptable SYSCOHADA révisé pour la Côte d'Ivoire.

TA MISSION: Analyser les opérations comptables décrites en langage naturel et produire des écritures comptables EXACTES.

RÈGLES ABSOLUES:
1. Chaque écriture DOIT respecter la partie double: Σ Débit = Σ Crédit
2. Utilise UNIQUEMENT les comptes du plan SYSCOHADA
3. La TVA en Côte d'Ivoire est à 18% (standard) ou 9% (réduit)
4. Comptes TVA: 445x (TVA récupérable/déductible), 443x (TVA facturée/collectée)
5. Les achats de marchandises passent par le compte 601
6. Les ventes de marchandises passent par le compte 701
7. Les achats d'immobilisations ne passent PAS par 601 mais par les comptes 2xxx
8. Les charges de personnel passent par le compte 66x
9. Les dotations aux amortissements passent par le compte 68x

FORMAT DE RÉPONSE:
Tu dois répondre UNIQUEMENT en JSON avec ce format exact:
{
  "explication": "description de l'analyse comptable",
  "ecritures": [
    {
      "date": "YYYY-MM-DD",
      "journal": "AC|VE|BQ|CA|OD|IN|AN",
      "libelle": "description de l'opération",
      "lignes": [
        { "compte": "xxx", "libelle": "description", "debit": N, "credit": 0 },
        { "compte": "xxx", "libelle": "description", "debit": 0, "credit": N }
      ]
    }
  ]
}

CONSIGNES:
- Si l'opération implique un achat ou vente de marchandises, génère les 3 écritures: achat/vente + variation de stock + règlement
- Les montants sont en FCFA
- Vérifie que chaque écriture est équilibrée
- Ne génère PAS d'écriture si les informations sont insuffisantes`;

async function callMistral(messages: Array<{ role: string; content: string }>): Promise<string> {
  // Si pas de clé API configurée, utiliser le moteur local
  if (!MISTRAL_API_KEY) {
    return processWithLocalEngine(messages[messages.length - 1].content);
  }

  try {
    const response = await fetch(MISTRAL_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MISTRAL_API_KEY}`
      },
      body: JSON.stringify({
        model: MISTRAL_MODEL,
        messages: [
          { role: 'system', content: SYSTEM_PROMPT },
          ...messages.map(m => ({ role: m.role, content: m.content }))
        ],
        temperature: 0.1,
        max_tokens: 2048,
        response_format: { type: 'json_object' }
      })
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = await response.json();
    return data.choices?.[0]?.message?.content || '';
  } catch (error) {
    console.warn('[Mistral] Fallback to local engine:', error);
    return processWithLocalEngine(messages[messages.length - 1].content);
  }
}

// ══════════════════════════════════════════
// MOTEUR LOCAL — Fallback si Mistral indisponible
// ══════════════════════════════════════════

function processWithLocalEngine(input: string): string {
  const text = input.toLowerCase();
  const today = new Date().toISOString().split('T')[0];
  const result: { explication: string; ecritures: any[] } = { explication: '', ecritures: [] };

  // Achat marchandises
  if (text.includes('achat') && text.includes('marchandis')) {
    const amounts = extractAmounts(text);
    const total = amounts[0] || 0;
    const taux = text.includes('9%') ? 0.09 : 0.18;
    const tva = Math.round(total * taux / (1 + taux));
    const ht = total - tva;
    const modePaiement = text.includes('espèce') || text.includes('caisse') ? 'CA' :
      text.includes('banque') || text.includes('virement') || text.includes('cheque') ? 'BQ' : 'AC';
    const compteTresorerie = modePaiement === 'CA' ? '571' : '521';

    result.explication = `Achat de marchandises: ${formatFCFA(ht)} FCFA HT + TVA ${Math.round(taux * 100)}% = ${formatFCFA(total)} FCFA TTC`;

    // Écriture 1: Achat
    result.ecritures.push({
      date: today, journal: 'AC' as JournalCode,
      libelle: `Achat de marchandises ${formatFCFA(total)} FCFA TTC`,
      lignes: [
        { compte: '601', libelle: 'Achat de marchandises', debit: ht, credit: 0 },
        { compte: '4452', libelle: 'TVA récupérable sur achats', debit: tva, credit: 0 },
        { compte: modePaiement === 'AC' ? '401' : compteTresorerie, libelle: modePaiement === 'AC' ? 'Fournisseur' : 'Règlement', debit: 0, credit: total }
      ]
    });

    // Écriture 2: Variation de stock
    if (text.includes('3 écriture') || text.includes('3 ecriture') || text.includes('variation')) {
      result.ecritures.push({
        date: today, journal: 'OD' as JournalCode,
        libelle: `Variation de stock des marchandises`,
        lignes: [
          { compte: '6031', libelle: 'Variation des stocks de marchandises', debit: ht, credit: 0 },
          { compte: '311', libelle: 'Stock de marchandises', debit: 0, credit: ht }
        ]
      });
    }
  }

  // Vente marchandises
  if (text.includes('vente') && text.includes('marchandis')) {
    const amounts = extractAmounts(text);
    const total = amounts[0] || 0;
    const taux = text.includes('9%') ? 0.09 : 0.18;
    const tva = Math.round(total * taux / (1 + taux));
    const ht = total - tva;
    const modePaiement = text.includes('espèce') || text.includes('caisse') ? 'CA' :
      text.includes('banque') || text.includes('virement') ? 'BQ' : 'VE';
    const compteTresorerie = modePaiement === 'CA' ? '571' : '521';

    result.explication = `Vente de marchandises: ${formatFCFA(ht)} FCFA HT + TVA ${Math.round(taux * 100)}% = ${formatFCFA(total)} FCFA TTC`;

    result.ecritures.push({
      date: today, journal: 'VE' as JournalCode,
      libelle: `Vente de marchandises ${formatFCFA(total)} FCFA TTC`,
      lignes: [
        { compte: modePaiement === 'VE' ? '411' : compteTresorerie, libelle: modePaiement === 'VE' ? 'Client' : 'Encaissement', debit: total, credit: 0 },
        { compte: '4431', libelle: 'TVA facturée sur ventes', debit: 0, credit: tva },
        { compte: '701', libelle: 'Vente de marchandises', debit: 0, credit: ht }
      ]
    });
  }

  // Salaires
  if (text.includes('salaire') || text.includes('paie') || text.includes('paye')) {
    const amounts = extractAmounts(text);
    const brut = amounts[0] || 0;
    const cotisations = amounts[1] || Math.round(brut * 0.2);
    const impots = amounts[2] || 0;
    const net = brut - cotisations - impots;

    result.explication = `Paie du personnel: brut ${formatFCFA(brut)} FCFA, cotisations ${formatFCFA(cotisations)} FCFA, impôts ${formatFCFA(impots)} FCFA, net ${formatFCFA(net)} FCFA`;

    result.ecritures.push({
      date: today, journal: 'OD' as JournalCode,
      libelle: `Règlement des salaires du mois`,
      lignes: [
        { compte: '661', libelle: 'Rémunérations du personnel', debit: brut, credit: 0 },
        { compte: '422', libelle: 'Personnel, rémunérations dues', debit: 0, credit: net },
        { compte: '431', libelle: 'Sécurité sociale', debit: 0, credit: cotisations },
        { compte: '447', libelle: 'Impôts retenus à la source', debit: 0, credit: impots }
      ]
    });
  }

  // Amortissements
  if (text.includes('amorti') || text.includes('dotation')) {
    const amounts = extractAmounts(text);
    const valeur = amounts[0] || 0;
    const duree = extractDuration(text) || 4;
    const annuel = Math.round(valeur / duree);

    result.explication = `Dotation aux amortissements: valeur ${formatFCFA(valeur)} FCFA / ${duree} ans = ${formatFCFA(annuel)} FCFA/an`;

    result.ecritures.push({
      date: today, journal: 'OD' as JournalCode,
      libelle: `Dotation aux amortissements annuels`,
      lignes: [
        { compte: '681', libelle: 'Dotations aux amortissements', debit: annuel, credit: 0 },
        { compte: '284', libelle: 'Amortissements du matériel', debit: 0, credit: annuel }
      ]
    });
  }

  // Si aucun pattern reconnu
  if (result.ecritures.length === 0) {
    result.explication = `Je n'ai pas pu identifier une opération comptable spécifique dans votre demande. Essayez de décrire: un achat de marchandises, une vente, une paie, un amortissement, un paiement fournisseur, etc. Exemple: "Achat de marchandises 500000 FCFA TTC payé en espèces, TVA 18%"`;
  }

  return JSON.stringify(result);
}

function extractAmounts(text: string): number[] {
  const matches = text.match(/(\d{1,3}(?:\s?\d{3})*(?:\.\d+)?)\s*(FCFA|francs|f|€|\$)?/gi) || [];
  return matches.map(m => {
    const num = m.replace(/[^\d.]/g, '');
    return num ? Math.round(parseFloat(num)) : 0;
  }).filter(n => n > 0);
}

function extractDuration(text: string): number | null {
  const match = text.match(/(\d+)\s*(an|ans|année|années|a)/i);
  return match ? parseInt(match[1]) : null;
}

// ══════════════════════════════════════════
// COMPOSANT COME AI
// ══════════════════════════════════════════

interface ComeoAIProps {
  onClose: () => void;
}

export default function ComeoAI({ onClose }: ComeoAIProps) {
  const { addEcriture, pieceCounter } = useStore();
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Bonjour ! Je suis **COMEO AI v5**, votre expert-comptable SYSCOHADA. Décrivez une opération en langage naturel et je prépare les écritures comptables conformes. Chaque proposition est validée par le moteur de contrôle comptable avant affichage.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [pendingEcritures, setPendingEcritures] = useState<ProposedEcriture[]>([]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;
    const userMsg = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', content: userMsg }]);
    setLoading(true);

    try {
      const response = await callMistral([
        ...messages.filter(m => m.role !== 'assistant' || !m.ecritures).map(m => ({ role: m.role, content: m.content })),
        { role: 'user', content: userMsg }
      ]);

      let parsed: any;
      try {
        parsed = JSON.parse(response);
      } catch {
        parsed = { explication: response, ecritures: [] };
      }

      const proposedEcritures: ProposedEcriture[] = (parsed.ecritures || []).map((e: any) => {
        const lignes = (e.lignes || []).map((l: any) => ({
          compte: String(l.compte || ''),
          libelle: l.libelle || getLibelleCompte(String(l.compte || '')),
          debit: Math.round(Number(l.debit) || 0),
          credit: Math.round(Number(l.credit) || 0)
        }));
        const validated = validerEcriture(lignes);
        return {
          date: e.date || new Date().toISOString().split('T')[0],
          journal: (e.journal || 'OD') as JournalCode,
          libelle: e.libelle || 'Écriture proposée',
          lignes, validation: validated
        };
      });

      setPendingEcritures(proposedEcritures);

      let content = parsed.explication || 'Analyse terminée.';
      if (proposedEcritures.length > 0) {
        content += `\n\nJ'ai préparé **${proposedEcritures.length} écriture(s)**. Vérifiez les lignes ci-dessous et cliquez sur **"Tout enregistrer"** pour les valider.`;
      }

      setMessages(prev => [...prev, { role: 'assistant', content, ecritures: proposedEcritures }]);
    } catch (error) {
      setMessages(prev => [...prev, {
        role: 'assistant',
        content: 'Désolé, une erreur est survenue. Veuillez réessayer avec une description plus précise de l\'opération comptable.'
      }]);
    } finally {
      setLoading(false);
    }
  };

  const saveAll = () => {
    let saved = 0;
    pendingEcritures.forEach(pe => {
      if (pe.validation.valid) {
        const corrige = corrigerComptesErreurs(pe.lignes);
        const triees = sortLignesDebitAvantCredit(corrige);
        addEcriture({
          id: genId(), date: pe.date, journal: pe.journal,
          piece: `ECR-${String(pieceCounter + saved).padStart(4, '0')}`,
          libelle: pe.libelle, createdAt: new Date().toISOString(),
          lignes: triees.map(l => ({
            compte: l.compte, libelle: l.libelle || getLibelleCompte(l.compte),
            debit: Math.round(l.debit || 0), credit: Math.round(l.credit || 0)
          }))
        });
        saved++;
      }
    });
    setMessages(prev => [...prev, {
      role: 'assistant',
      content: `✅ **${saved} écriture(s) enregistrée(s)** dans le journal. Les contrôles de validation ont été passés avec succès.`
    }]);
    setPendingEcritures([]);
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col" style={{ background: '#06070f' }}>
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-amber-400/10"
        style={{ background: 'rgba(6,7,15,0.75)', backdropFilter: 'blur(16px)' }}>
        <div className="flex items-center gap-3">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500" style={{ boxShadow: '0 0 10px #22c55e' }} />
          <span className="font-serif text-base font-bold text-amber-400 tracking-wider">COMEO AI v5</span>
          <span className="text-[9px] font-mono text-white/20 tracking-widest">Expert Comptable SYSCOHADA</span>
          <span className="px-2 py-0.5 rounded text-[8px] font-mono font-bold"
            style={{ background: 'rgba(34,197,94,0.1)', color: '#4ade80', border: '1px solid rgba(34,197,94,0.25)' }}>
            En ligne
          </span>
        </div>
        <button onClick={onClose}
          className="text-white/50 hover:text-white px-4 py-2 rounded-md text-sm font-semibold transition-all hover:bg-white/10">
          ✕ Fermer
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-4">
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-3 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0 ${
              msg.role === 'user'
                ? 'bg-gray-200 text-gray-600 border border-gray-300'
                : 'bg-gray-900 text-amber-400 border border-amber-400'
            }`}>
              {msg.role === 'user' ? 'U' : 'AI'}
            </div>
            <div className={`max-w-[80%] rounded-lg p-3 text-sm leading-relaxed ${
              msg.role === 'user'
                ? 'bg-gray-900 text-amber-400'
                : 'bg-white border border-gray-200 text-gray-700'
            }`}>
              <div dangerouslySetInnerHTML={{
                __html: msg.content
                  .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
                  .replace(/\n/g, '<br/>')
              }} />

              {/* Proposed ecritures */}
              {msg.ecritures && msg.ecritures.length > 0 && (
                <div className="mt-4 space-y-3">
                  {msg.ecritures.map((pe, idx) => (
                    <div key={idx} className={`rounded-md border overflow-hidden ${
                      pe.validation.valid ? 'border-green-300 bg-green-50/50' : 'border-red-300 bg-red-50/50'
                    }`}>
                      <div className={`px-3 py-2 flex items-center gap-2 ${
                        pe.validation.valid ? 'bg-green-100' : 'bg-red-100'
                      }`}>
                        {pe.validation.valid ? <CheckCircle size={14} className="text-green-600" />
                          : <AlertTriangle size={14} className="text-red-600" />}
                        <span className={`text-xs font-bold ${pe.validation.valid ? 'text-green-700' : 'text-red-700'}`}>
                          Écriture {idx + 1}: {pe.journal} — {pe.libelle}
                        </span>
                        {pe.validation.valid && (
                          <span className="ml-auto text-[9px] font-mono text-green-600 bg-green-200 px-1.5 py-0.5 rounded">
                            ✓ Équilibrée
                          </span>
                        )}
                      </div>
                      <div className="overflow-x-auto">
                        <table className="w-full text-[10px]">
                          <thead>
                            <tr className="bg-gray-50">
                              <th className="px-2 py-1 text-left text-gray-500">Compte</th>
                              <th className="px-2 py-1 text-left text-gray-500">Libellé</th>
                              <th className="px-2 py-1 text-right text-gray-500">Débit</th>
                              <th className="px-2 py-1 text-right text-gray-500">Crédit</th>
                            </tr>
                          </thead>
                          <tbody>
                            {pe.lignes.map((l, li) => (
                              <tr key={li} className="border-t border-gray-100">
                                <td className="px-2 py-1 font-mono text-amber-600 font-semibold">{l.compte}</td>
                                <td className="px-2 py-1 text-gray-700">{l.libelle}</td>
                                <td className="px-2 py-1 text-right font-mono text-blue-600">{l.debit > 0 ? formatFCFA(l.debit) : ''}</td>
                                <td className="px-2 py-1 text-right font-mono text-green-600">{l.credit > 0 ? formatFCFA(l.credit) : ''}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      {pe.validation.errors.length > 0 && (
                        <div className="px-3 py-2 bg-red-50">
                          {pe.validation.errors.map((e, ei) => (
                            <div key={ei} className="text-[9px] text-red-600">• {e}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))}

                  {msg.ecritures.some(e => e.validation.valid) && (
                    <button onClick={saveAll}
                      className="w-full py-2.5 rounded-md text-sm font-bold text-white flex items-center justify-center gap-2 transition-all hover:-translate-y-0.5"
                      style={{ background: 'linear-gradient(135deg, #16a34a, #15803d)', boxShadow: '0 4px 16px rgba(22,163,74,0.3)' }}>
                      <CheckCircle size={16} /> Tout enregistrer ({msg.ecritures.filter(e => e.validation.valid).length} écriture(s))
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        ))}

        {loading && (
          <div className="flex gap-3">
            <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold bg-gray-900 text-amber-400 border border-amber-400">
              AI
            </div>
            <div className="bg-white border border-gray-200 rounded-lg p-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '200ms' }} />
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-bounce" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Input */}
      <div className="p-4 border-t border-amber-400/10" style={{ background: 'rgba(6,7,15,0.75)', backdropFilter: 'blur(16px)' }}>
        <div className="flex gap-2 max-w-3xl mx-auto">
          <textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder="Ex: Achat marchandises 500 000 FCFA espèces, TVA 18%..."
            className="flex-1 bg-white/5 border border-white/10 rounded-lg text-white px-4 py-3 text-sm outline-none focus:border-amber-400/50 transition-all resize-none h-14 placeholder:text-white/20" />
          <button onClick={handleSend} disabled={loading || !input.trim()}
            className="px-5 rounded-lg text-sm font-bold flex items-center gap-2 transition-all hover:-translate-y-0.5 disabled:opacity-50 disabled:hover:translate-y-0"
            style={{ background: 'linear-gradient(135deg, #d4a853, #b8912e)', color: '#0a0b10' }}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3 max-w-3xl mx-auto">
          {[
            'Achat 500000 FCFA espèces TVA 18%',
            'Vente 1200000 FCFA virement TVA 18%',
            'Paie brut 800000 cotisations 20%',
            'Amortissement matériel 2400000 sur 4 ans'
          ].map(chip => (
            <button key={chip} onClick={() => setInput(chip)}
              className="px-3 py-1.5 rounded-full text-[10px] border border-white/10 text-white/40 hover:bg-amber-400/10 hover:text-amber-400 hover:border-amber-400/30 transition-all">
              <Sparkles size={10} className="inline mr-1" />{chip}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
