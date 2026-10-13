import React, { useState, useEffect } from 'react';
import { KTMRequest, ProductReport } from '../types/index.ts';
import { api } from '../services/api.ts';
import { useToast } from './Toast.tsx';
import {
  Shield,
  CreditCard,
  CheckCircle,
  XCircle,
  Eye,
  AlertTriangle,
  Trash2,
  RefreshCw,
  Clock,
  Sparkles
} from 'lucide-react';

export const AdminPanel: React.FC = () => {
  const { showToast } = useToast();

  const [stats, setStats] = useState<{
    totalProducts: number;
    availableProducts: number;
    soldProducts: number;
    demoProducts: number;
    pendingKtm: number;
    totalReports: number;
  } | null>(null);

  const [ktmRequests, setKtmRequests] = useState<KTMRequest[]>([]);
  const [reports, setReports] = useState<ProductReport[]>([]);
  const [selectedKtm, setSelectedKtm] = useState<KTMRequest | null>(null);
  const [reviewNotes, setReviewNotes] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [s, ktm, rep] = await Promise.all([
        api.admin.getStats(),
        api.admin.getKtmRequests(),
        api.admin.getReports(),
      ]);
      setStats(s);
      setKtmRequests(ktm);
      setReports(rep);
    } catch {
      showToast('Gagal memuat data admin.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleReviewKtm = async (requestId: string, decision: 'approved' | 'rejected') => {
    setIsProcessing(true);
    try {
      const res = await api.admin.reviewKtm(requestId, decision, reviewNotes);
      showToast(res.message, 'success');
      setSelectedKtm(null);
      setReviewNotes('');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal memproses verifikasi KTM.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleClearDemo = async () => {
    if (!confirm('Apakah Anda yakin ingin menghapus semua barang contoh/demo dari etalase?')) {
      return;
    }
    try {
      const res = await api.admin.clearDemo();
      showToast(res.message, 'info');
      loadData();
    } catch (err: any) {
      showToast(err.message || 'Gagal membersihkan data demo.', 'error');
    }
  };

  return (
    <div className="space-y-6 my-6">
      {/* Top Banner */}
      <div className="bg-slate-900 rounded-2xl p-6 text-white flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 text-purple-400 text-xs font-bold uppercase tracking-wider mb-1">
            <Shield className="w-4 h-4" />
            <span>CampusCycle Internal Administration</span>
          </div>
          <h2 className="text-xl font-extrabold tracking-tight">
            Panel Pengawas & Verifikasi Mahasiswa
          </h2>
          <p className="text-slate-400 text-xs mt-1">
            Validasi identitas KTM, tanggapi laporan pengguna, dan pantau kesehatan pasar kampus.
          </p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={loadData}
            disabled={isLoading}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>

          <button
            onClick={handleClearDemo}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold flex items-center gap-1.5 transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Hapus Barang Demo</span>
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs">
          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Antrean Verifikasi KTM
            </span>
            <span className="text-2xl font-black text-purple-600 tabular-nums">
              {stats.pendingKtm}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">
              Total Barang Etalase
            </span>
            <span className="text-2xl font-black text-slate-900 tabular-nums">
              {stats.totalProducts}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
              Barang Tersedia (Aktif)
            </span>
            <span className="text-2xl font-black text-emerald-700 tabular-nums">
              {stats.availableProducts}
            </span>
          </div>

          <div className="bg-white p-4 rounded-xl border border-slate-200">
            <span className="text-[10px] font-bold text-rose-600 uppercase tracking-wider block">
              Laporan Pelanggaran
            </span>
            <span className="text-2xl font-black text-rose-600 tabular-nums">
              {stats.totalReports}
            </span>
          </div>
        </div>
      )}

      {/* KTM Review Queue Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <div className="flex justify-between items-center pb-3 border-b border-slate-100">
          <div>
            <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
              <CreditCard className="w-5 h-5 text-purple-600" />
              <span>Antrean Pengajuan Kartu Mahasiswa (KTM)</span>
            </h3>
            <p className="text-slate-500 text-xs mt-0.5">
              Periksa kecocokan nama mahasiswa dan NIM sebelum menyetujui akses penjualan.
            </p>
          </div>
        </div>

        {ktmRequests.length === 0 ? (
          <div className="py-8 text-center text-slate-400 text-xs">
            Belum ada pengajuan verifikasi KTM.
          </div>
        ) : (
          <div className="space-y-3">
            {ktmRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-sm">{req.userName}</span>
                    <span className="text-slate-400">·</span>
                    <span className="font-mono text-slate-600">NIM: {req.studentId}</span>
                    <span className="text-slate-400">·</span>
                    <span
                      className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                        req.status === 'pending'
                          ? 'bg-amber-100 text-amber-800'
                          : req.status === 'approved'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {req.status === 'pending'
                        ? 'MENUNGGU'
                        : req.status === 'approved'
                        ? 'DISETUJUI'
                        : 'DITOLAK'}
                    </span>
                  </div>

                  <p className="text-slate-500">
                    Kampus: <strong className="text-slate-700">{req.campus}</strong> | Email:{' '}
                    <span className="font-mono">{req.userEmail}</span>
                  </p>

                  <div className="text-[10px] text-slate-400 flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    <span>
                      Diajukan:{' '}
                      {new Date(req.submittedAt).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                    {req.reviewedBy && (
                      <span className="ml-2 font-medium text-slate-500">
                        (Ditinjau oleh {req.reviewedBy})
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setSelectedKtm(req);
                      setReviewNotes(req.notes || '');
                    }}
                    className="px-3 py-1.5 rounded-lg border border-slate-300 hover:bg-white text-slate-700 font-semibold flex items-center gap-1.5 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Lihat & Tinjau</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Reported Products Section */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
        <h3 className="font-bold text-slate-900 text-base flex items-center gap-2">
          <AlertTriangle className="w-5 h-5 text-rose-600" />
          <span>Laporan Barang dari Mahasiswa</span>
        </h3>

        {reports.length === 0 ? (
          <div className="py-6 text-center text-slate-400 text-xs">
            Tidak ada laporan barang yang dilaporkan. Pasar kondusif.
          </div>
        ) : (
          <div className="space-y-2 text-xs">
            {reports.map((rep) => (
              <div
                key={rep.id}
                className="p-3.5 rounded-xl border border-rose-100 bg-rose-50/40 flex justify-between items-center"
              >
                <div>
                  <span className="font-bold text-slate-900">{rep.productName}</span>
                  <p className="text-rose-700 mt-0.5">Alasan: {rep.reason}</p>
                  <span className="text-[10px] text-slate-400">
                    Pelapor: {rep.reporterEmail} ·{' '}
                    {new Date(rep.createdAt).toLocaleDateString('id-ID')}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* KTM Inspection & Decision Modal */}
      {selectedKtm && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 shadow-2xl my-auto">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">
                Pemeriksaan Kartu Tanda Mahasiswa (KTM)
              </h3>
              <button
                onClick={() => setSelectedKtm(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-2 text-xs">
              <p>
                <strong>Nama Mahasiswa:</strong> {selectedKtm.userName}
              </p>
              <p>
                <strong>NIM:</strong> {selectedKtm.studentId}
              </p>
              <p>
                <strong>Kampus:</strong> {selectedKtm.campus}
              </p>
              <p>
                <strong>Email Terdaftar:</strong> {selectedKtm.userEmail}
              </p>
            </div>

            {/* Private KTM Image Container */}
            <div className="rounded-xl overflow-hidden border border-slate-200 bg-slate-100 aspect-16/10">
              <img
                src={selectedKtm.ktmImageUrl}
                alt="Foto KTM Mahasiswa"
                className="w-full h-full object-contain"
              />
            </div>

            {/* Review Notes */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Catatan Verifikasi (opsional jika disetujui / wajib jika ditolak):
              </label>
              <input
                type="text"
                value={reviewNotes}
                onChange={(e) => setReviewNotes(e.target.value)}
                placeholder="Misal: Foto KTM jelas dan sesuai NIM"
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
            </div>

            {/* Decision Buttons */}
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => handleReviewKtm(selectedKtm.id, 'rejected')}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 text-xs font-bold border border-rose-200 flex items-center justify-center gap-1.5 transition-colors"
              >
                <XCircle className="w-4 h-4" />
                <span>Tolak Verifikasi</span>
              </button>

              <button
                onClick={() => handleReviewKtm(selectedKtm.id, 'approved')}
                disabled={isProcessing}
                className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle className="w-4 h-4" />
                <span>Setujui Mahasiswa</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
