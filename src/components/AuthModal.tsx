import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api'; // Sesuaikan lokasi/path file api.ts milikmu
import {
  X,
  LogIn,
  UserPlus,
  GraduationCap,
  AlertTriangle,
  MailCheck
} from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const DISALLOWED_PERSONAL_DOMAINS = [
  'gmail.com',
  'yahoo.com',
  'yahoo.co.id',
  'hotmail.com',
  'outlook.com',
  'live.com',
  'icloud.com',
  'mail.com',
  'aol.com',
  'yandex.com'
];

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { login, register, verifyEmail } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Tampilan Verifikasi OTP setelah Pendaftaran
  const [justRegisteredEmail, setJustRegisteredEmail] = useState<string | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);
  const [isResending, setIsResending] = useState(false);

const handleResendOtp = async () => {
  if (!justRegisteredEmail) return;

  setIsResending(true);
  try {
    await api.auth.resendOtp(justRegisteredEmail);
    showToast('Kode OTP baru berhasil dikirim ke email Anda!', 'success');
  } catch (err: any) {
    showToast(err.message || 'Gagal mengirim ulang kode.', 'error');
  } finally {
    setIsResending(false);
  }
};

  if (!isOpen) return null;

  // Validasi real-time email domain kampus
  const getEmailValidationError = (value: string): string | null => {
    if (!value) return null;
    const trimmed = value.trim().toLowerCase();
    const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    
    if (trimmed.includes('@') && !emailRegex.test(trimmed)) {
      return 'Format penulisan email belum lengkap.';
    }

    const atIndex = trimmed.lastIndexOf('@');
    if (atIndex !== -1) {
      const domain = trimmed.substring(atIndex + 1);
      if (DISALLOWED_PERSONAL_DOMAINS.includes(domain)) {
        return `Email pribadi (@${domain}) tidak diizinkan. Harap gunakan email mahasiswa resmi kampus.`;
      }
      if (domain.includes('.') && !domain.endsWith('.ac.id') && !domain.includes('.student.') && !domain.startsWith('student.') && !domain.startsWith('students.')) {
        return `Domain '@${domain}' bukan domain kampus resmi. Harap gunakan email kampus Anda.`;
      }
    }
    return null;
  };

  const inlineEmailError = getEmailValidationError(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const validationError = getEmailValidationError(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email.trim(), password);
        showToast(`Selamat datang kembali, ${res.user.name || 'Mahasiswa'}!`, 'success');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        // Format otomatis WA ke 62...
        const formattedWhatsapp = whatsapp.trim().replace(/^0/, '62');

        await register({
          name: name.trim(),
          email: email.trim(),
          password,
          campus: campus.trim(),
          whatsapp: formattedWhatsapp
        });

        showToast('Kode verifikasi telah dikirim ke email kampus Anda!', 'success');
        setJustRegisteredEmail(email.trim());
      }
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan saat autentikasi.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    if (!justRegisteredEmail || !inputCode.trim()) return;

    setIsVerifyingCode(true);
    try {
      // Verifikasi OTP dan otomatis login
      await verifyEmail(justRegisteredEmail, inputCode.trim());
      showToast('Email berhasil diverifikasi! Anda resmi masuk.', 'success');
      setJustRegisteredEmail(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Kode verifikasi 6-digit salah atau kadaluwarsa.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
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

        {/* Modal Branding Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <GraduationCap className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            {justRegisteredEmail
              ? 'Verifikasi Email Kampus'
              : mode === 'login'
              ? 'Masuk ke CampusCycle'
              : 'Daftar Akun Mahasiswa'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {justRegisteredEmail
              ? 'Masukkan 6 digit kode yang dikirim ke Gmail kampus Anda.'
              : mode === 'login'
              ? 'Khusus mahasiswa dengan email resmi kampus (@student.* atau *.ac.id).'
              : 'Mendaftar menggunakan email kampus untuk bergabung dalam ekosistem terpercaya.'}
          </p>
        </div>

        {/* Tampilan Input Kode OTP setelah Submit Registrasi */}
        {justRegisteredEmail ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-1.5">
              <div className="flex items-center gap-1.5 font-bold">
                <MailCheck className="w-4 h-4 text-emerald-600" />
                <span>Cek Inbox Gmail Kampus Anda</span>
              </div>
              <p className="text-slate-700">
                Kami telah mengirimkan 6-digit kode OTP ke: <strong>{justRegisteredEmail}</strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1.5">
                Masukkan Kode Verifikasi 6-Digit:
              </label>
              <input
                type="text"
                maxLength={6}
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value.replace(/\D/g, ''))}
                placeholder="Contoh: 123456"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-lg font-mono tracking-widest font-bold focus:outline-emerald-600 focus:bg-white"
              />
            </div>
            {/* Tombol Kirim Ulang Kode */}
            <div className="flex items-center justify-between text-xs px-1">
              <span className="text-slate-500">Belum menerima kode?</span>
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={isResending}
                className="text-emerald-600 hover:text-emerald-700 font-bold hover:underline disabled:opacity-50"
              >
                {isResending ? 'Mengirim...' : 'Kirim Ulang Kode'}
              </button>
            </div>

            <button
              type="button"
              onClick={handleConfirmVerification}
              disabled={isVerifyingCode || inputCode.length < 6}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors"
            >
              {isVerifyingCode ? 'Memverifikasi...' : 'Verifikasi & Masuk Sekarang'}
            </button>
          </div>
        ) : (
          <>
            {/* Tab switch */}
            <div className="flex border-b border-slate-200 mb-4 text-xs font-bold">
              <button
                type="button"
                onClick={() => {
                  setMode('login');
                  setErrorMessage('');
                }}
                className={`flex-1 pb-2.5 transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  mode === 'login'
                    ? 'text-emerald-700 border-emerald-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Masuk Akun</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setMode('register');
                  setErrorMessage('');
                }}
                className={`flex-1 pb-2.5 transition-colors border-b-2 flex items-center justify-center gap-1.5 ${
                  mode === 'register'
                    ? 'text-emerald-700 border-emerald-600'
                    : 'text-slate-400 border-transparent hover:text-slate-600'
                }`}
              >
                <UserPlus className="w-3.5 h-3.5" />
                <span>Daftar Baru</span>
              </button>
            </div>

            {/* Error Notification */}
            {errorMessage && (
              <div className="mb-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-700 font-medium flex items-start gap-2">
                <AlertTriangle className="w-4 h-4 text-rose-500 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Form */}
            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              {mode === 'register' && (
                <>
                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Lengkap Mahasiswa *
                    </label>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Contoh: Ahmad Rizki"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nama Kampus
                    </label>
                    <input
                      type="text"
                      value={campus}
                      onChange={(e) => setCampus(e.target.value)}
                      placeholder="Contoh: UIN Malang / Univ. Brawijaya"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
                    />
                  </div>

                  <div>
                    <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Nomor WhatsApp Penjual
                    </label>
                    <input
                      type="text"
                      value={whatsapp}
                      onChange={(e) => setWhatsapp(e.target.value)}
                      placeholder="081234567890"
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
                    />
                  </div>
                </>
              )}

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Email Mahasiswa Kampus *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errorMessage) setErrorMessage('');
                  }}
                  placeholder="nama@student.uin-malang.ac.id"
                  className={`w-full px-3 py-2.5 bg-slate-50 border rounded-xl text-sm focus:bg-white transition-all ${
                    inlineEmailError
                      ? 'border-rose-400 focus:outline-rose-500'
                      : 'border-slate-200 focus:outline-emerald-600'
                  }`}
                />

                {inlineEmailError ? (
                  <p className="text-[11px] text-rose-600 mt-1 font-medium leading-tight">
                    {inlineEmailError}
                  </p>
                ) : (
                  <span className="text-[10px] text-slate-400 mt-1 block">
                    Wajib menggunakan domain kampus resmi (@student.* atau berakhiran .ac.id).
                  </span>
                )}
              </div>

              <div>
                <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Kata Sandi *
                </label>
                <input
                  type="password"
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimal 6 karakter"
                  className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
                />
              </div>

              <button
                type="submit"
                disabled={isLoading || Boolean(inlineEmailError)}
                className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors mt-2"
              >
                {isLoading
                  ? 'Memproses...'
                  : mode === 'login'
                  ? 'Masuk ke Akun Mahasiswa'
                  : 'Daftar Akun Mahasiswa'}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};