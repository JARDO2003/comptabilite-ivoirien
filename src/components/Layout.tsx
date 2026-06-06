import { useState } from 'react';
import { useAuth, useStore } from '@/hooks';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard, PenLine, BookOpen, BookMarked, Scale,
  FileText, TrendingUp, Wallet, Calculator, Receipt,
  ClipboardList, Users, Factory, LogOut, Menu, X
} from 'lucide-react';
import type { ViewName } from '@/types';

const NAV_ITEMS: Array<{ view: ViewName; label: string; icon: React.ReactNode; section: string }> = [
  { view: 'dashboard', label: 'Tableau de bord', icon: <LayoutDashboard size={16} />, section: 'Navigation' },
  { view: 'saisie', label: 'Saisie', icon: <PenLine size={16} />, section: 'Navigation' },
  { view: 'journal', label: 'Journal', icon: <BookOpen size={16} />, section: 'Navigation' },
  { view: 'grandlivre', label: 'Grand Livre', icon: <BookMarked size={16} />, section: 'Navigation' },
  { view: 'balance', label: 'Balance', icon: <Scale size={16} />, section: 'Navigation' },
  { view: 'factures', label: 'Factures', icon: <Receipt size={16} />, section: 'Facturation' },
  { view: 'devis', label: 'Devis / Proformas', icon: <ClipboardList size={16} />, section: 'Facturation' },
  { view: 'clients', label: 'Clients', icon: <Users size={16} />, section: 'Facturation' },
  { view: 'fournisseurs', label: 'Fournisseurs', icon: <Factory size={16} />, section: 'Facturation' },
  { view: 'bilan', label: 'Bilan', icon: <FileText size={16} />, section: 'États financiers' },
  { view: 'resultat', label: 'Compte de résultat', icon: <TrendingUp size={16} />, section: 'États financiers' },
  { view: 'tresorerie', label: 'Trésorerie', icon: <Wallet size={16} />, section: 'États financiers' },
  { view: 'plancomptable', label: 'Plan SYSCOHADA', icon: <Calculator size={16} />, section: 'Référentiel' },
];

interface LayoutProps {
  currentView: ViewName;
  onNavigate: (v: ViewName) => void;
  children: React.ReactNode;
}

export default function Layout({ currentView, onNavigate, children }: LayoutProps) {
  const { user, logout } = useAuth();
  const { stats } = useStore();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const sections = ['Navigation', 'Facturation', 'États financiers', 'Référentiel'];

  return (
    <div className="min-h-screen flex" style={{ background: '#f5f3ee' }}>
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-50 w-56 transition-transform duration-300
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
        flex flex-col overflow-y-auto`}
        style={{ background: '#0a0b10', borderRight: '1px solid rgba(255,255,255,0.06)' }}>
        
        <div className="p-4 border-b border-white/5">
          <div className="flex items-baseline gap-2">
            <span className="font-serif text-lg font-bold text-amber-400 tracking-wide">SYSCOHADA</span>
            <span className="text-amber-400/40 text-[9px] font-mono tracking-widest uppercase">Pro</span>
          </div>
        </div>

        <nav className="flex-1 px-2.5 py-4">
          {sections.map(section => {
            const items = NAV_ITEMS.filter(n => n.section === section);
            if (items.length === 0) return null;
            return (
              <div key={section} className="mb-5">
                <div className="px-2 mb-1.5 text-[9px] font-bold uppercase tracking-widest text-white/20">
                  {section}
                </div>
                {items.map(item => (
                  <button
                    key={item.view}
                    onClick={() => { onNavigate(item.view); setSidebarOpen(false); }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-2 rounded-md text-xs font-medium transition-all
                      ${currentView === item.view
                        ? 'bg-amber-400/10 text-amber-400 border border-amber-400/20'
                        : 'text-white/35 hover:bg-white/5 hover:text-white/70 border border-transparent'
                      }`}>
                    {item.icon}
                    {item.label}
                  </button>
                ))}
              </div>
            );
          })}
        </nav>

        <div className="p-3 border-t border-white/5">
          <div className="rounded-md p-3" style={{ background: 'rgba(255,255,255,0.03)' }}>
            <div className="flex justify-between text-[10px] py-1 border-b border-white/5">
              <span className="text-white/25">Écritures</span>
              <span className="font-mono text-white/45">{stats.nbEcritures}</span>
            </div>
            <div className="flex justify-between text-[10px] py-1 border-b border-white/5">
              <span className="text-white/25">Total débit</span>
              <span className="font-mono text-blue-400">{stats.totalDebit.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex justify-between text-[10px] py-1 border-b border-white/5">
              <span className="text-white/25">Total crédit</span>
              <span className="font-mono text-green-400">{stats.totalCredit.toLocaleString('fr-FR')}</span>
            </div>
            <div className="flex justify-between text-[10px] py-1">
              <span className="text-white/25">Équilibre</span>
              <span className={`font-mono ${stats.equilibre ? 'text-green-400' : 'text-red-400'}`}>
                {stats.equilibre ? '✓' : '✗'}
              </span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Topbar */}
        <header className="sticky top-0 z-30 flex items-center px-4 h-14 gap-3"
          style={{ background: '#0a0b10', borderBottom: '2px solid #d4a853' }}>
          <button className="lg:hidden text-white/70 p-1 rounded border border-white/15" onClick={() => setSidebarOpen(true)}>
            <Menu size={20} />
          </button>
          <button className="lg:hidden text-white/70 p-1 rounded border border-white/15" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
          
          <div className="w-px h-6 bg-white/5 hidden sm:block" />
          
          <div className="flex items-center gap-1.5 px-2 py-1 rounded"
            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
            <span className="text-white/40 text-xs">🏢</span>
            <strong className="text-amber-400 text-xs font-semibold truncate max-w-[120px]">
              {user?.company || '—'}
            </strong>
          </div>

          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center gap-1.5 px-2 py-1 rounded text-xs text-white/40"
              style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
              Exercice
              <span className="text-amber-400 font-mono text-xs">{user?.exercice || '2024'}</span>
            </div>
            <span className="px-2 py-0.5 rounded text-[9px] font-mono tracking-wider font-semibold"
              style={{ background: 'rgba(212,168,83,0.12)', border: '1px solid rgba(212,168,83,0.25)', color: '#d4a853' }}>
              OHADA 2023
            </span>
            <Button variant="ghost" size="sm" onClick={logout}
              className="text-red-300 hover:text-red-200 hover:bg-red-500/10 h-8 px-2">
              <LogOut size={16} />
            </Button>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-5 lg:p-6 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
