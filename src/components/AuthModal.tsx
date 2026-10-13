import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import {
  X,
  LogIn,
  UserPlus,
  GraduationCap,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
  Lock,
  MailCheck,
  CheckCircle2,
  RefreshCw
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
  const {
    login,
    register,
    verifyEmail,
    loginAsDemoStudent,
    loginAsDemoKtmStudent,
    loginAsDemoAdmin
  } = useAuth();
  const { showToast } = useToast();

  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [campus, setCampus] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [demoLoading, setDemoLoading] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');

  // Post-registration email verification step
  const [justRegisteredUser, setJustRegisteredUser] = useState<{ id: string; email: string; code?: string } | null>(null);
  const [inputCode, setInputCode] = useState('');
  const [isVerifyingCode, setIsVerifyingCode] = useState(false);

  if (!isOpen) return null;

  // Real-time email validation check
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
        return `Email pribadi (@${domain}) tidak diizinkan. Harap gunakan email mahasiswa resmi kampus (misal: @student.uin-malang.ac.id atau .ac.id).`;
      }
      if (domain.includes('.') && !domain.endsWith('.ac.id') && !domain.includes('.student.') && !domain.startsWith('student.') && !domain.startsWith('students.')) {
        return `Domain '@${domain}' bukan domain kampus yang diizinkan. Harap gunakan email kampus resmi Anda.`;
      }
    }
    return null;
  };

  const inlineEmailError = getEmailValidationError(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    // Pre-flight validation
    const validationError = getEmailValidationError(email);
    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    setIsLoading(true);

    try {
      if (mode === 'login') {
        const res = await login(email.trim(), password);
        showToast(`Selamat datang kembali, ${res.user.name}!`, 'success');
        onClose();
        if (onSuccess) onSuccess();
      } else {
        const res = await register({
          name: name.trim(),
          email: email.trim(),
          password,
          campus: campus.trim(),
          whatsapp: whatsapp.trim()
        });

        showToast('Pendaftaran akun berhasil!', 'success');
        setJustRegisteredUser({
          id: res.user.id,
          email: res.user.email,
          code: (res as any).verificationCode
        });
        setInputCode((res as any).verificationCode || '');
      }
    } catch (err: any) {
      const msg = err.message || 'Terjadi kesalahan pada server saat autentikasi.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmVerification = async () => {
    setIsVerifyingCode(true);
    try {
      await verifyEmail(inputCode.trim());
      showToast('Email kampus Anda berhasil diverifikasi!', 'success');
      setJustRegisteredUser(null);
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Gagal memverifikasi kode email.', 'error');
    } finally {
      setIsVerifyingCode(false);
    }
  };

  // Demo Login handlers
  const handleDemoStudent = async () => {
    setErrorMessage('');
    setDemoLoading('student');
    try {
      const res = await loginAsDemoStudent();
      showToast(`Berhasil masuk mode demo: ${res.user.name} (UIN Malang)`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Gagal masuk mode demo.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleDemoKtmStudent = async () => {
    setErrorMessage('');
    setDemoLoading('ktm_student');
    try {
      const res = await loginAsDemoKtmStudent();
      showToast(`Berhasil masuk mode demo: ${res.user.name} (KTM Terverifikasi)`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Gagal masuk mode demo.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setDemoLoading(null);
    }
  };

  const handleDemoAdmin = async () => {
    setErrorMessage('');
    setDemoLoading('admin');
    try {
      const res = await loginAsDemoAdmin();
      showToast(`Berhasil masuk mode demo: Administrator CampusCycle`, 'success');
      onClose();
      if (onSuccess) onSuccess();
    } catch (err: any) {
      const msg = err.message || 'Gagal masuk mode demo admin.';
      setErrorMessage(msg);
      showToast(msg, 'error');
    } finally {
      setDemoLoading(null);
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
            {justRegisteredUser
              ? 'Verifikasi Email Kampus'
              : mode === 'login'
              ? 'Masuk ke CampusCycle'
              : 'Daftar Akun Mahasiswa'}
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            {justRegisteredUser
              ? 'Konfirmasi kode verifikasi untuk mengaktifkan akun mahasiswa Anda.'
              : mode === 'login'
              ? 'Khusus mahasiswa dengan email resmi kampus (@student.* atau *.ac.id).'
              : 'Mendaftar menggunakan email kampus untuk bergabung dalam ekosistem terpercaya.'}
          </p>
        </div>

        {/* Registration Email Verification View */}
        {justRegisteredUser ? (
          <div className="space-y-4 text-xs">
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 space-y-2">
              <div className="flex items-center gap-1.5 font-bold">
                <MailCheck className="w-4 h-4 text-emerald-600" />
                <span>Pendaftaran Berhasil!</span>
              </div>
              <p className="text-slate-700">
                Email Anda: <strong>{justRegisteredUser.email}</strong>
              </p>
              <p className="text-emerald-800 text-[11px]">
                Kode verifikasi email mahasiswa Anda adalah:{' '}
                <strong className="font-mono text-emerald-950 text-sm bg-white px-2 py-0.5 rounded border border-emerald-300">
                  {justRegisteredUser.code}
                </strong>
              </p>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1">
                Masukkan Kode Verifikasi 6-Digit:
              </label>
              <input
                type="text"
                value={inputCode}
                onChange={(e) => setInputCode(e.target.value)}
                placeholder="Misal: 123456"
                className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-center text-base font-mono tracking-widest font-bold focus:outline-emerald-600 focus:bg-white"
              />
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => {
                  setJustRegisteredUser(null);
                  onClose();
                  if (onSuccess) onSuccess();
                }}
                className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
              >
                Nanti Saja
              </button>
              <button
                type="button"
                onClick={handleConfirmVerification}
                disabled={isVerifyingCode || !inputCode.trim()}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold flex items-center justify-center gap-1.5 shadow-xs"
              >
                {isVerifyingCode ? 'Memverifikasi...' : 'Verifikasi Sekarang'}
              </button>
            </div>
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

            {/* SEPARATED LOCAL DEMO MODE SECTION */}
            <div className="mt-6 pt-5 border-t border-slate-200">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-slate-700">
                  <Sparkles className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                  <span>Mode Demo Lokal (Pengujian)</span>
                </div>
                <p className="text-[11px] text-slate-500 leading-relaxed">
                  Disediakan khusus untuk menguji alur aplikasi di lingkungan pratinjau. Mode demo terpisah dari login akun produksi dan bukan bukti identitas mahasiswa asli.
                </p>

                <div className="space-y-1.5 pt-1">
                  <button
                    type="button"
                    onClick={handleDemoStudent}
                    disabled={Boolean(demoLoading)}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-slate-700 hover:text-emerald-800 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {demoLoading === 'student' ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-emerald-600" />
                      ) : (
                        <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
                      )}
                      <span>Demo Mahasiswa (Bintang Pratama)</span>
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold">UIN Malang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoKtmStudent}
                    disabled={Boolean(demoLoading)}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-blue-50 border border-slate-200 hover:border-blue-300 text-slate-700 hover:text-blue-800 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {demoLoading === 'ktm_student' ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-blue-600" />
                      ) : (
                        <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                      )}
                      <span>Demo Mahasiswa KTM (Siti Rahma)</span>
                    </span>
                    <span className="text-[10px] text-blue-700 font-bold">UB Malang</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleDemoAdmin}
                    disabled={Boolean(demoLoading)}
                    className="w-full py-2 px-3 rounded-lg bg-white hover:bg-purple-50 border border-slate-200 hover:border-purple-300 text-slate-700 hover:text-purple-800 text-xs font-semibold flex items-center justify-between transition-colors shadow-2xs"
                  >
                    <span className="flex items-center gap-1.5">
                      {demoLoading === 'admin' ? (
                        <RefreshCw className="w-3 h-3 animate-spin text-purple-600" />
                      ) : (
                        <Lock className="w-3.5 h-3.5 text-purple-600" />
                      )}
                      <span>Demo Administrator CampusCycle</span>
                    </span>
                    <span className="text-[10px] text-purple-700 font-bold">Admin</span>
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};
