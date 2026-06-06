import { useAuth } from '@/hooks';
import { AppRouter, useNavigate } from '@/components/AppRouter';
import Layout from '@/components/Layout';
import AuthPage from '@/components/AuthPage';
import Dashboard from '@/components/Dashboard';
import Saisie from '@/components/Saisie';
import Journal from '@/components/Journal';
import GrandLivre from '@/components/GrandLivre';
import Balance from '@/components/Balance';
import Bilan from '@/components/Bilan';
import Resultat from '@/components/Resultat';
import Tresorerie from '@/components/Tresorerie';
import PlanComptableView from '@/components/PlanComptable';
import Factures from '@/components/Factures';
import Devis from '@/components/Devis';
import ClientsView from '@/components/Clients';
import FournisseursView from '@/components/Fournisseurs';
import './App.css';

function AppContent() {
  const { user } = useAuth();
  const { currentView, navigate } = useNavigate();

  if (!user) {
    return <AuthPage />;
  }

  const renderView = () => {
    switch (currentView) {
      case 'dashboard': return <Dashboard />;
      case 'saisie': return <Saisie />;
      case 'journal': return <Journal />;
      case 'grandlivre': return <GrandLivre />;
      case 'balance': return <Balance />;
      case 'bilan': return <Bilan />;
      case 'resultat': return <Resultat />;
      case 'tresorerie': return <Tresorerie />;
      case 'plancomptable': return <PlanComptableView />;
      case 'factures': return <Factures />;
      case 'devis': return <Devis />;
      case 'clients': return <ClientsView />;
      case 'fournisseurs': return <FournisseursView />;
      default: return <Dashboard />;
    }
  };

  return (
    <Layout currentView={currentView} onNavigate={navigate}>
      {renderView()}
    </Layout>
  );
}

export default function App() {
  return (
    <AppRouter>
      <AppContent />
    </AppRouter>
  );
}
