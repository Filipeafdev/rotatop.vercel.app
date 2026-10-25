import React from 'react';
import { UserProfile, UserRole } from '../types';
import {
  Truck,
  Shield,
  User,
  LogOut,
  MapPin,
  ChevronDown,
  Navigation,
  Sparkles,
  KeyRound,
  ArrowRightLeft,
} from 'lucide-react';

interface NavbarProps {
  currentUser: UserProfile;
  currentRole: UserRole;
  onChangeRole: (role: UserRole) => void;
  onOpenAuthModal: () => void;
  onLogout: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentUser,
  currentRole,
  onChangeRole,
  onOpenAuthModal,
  onLogout,
}) => {
  return (
    <header className="sticky top-0 z-40 bg-slate-950/95 backdrop-blur-md border-b border-slate-800">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-16 flex items-center justify-between gap-2 sm:gap-3">
        {/* Brand Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-amber-500 via-amber-400 to-emerald-400 p-0.5 shadow-lg shadow-amber-500/20 shrink-0">
            <div className="w-full h-full bg-slate-950 rounded-[14px] flex items-center justify-center text-amber-400">
              <Navigation className="w-5 h-5 fill-amber-400" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="text-base sm:text-lg font-black tracking-tight text-white font-mono">
                ROTA<span className="text-amber-400">TOP</span>
              </span>
              <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/30 px-1.5 py-0.2 rounded font-mono font-bold">
                PRO
              </span>
            </div>
            <p className="text-[10px] text-slate-400 hidden sm:block">
              Gestão Logística, Romaneio & Combustível
            </p>
          </div>
        </div>

        {/* Center: Role Switcher (Portal do Motorista vs Portal do Gestor) */}
        <div className="flex bg-slate-900 p-1 rounded-xl border border-slate-800 shadow-inner">
          <button
            onClick={() => onChangeRole('motorista')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              currentRole === 'motorista'
                ? 'bg-amber-500 text-slate-950 shadow-md shadow-amber-500/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Motorista</span>
          </button>

          <button
            onClick={() => onChangeRole('gestor')}
            className={`px-2.5 sm:px-3 py-1.5 rounded-lg text-xs font-black uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer ${
              currentRole === 'gestor'
                ? 'bg-blue-600 text-white shadow-md shadow-blue-900/30'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Gestor</span>
          </button>
        </div>

        {/* Right User & Account Area */}
        <div className="flex items-center gap-2">
          <button
            onClick={onOpenAuthModal}
            className="flex items-center gap-2 p-1.5 sm:px-3 sm:py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-800 transition-all cursor-pointer"
            title="Abrir portais de login separados (Motorista e Gestor)"
          >
            <div
              className={`w-7 h-7 rounded-lg font-black text-xs flex items-center justify-center border ${
                currentRole === 'motorista'
                  ? 'bg-amber-500/20 text-amber-400 border-amber-500/30'
                  : 'bg-blue-600/20 text-blue-400 border-blue-500/30'
              }`}
            >
              {currentUser.displayName.substring(0, 2).toUpperCase()}
            </div>
            <div className="hidden md:block text-left">
              <span className="text-xs font-bold text-white block leading-tight truncate max-w-[120px]">
                {currentUser.displayName}
              </span>
              <span className="text-[10px] text-slate-400 capitalize block leading-none">
                Portal: {currentUser.role}
              </span>
            </div>
            <ArrowRightLeft className="w-3.5 h-3.5 text-slate-400 hidden sm:block" />
          </button>
        </div>
      </div>
    </header>
  );
};
