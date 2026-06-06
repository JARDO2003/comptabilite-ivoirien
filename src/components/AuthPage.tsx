import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';

export default function AuthPage() {
  const [tab, setTab] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [company, setCompany] = useState('');
  const [exercice, setExercice] = useState('2024');
  const [err, setErr] = useState('');
  const { login, register, loading } = useAuth();

  const handleLogin = async () => {
    setErr('');
    if (!email || !pass) { setErr('Remplissez tous les champs'); return; }
    await login(email, pass);
  };

  const handleRegister = async () => {
    setErr('');
    if (!company) { setErr("Nom d'entreprise requis"); return; }
    if (!email) { setErr('Email requis'); return; }
    if (pass.length < 6) { setErr('Mot de passe trop court (6 caractères min.)'); return; }
    await register({ company, email, password: pass, exercice });
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4"
      style={{ background: 'linear-gradient(135deg, #0a0b10 0%, #1a1208 50%, #0a0b10 100%)' }}>
      <div className="relative z-10 w-full max-w-md rounded-2xl p-10 border border-amber-600/20 backdrop-blur-xl"
        style={{ background: 'rgba(255,255,255,0.04)', boxShadow: '0 32px 80px rgba(0,0,0,0.6)' }}>
        
        <div className="text-center mb-7">
          <div className="font-serif text-3xl font-bold text-amber-400 tracking-wider">SYSCOHADA Pro</div>
          <div className="text-amber-400/50 text-xs font-mono tracking-widest uppercase mt-1">
            Expert Comptable SYSCOHADA · Conforme OHADA 2023
          </div>
        </div>

        <div className="flex rounded-md p-1 mb-6 gap-1" style={{ background: 'rgba(255,255,255,0.04)' }}>
          <button onClick={() => { setTab('login'); setErr(''); }}
            className={`flex-1 text-center py-2 rounded text-xs font-mono tracking-wider transition-all ${
              tab === 'login' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25' : 'text-white/30'
            }`}>
            Connexion
          </button>
          <button onClick={() => { setTab('register'); setErr(''); }}
            className={`flex-1 text-center py-2 rounded text-xs font-mono tracking-wider transition-all ${
              tab === 'register' ? 'bg-amber-400/15 text-amber-400 border border-amber-400/25' : 'text-white/30'
            }`}>
            Créer un profil
          </button>
        </div>

        {tab === 'login' ? (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="contact@entreprise.ci" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Mot de passe</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleLogin()}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="••••••••" />
            </div>
            {err && <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-300 text-xs">{err}</div>}
            <button onClick={handleLogin} disabled={loading}
              className="w-full py-3 rounded-md text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #d4a853, #b8912e)', color: '#0a0b10' }}>
              {loading ? 'Connexion...' : 'Se connecter'}
            </button>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Nom de l'entreprise</label>
              <input type="text" value={company} onChange={e => setCompany(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="ex: SOTRA SARL" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Email professionnel</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="contact@entreprise.ci" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Exercice comptable</label>
              <input type="text" value={exercice} onChange={e => setExercice(e.target.value)} maxLength={4}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="2024" />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-amber-400/60 text-xs font-semibold uppercase tracking-widest">Mot de passe (min 6 car.)</label>
              <input type="password" value={pass} onChange={e => setPass(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleRegister()}
                className="bg-white/5 border border-white/10 rounded-md text-amber-50 px-3 py-2.5 text-sm outline-none focus:border-amber-400/50 transition-all placeholder:text-white/20"
                placeholder="Minimum 6 caractères" />
            </div>
            {err && <div className="bg-red-500/10 border border-red-500/20 rounded px-3 py-2 text-red-300 text-xs">{err}</div>}
            <button onClick={handleRegister} disabled={loading}
              className="w-full py-3 rounded-md text-sm font-bold transition-all hover:-translate-y-0.5 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #d4a853, #b8912e)', color: '#0a0b10' }}>
              {loading ? 'Création...' : 'Créer mon profil'}
            </button>
            <p className="text-center text-white/40 text-xs">12 heures d'essai gratuit</p>
          </div>
        )}
      </div>
    </div>
  );
}
