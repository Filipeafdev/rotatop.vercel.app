import React, { useState } from 'react';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleAuthProvider } from '../../lib/firebase';
import { UserProfile, UserRole } from '../../types';
import { INITIAL_USERS } from '../../lib/storage';
import {
  Shield,
  Truck,
  UserCheck,
  X,
  Sparkles,
  LogOut,
  Mail,
  Lock,
  Loader2,
  Check,
  ArrowRight,
  KeyRound,
  FileSpreadsheet,
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentUser: UserProfile;
  onSelectUser: (user: UserProfile) => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({
  isOpen,
  onClose,
  currentUser,
  onSelectUser,
}) => {
  // Separate Tab for Portal: 'motorista' vs 'gestor'
  const [selectedPortal, setSelectedPortal] = useState<UserRole>('motorista');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  // Email / password state
  const [emailInput, setEmailInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [nameInput, setNameInput] = useState('');
  const [isRegisterMode, setIsRegisterMode] = useState(false);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || `${selectedPortal}@rotatop.com.br`,
        displayName: user.displayName || (selectedPortal === 'motorista' ? 'Motorista Google' : 'Gestor Google'),
        role: selectedPortal,
        photoURL: user.photoURL || undefined,
        vehiclePlate: selectedPortal === 'motorista' ? 'BRA-2E19' : undefined,
      };
      onSelectUser(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in fallback:', err);
      setAuthError('Falha ao abrir popup do Google. Utilize os acessos rápidos abaixo.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleManualLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    const profile: UserProfile = {
      uid: `user-${Date.now()}`,
      email: emailInput.trim(),
      displayName: nameInput.trim() || emailInput.split('@')[0],
      role: selectedPortal,
      vehiclePlate: selectedPortal === 'motorista' ? 'BRA-2E19' : undefined,
    };

    onSelectUser(profile);
    onClose();
  };

  const handleFastDemoLogin = (user: UserProfile) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-lg w-full p-5 sm:p-7 shadow-2xl my-auto animate-in fade-in zoom-in-95">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Portais de Acesso Rotatop
            </h3>
            <p className="text-xs text-slate-400">
              Selecione se deseja acessar como Motorista ou Gestor de Frota
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2 Separate Large Door Buttons: Motorista vs Gestor */}
        <div className="grid grid-cols-2 gap-3 mb-5">
          {/* Motorista Portal Tab */}
          <button
            type="button"
            onClick={() => {
              setSelectedPortal('motorista');
              setAuthError(null);
            }}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedPortal === 'motorista'
                ? 'bg-amber-500/15 border-amber-500 ring-2 ring-amber-500/30 text-white shadow-xl shadow-amber-950/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-xl ${
                  selectedPortal === 'motorista'
                    ? 'bg-amber-500 text-slate-950'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Truck className="w-5 h-5" />
              </div>
              {selectedPortal === 'motorista' && (
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse"></span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight">
                Portal do Motorista
              </h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Rotas, romaneio, entregas e custos de combustível
              </p>
            </div>
          </button>

          {/* Gestor Portal Tab */}
          <button
            type="button"
            onClick={() => {
              setSelectedPortal('gestor');
              setAuthError(null);
            }}
            className={`p-3.5 rounded-2xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
              selectedPortal === 'gestor'
                ? 'bg-blue-600/15 border-blue-500 ring-2 ring-blue-500/30 text-white shadow-xl shadow-blue-950/40'
                : 'bg-slate-950/70 border-slate-800 text-slate-400 hover:bg-slate-800 hover:text-white'
            }`}
          >
            <div className="flex items-center justify-between w-full mb-2">
              <div
                className={`p-2 rounded-xl ${
                  selectedPortal === 'gestor'
                    ? 'bg-blue-600 text-white'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                <Shield className="w-5 h-5" />
              </div>
              {selectedPortal === 'gestor' && (
                <span className="w-2.5 h-2.5 rounded-full bg-blue-400 animate-pulse"></span>
              )}
            </div>
            <div>
              <h4 className="text-sm font-black text-white tracking-tight">
                Portal do Gestor
              </h4>
              <p className="text-[11px] text-slate-400 leading-tight mt-0.5">
                Dashboard de frota, cadastro de veículos e relatórios
              </p>
            </div>
          </button>
        </div>

        {/* Portal-specific Header Banner */}
        <div
          className={`p-3 rounded-xl border text-xs mb-4 flex items-center gap-2.5 ${
            selectedPortal === 'motorista'
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
              : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
          }`}
        >
          {selectedPortal === 'motorista' ? (
            <Truck className="w-4 h-4 shrink-0 text-amber-400" />
          ) : (
            <Shield className="w-4 h-4 shrink-0 text-blue-400" />
          )}
          <span>
            {selectedPortal === 'motorista'
              ? 'Você está acessando a área de Operações de Rua e Romaneios de Entrega.'
              : 'Você está acessando o Painel de Gestão e Controle Geral de Frotas.'}
          </span>
        </div>

        {/* 1-Click Fast Login for This Specific Portal */}
        <div className="mb-4">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block mb-2">
            Acesso Rápido ({selectedPortal === 'motorista' ? 'Motoristas Cadastrados' : 'Gestores Autorizados'}):
          </span>

          <div className="space-y-2">
            {INITIAL_USERS.filter((u) => u.role === selectedPortal).map((user) => (
              <button
                key={user.uid}
                type="button"
                onClick={() => handleFastDemoLogin(user)}
                className={`w-full p-2.5 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                  currentUser.uid === user.uid
                    ? 'bg-slate-800 border-emerald-500/50 text-white'
                    : 'bg-slate-950 border-slate-800 text-slate-300 hover:bg-slate-800'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${
                      selectedPortal === 'motorista'
                        ? 'bg-amber-500/20 text-amber-400'
                        : 'bg-blue-500/20 text-blue-400'
                    }`}
                  >
                    {user.displayName.substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white block">
                      {user.displayName}
                    </span>
                    <span className="text-[10px] text-slate-400">
                      {user.email}{' '}
                      {user.vehiclePlate ? `• Veículo ${user.vehiclePlate}` : ''}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400">
                  <span>Entrar</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Email / Password Form or Google Login */}
        <div className="pt-3 border-t border-slate-800">
          <form onSubmit={handleManualLogin} className="space-y-2.5 mb-3">
            {isRegisterMode && (
              <div>
                <label className="block text-[11px] font-bold text-slate-400 mb-1">
                  Nome Completo
                </label>
                <input
                  type="text"
                  required
                  value={nameInput}
                  onChange={(e) => setNameInput(e.target.value)}
                  placeholder="Seu nome"
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>
            )}

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">
                E-mail do {selectedPortal === 'motorista' ? 'Motorista' : 'Gestor'}
              </label>
              <input
                type="email"
                required
                value={emailInput}
                onChange={(e) => setEmailInput(e.target.value)}
                placeholder={
                  selectedPortal === 'motorista'
                    ? 'motorista@exemplo.com'
                    : 'gestor@exemplo.com'
                }
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-400 mb-1">Senha</label>
              <input
                type="password"
                required
                value={passwordInput}
                onChange={(e) => setPasswordInput(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-950 border border-slate-700 rounded-xl py-2 px-3 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div className="flex items-center justify-between text-[11px] pt-1">
              <button
                type="button"
                onClick={() => setIsRegisterMode(!isRegisterMode)}
                className="text-blue-400 hover:underline"
              >
                {isRegisterMode ? 'Já tenho uma conta' : 'Criar nova conta'}
              </button>
            </div>

            <button
              type="submit"
              className={`w-full py-2.5 text-xs font-black rounded-xl shadow-lg transition-all cursor-pointer ${
                selectedPortal === 'motorista'
                  ? 'bg-amber-500 hover:bg-amber-400 text-slate-950'
                  : 'bg-blue-600 hover:bg-blue-500 text-white'
              }`}
            >
              {isRegisterMode ? 'Criar Conta' : `Entrar no Portal do ${selectedPortal === 'motorista' ? 'Motorista' : 'Gestor'}`}
            </button>
          </form>

          {/* Google Sign-in */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-bold text-xs rounded-xl border border-slate-700 shadow-md flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-white" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                />
              </svg>
            )}
            <span>Entrar com Google como {selectedPortal === 'motorista' ? 'Motorista' : 'Gestor'}</span>
          </button>

          {authError && (
            <p className="text-[11px] text-amber-400 mt-2 text-center">{authError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
