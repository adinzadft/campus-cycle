import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import {
  X,
  CreditCard,
  Upload,
  ShieldCheck,
  Clock,
  AlertCircle,
  Lock,
  Building2
} from 'lucide-react';

interface KTMVerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const KTMVerificationModal: React.FC<KTMVerificationModalProps> = ({
  isOpen,
  onClose
}) => {
  const { user, submitKtm } = useAuth();
  const { showToast } = useToast();

  const [studentId, setStudentId] = useState(user?.studentId || '');
  const [campus, setCampus] = useState(user?.campus || '');
  const [ktmImagePreview, setKtmImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran file maksimal 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      setKtmImagePreview(event.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ktmImagePreview) {
      showToast('Foto KTM wajib dipilih!', 'error');
      return;
    }

    if (!studentId.trim()) {
      showToast('Nomor Induk Mahasiswa (NIM) wajib diisi!', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await submitKtm({
        studentId: studentId.trim(),
        campus: campus.trim() || user?.campus,
        ktmImageUrl: ktmImagePreview
      });
      showToast('KTM berhasil diajukan dan sedang dalam antrean pemeriksaan admin!', 'success');
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengirim pengajuan KTM.', 'error');
    } finally {
      setIsSubmitting(false);
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

        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-emerald-100 text-emerald-700 rounded-2xl flex items-center justify-center mx-auto mb-3 shadow-2xs">
            <CreditCard className="w-6 h-6" />
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-slate-900">
            Verifikasi Kartu Mahasiswa (KTM)
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Solusi alternatif jika Anda tidak memiliki akses email domain resmi kampus.
          </p>
        </div>

        {/* Existing Status Indicator */}
        {user?.ktmStatus === 'pending' && (
          <div className="mb-4 p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <Clock className="w-4 h-4 text-blue-600" />
              <span>Status: Menunggu Pemeriksaan Admin</span>
            </div>
            <p className="text-blue-700">
              Pengajuan KTM Anda sudah kami terima. Admin akan memeriksa kesesuaian nama dan NIM sebelum menyetujui akun Anda.
            </p>
          </div>
        )}

        {user?.ktmStatus === 'rejected' && (
          <div className="mb-4 p-4 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <AlertCircle className="w-4 h-4 text-rose-600" />
              <span>Pengajuan Sebelumnya Ditolak</span>
            </div>
            <p className="text-rose-700">
              Catatan Admin: {user.ktmNotes || 'Foto KTM buram atau tidak terbaca.'} Silakan unggah ulang foto KTM yang lebih jelas.
            </p>
          </div>
        )}

        {user?.verificationStatus === 'ktm_verified' && (
          <div className="mb-4 p-4 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-900 space-y-1">
            <div className="flex items-center gap-1.5 font-bold">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Akun Anda Sudah Terverifikasi Resmi</span>
            </div>
            <p className="text-emerald-700">
              Identitas KTM Anda telah disetujui. Anda bebas menjual dan berbelanja di CampusCycle.
            </p>
          </div>
        )}

        {/* Upload Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nomor Induk Mahasiswa (NIM) *
            </label>
            <input
              type="text"
              required
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              placeholder="Contoh: 210605110023"
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Nama Universitas / Politeknik *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Contoh: Universitas Brawijaya"
                className="w-full pl-9 pr-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold text-slate-700 uppercase tracking-wider mb-1">
              Foto Fisik / Digital KTM Asli *
            </label>
            <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-2">
              {ktmImagePreview ? (
                <div className="relative max-w-xs mx-auto aspect-16/10 rounded-xl overflow-hidden border border-slate-200 shadow-2xs">
                  <img
                    src={ktmImagePreview}
                    alt="Preview KTM"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => setKtmImagePreview(null)}
                    className="absolute top-2 right-2 px-2 py-0.5 bg-slate-900/80 text-white rounded text-[10px] font-bold"
                  >
                    Ganti
                  </button>
                </div>
              ) : (
                <div>
                  <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold shadow-2xs transition-colors">
                    <Upload className="w-4 h-4 text-emerald-600" />
                    <span>Pilih Foto KTM</span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      className="hidden"
                    />
                  </label>
                  <p className="text-[10px] text-slate-400 mt-1.5">
                    Pastikan foto fokus, nama, foto diri, dan NIM terlihat jelas.
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Privacy Guarantee Notice */}
          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] text-slate-600 flex items-start gap-2">
            <Lock className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <p>
              <strong>Jaminan Privasi:</strong> Foto KTM hanya digunakan oleh admin untuk verifikasi status mahasiswa aktif dan TIDAK AKAN PERNAH ditampilkan di profil publik atau produk jualan Anda.
            </p>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || user?.verificationStatus === 'ktm_verified'}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-xs transition-colors mt-2"
          >
            {isSubmitting ? 'Mengunggah Data...' : 'Kirim Pengajuan Verifikasi'}
          </button>
        </form>
      </div>
    </div>
  );
};
