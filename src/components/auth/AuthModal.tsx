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
  const [selectedRoleForNewLogin, setSelectedRoleForNewLogin] = useState<UserRole>('motorista');
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSigningIn(true);
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleAuthProvider);
      const user = result.user;
      const profile: UserProfile = {
        uid: user.uid,
        email: user.email || 'usuario@rotatop.com.br',
        displayName: user.displayName || 'Usuário Rotatop',
        role: selectedRoleForNewLogin,
        photoURL: user.photoURL || undefined,
        vehiclePlate: selectedRoleForNewLogin === 'motorista' ? 'BRA-2E19' : undefined,
      };
      onSelectUser(profile);
      onClose();
    } catch (err: any) {
      console.warn('Google sign-in fallback:', err);
      // If popup was blocked or offline, show clear message
      setAuthError('Falha no popup do Google. Use os perfis de demonstração abaixo.');
    } finally {
      setIsSigningIn(false);
    }
  };

  const handleFastDemoLogin = (user: UserProfile) => {
    onSelectUser(user);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-md w-full p-6 shadow-2xl animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between border-b border-slate-800 pb-3.5 mb-5">
          <div>
            <h3 className="text-lg font-black text-white tracking-tight">
              Acesso & Gestão de Contas
            </h3>
            <p className="text-xs text-slate-400">
              Rotatop Logística e Controle Operacional
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Active Account Card */}
        <div className="p-3.5 rounded-2xl bg-slate-950 border border-slate-800 mb-5 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 text-amber-400 font-black text-sm flex items-center justify-center border border-amber-500/30">
              {currentUser.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs font-bold text-white">{currentUser.displayName}</span>
                <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.2 rounded font-bold uppercase">
                  Ativo
                </span>
              </div>
              <span className="text-[11px] text-slate-400 block">{currentUser.email}</span>
              <span className="text-[10px] text-amber-400 font-semibold uppercase">
                Perfil: {currentUser.role}
              </span>
            </div>
          </div>
        </div>

        {/* Fast Switch Between Demo Profiles */}
        <div className="mb-5">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-2.5">
            Alternar Perfil Pré-Configurado:
          </span>

          <div className="space-y-2">
            {INITIAL_USERS.map((user) => {
              const isSelected = currentUser.uid === user.uid;
              return (
                <button
                  key={user.uid}
                  onClick={() => handleFastDemoLogin(user)}
                  className={`w-full p-3 rounded-xl border text-left flex items-center justify-between transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/20 border-blue-500 text-white shadow-lg'
                      : 'bg-slate-950/70 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`p-2 rounded-lg ${
                        user.role === 'motorista'
                          ? 'bg-amber-500/10 text-amber-400'
                          : 'bg-blue-500/10 text-blue-400'
                      }`}
                    >
                      {user.role === 'motorista' ? (
                        <Truck className="w-4 h-4" />
                      ) : (
                        <Shield className="w-4 h-4" />
                      )}
                    </div>
                    <div>
                      <div className="text-xs font-bold text-white flex items-center gap-1.5">
                        <span>{user.displayName}</span>
                        <span className="text-[10px] text-slate-400 capitalize">
                          ({user.role})
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400">
                        {user.role === 'motorista'
                          ? `Veículo ${user.vehiclePlate}`
                          : 'Gestão de Frota e KPIs'}
                      </span>
                    </div>
                  </div>

                  {isSelected && <Check className="w-4 h-4 text-emerald-400" />}
                </button>
              );
            })}
          </div>
        </div>

        {/* Google Authentication */}
        <div className="pt-4 border-t border-slate-800">
          <label className="block text-xs font-semibold text-slate-400 mb-2">
            Entrar com Conta Google (Escolha o perfil):
          </label>

          <div className="grid grid-cols-2 gap-2 mb-3">
            <button
              type="button"
              onClick={() => setSelectedRoleForNewLogin('motorista')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                selectedRoleForNewLogin === 'motorista'
                  ? 'bg-amber-500/20 border-amber-500 text-amber-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              <span>Motorista</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedRoleForNewLogin('gestor')}
              className={`py-2 px-3 rounded-xl text-xs font-bold border flex items-center justify-center gap-1.5 transition-all ${
                selectedRoleForNewLogin === 'gestor'
                  ? 'bg-blue-500/20 border-blue-500 text-blue-400'
                  : 'bg-slate-950 border-slate-800 text-slate-400'
              }`}
            >
              <Shield className="w-3.5 h-3.5" />
              <span>Gestor</span>
            </button>
          </div>

          <button
            onClick={handleGoogleLogin}
            disabled={isSigningIn}
            className="w-full py-3 bg-white hover:bg-slate-100 text-slate-950 font-black text-xs rounded-xl shadow-lg flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
          >
            {isSigningIn ? (
              <Loader2 className="w-4 h-4 animate-spin text-slate-950" />
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
            <span>Conectar com Google</span>
          </button>

          {authError && (
            <p className="text-[11px] text-amber-400 mt-2 text-center">{authError}</p>
          )}
        </div>
      </div>
    </div>
  );
};
