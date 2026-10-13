import React from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { Store, PlusCircle, Package, ShieldCheck, ShieldAlert, LogIn, UserCheck, Shield } from 'lucide-react';

interface NavbarProps {
  activeTab: 'explore' | 'sell' | 'dashboard' | 'admin' | 'profile';
  setActiveTab: (tab: 'explore' | 'sell' | 'dashboard' | 'admin' | 'profile') => void;
  myItemsCount: number;
  openAuthModal: () => void;
  openKtmModal: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  myItemsCount,
  openAuthModal,
  openKtmModal
}) => {
  const { user } = useAuth();

  return (
    <>
      {/* Top domain bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-2">
            <span className="inline-block w-2 h-2 rounded-full bg-emerald-400"></span>
            <span className="font-mono text-slate-200 font-semibold tracking-wider">campuscycle.id</span>
            <span className="hidden md:inline text-slate-400">| Pasar Preloved Eksklusif Mahasiswa</span>
          </div>
          <div className="flex items-center gap-4 text-xs font-medium">
            <span className="hidden sm:inline text-emerald-400">0% Biaya Admin</span>
            <span className="text-slate-400">COD Aman Kampus</span>
          </div>
        </div>
      </div>

      {/* Main header navbar adhering to Top Bar Contract */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16 items-center gap-8">
            {/* Zone 1: Single text element brand wordmark */}
            <button
              onClick={() => setActiveTab('explore')}
              className="flex items-center gap-2.5 text-left shrink-0 cursor-pointer focus:outline-none"
            >
              <div className="w-9 h-9 rounded-xl bg-emerald-600 flex items-center justify-center text-white shadow-sm shadow-emerald-200">
                <span className="font-black text-base tracking-tighter">CC</span>
              </div>
              <div>
                <span className="text-lg font-bold tracking-tight text-slate-900 leading-tight block">
                  CampusCycle
                </span>
                <span className="text-[10px] font-semibold text-slate-400 tracking-wider uppercase block">
                  Marketplace Kampus
                </span>
              </div>
            </button>

            {/* Zone 2: Clean single-line nav links */}
            <nav className="hidden md:flex items-center gap-1">
              <button
                onClick={() => setActiveTab('explore')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'explore'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                }`}
              >
                <Store className="w-4 h-4" />
                <span>Etalase Kampus</span>
              </button>

              <button
                onClick={() => setActiveTab('sell')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'sell'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                }`}
              >
                <PlusCircle className="w-4 h-4" />
                <span>Jual Barang</span>
              </button>

              <button
                onClick={() => setActiveTab('dashboard')}
                className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                  activeTab === 'dashboard'
                    ? 'text-emerald-700 bg-emerald-50'
                    : 'text-slate-600 hover:text-emerald-700 hover:bg-slate-50'
                }`}
              >
                <Package className="w-4 h-4" />
                <span>Barang Saya</span>
                {user && (
                  <span className="ml-0.5 text-xs font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700">
                    {myItemsCount}
                  </span>
                )}
              </button>

              {user?.role === 'admin' && (
                <button
                  onClick={() => setActiveTab('admin')}
                  className={`px-3.5 py-2 rounded-lg text-sm font-semibold transition-colors flex items-center gap-2 whitespace-nowrap shrink-0 ${
                    activeTab === 'admin'
                      ? 'text-purple-700 bg-purple-50'
                      : 'text-slate-600 hover:text-purple-700 hover:bg-slate-50'
                  }`}
                >
                  <Shield className="w-4 h-4 text-purple-600" />
                  <span>Admin Panel</span>
                </button>
              )}
            </nav>

            {/* Zone 3: Primary action / user status */}
            <div className="flex items-center gap-3 shrink-0">
              {user ? (
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('profile')}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors text-left"
                  >
                    <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                    <div className="hidden sm:block text-xs">
                      <span className="font-bold text-slate-800 block truncate max-w-[120px]">
                        {user.name}
                      </span>
                      <span className="text-[10px] text-slate-500 block truncate max-w-[120px]">
                        {user.campus || 'Mahasiswa'}
                      </span>
                    </div>

                    {user.verificationStatus !== 'unverified' ? (
                      <span
                        title={
                          user.verificationStatus === 'ktm_verified'
                            ? 'Terverifikasi KTM Resmi'
                            : 'Terverifikasi Email Kampus'
                        }
                      >
                        <ShieldCheck className="w-4 h-4 text-emerald-600 ml-1 shrink-0" />
                      </span>
                    ) : (
                      <span title="Belum Terverifikasi">
                        <ShieldAlert className="w-4 h-4 text-amber-500 ml-1 shrink-0" />
                      </span>
                    )}
                  </button>

                  {user.verificationStatus === 'unverified' && (
                    <button
                      onClick={openKtmModal}
                      className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100 transition-colors whitespace-nowrap"
                    >
                      <UserCheck className="w-3.5 h-3.5" />
                      <span>Verifikasi KTM</span>
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={openAuthModal}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs sm:text-sm font-semibold shadow-sm transition-colors flex items-center gap-1.5 whitespace-nowrap shrink-0"
                >
                  <LogIn className="w-4 h-4" />
                  <span>Masuk / Daftar</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile bottom tabs bar */}
        <div className="md:hidden flex border-t border-slate-200 bg-white justify-around py-2">
          <button
            onClick={() => setActiveTab('explore')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'explore' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Store className="w-5 h-5 mb-0.5" />
            <span>Etalase</span>
          </button>
          <button
            onClick={() => setActiveTab('sell')}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'sell' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <PlusCircle className="w-5 h-5 mb-0.5" />
            <span>Jual</span>
          </button>
          <button
            onClick={() => setActiveTab('dashboard')}
            className={`flex flex-col items-center text-xs font-medium relative ${
              activeTab === 'dashboard' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <Package className="w-5 h-5 mb-0.5" />
            <span>Saya</span>
            {user && myItemsCount > 0 && (
              <span className="absolute top-0 right-1 w-2 h-2 rounded-full bg-emerald-500" />
            )}
          </button>
          <button
            onClick={() => (user ? setActiveTab('profile') : openAuthModal())}
            className={`flex flex-col items-center text-xs font-medium ${
              activeTab === 'profile' ? 'text-emerald-600' : 'text-slate-500'
            }`}
          >
            <ShieldCheck className="w-5 h-5 mb-0.5" />
            <span>{user ? 'Akun' : 'Masuk'}</span>
          </button>
        </div>
      </header>
    </>
  );
};
