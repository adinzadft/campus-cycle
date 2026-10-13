import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';
import {
  X,
  User,
  ShieldCheck,
  ShieldAlert,
  Building2,
  Phone,
  Mail,
  LogOut,
  CreditCard,
  Edit2,
  Check
} from 'lucide-react';

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  openKtmModal: () => void;
}

export const UserProfileModal: React.FC<UserProfileModalProps> = ({
  isOpen,
  onClose,
  openKtmModal
}) => {
  const { user, updateProfile, logout } = useAuth();
  const { showToast } = useToast();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(user?.name || '');
  const [campus, setCampus] = useState(user?.campus || '');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [isSaving, setIsSaving] = useState(false);

  if (!isOpen || !user) return null;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      await updateProfile({
        name: name.trim(),
        campus: campus.trim(),
        whatsapp: whatsapp.trim(),
        studentId: studentId.trim(),
      });
      showToast('Profil berhasil diperbarui.', 'success');
      setIsEditing(false);
    } catch {
      showToast('Gagal memperbarui profil.', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    showToast('Anda telah keluar dari akun.', 'info');
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-md w-full p-6 sm:p-7 shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 w-8 h-8 rounded-full flex items-center justify-center bg-slate-100 hover:bg-slate-200 transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Profile Header */}
        <div className="flex items-center gap-3.5 pb-4 border-b border-slate-100 mb-5">
          <div className="w-14 h-14 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center text-xl font-black shrink-0 shadow-2xs">
            {user.name.charAt(0).toUpperCase()}
          </div>
          <div>
            <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight">
              {user.name}
            </h3>
            <span className="text-xs text-slate-500 block">{user.campus}</span>

            <div className="mt-1 flex items-center gap-1.5">
              {user.verificationStatus !== 'unverified' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200/60">
                  <ShieldCheck className="w-3 h-3" />
                  {user.verificationStatus === 'ktm_verified'
                    ? 'Terverifikasi KTM'
                    : 'Terverifikasi Email Kampus'}
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200/60">
                  <ShieldAlert className="w-3 h-3" />
                  Belum Terverifikasi
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Profile Content */}
        {!isEditing ? (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  Email Terdaftar (Privat)
                </span>
                <span className="font-mono text-slate-800 font-semibold">{user.email}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  No. WhatsApp Penjual
                </span>
                <span className="text-slate-800 font-semibold">{user.whatsapp || '-'}</span>
              </div>

              <div className="flex items-center justify-between text-slate-500">
                <span className="flex items-center gap-1.5 font-medium">
                  <Building2 className="w-3.5 h-3.5 text-slate-400" />
                  Perguruan Tinggi
                </span>
                <span className="text-slate-800 font-semibold">{user.campus}</span>
              </div>

              {user.studentId && (
                <div className="flex items-center justify-between text-slate-500">
                  <span className="flex items-center gap-1.5 font-medium">
                    <User className="w-3.5 h-3.5 text-slate-400" />
                    Nomor Induk Mahasiswa
                  </span>
                  <span className="font-mono text-slate-800 font-semibold">{user.studentId}</span>
                </div>
              )}
            </div>

            {user.verificationStatus === 'unverified' && (
              <div className="p-3.5 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-900 space-y-2.5">
                <p className="font-bold text-amber-950 flex items-center gap-1.5">
                  <ShieldAlert className="w-4 h-4 text-amber-600" />
                  <span>Akun Belum Terverifikasi</span>
                </p>
                <p className="text-amber-800 text-[11px] leading-relaxed">
                  Untuk dapat memasang barang di etalase, Anda wajib memverifikasi email kampus atau mengunggah kartu mahasiswa (KTM).
                </p>

                <div className="space-y-2 pt-1">
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        await api.auth.verifyEmail();
                        showToast('Email kampus Anda berhasil diverifikasi!', 'success');
                        onClose();
                      } catch (err: any) {
                        showToast(err.message || 'Gagal memverifikasi email.', 'error');
                      }
                    }}
                    className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors shadow-2xs"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>Verifikasi Email Mahasiswa</span>
                  </button>

                  <button
                    onClick={() => {
                      onClose();
                      openKtmModal();
                    }}
                    className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-lg text-xs flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Atau Verifikasi via Foto KTM</span>
                  </button>
                </div>
              </div>
            )}

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(true)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <Edit2 className="w-3.5 h-3.5" />
                <span>Edit Profil</span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="py-2.5 px-4 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-1.5 transition-colors"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Keluar</span>
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSave} className="space-y-3 text-xs">
            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Lengkap
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nama Kampus
              </label>
              <input
                type="text"
                required
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                Nomor WhatsApp
              </label>
              <input
                type="text"
                value={whatsapp}
                onChange={(e) => setWhatsapp(e.target.value)}
                placeholder="08123456789"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div>
              <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                NIM (Nomor Mahasiswa)
              </label>
              <input
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="21060511..."
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1"
              >
                <Check className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Menyimpan...' : 'Simpan'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
