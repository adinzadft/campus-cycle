import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import {
  X,
  MessageSquare,
  ShieldCheck,
  MapPin,
  Building2,
  Calendar,
  AlertTriangle,
  Flag,
  Share2
} from 'lucide-react';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
  onProductUpdated?: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({
  product,
  onClose,
}) => {
  const { showToast } = useToast();
  const [showReportInput, setShowReportInput] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isReporting, setIsReporting] = useState(false);

  if (!product) return null;

  const isSold = product.status === 'sold';
  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  const rawWa = product.whatsapp ? product.whatsapp.replace(/[^0-9]/g, '') : '';
  const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa.startsWith('62') ? rawWa : '62' + rawWa;
  const waText = encodeURIComponent(
    `Halo ${product.sellerName}, saya melihat barang "${product.name}" (${formattedPrice}) di CampusCycle. Apakah masih tersedia untuk COD di area kampus?`
  );
  const waUrl = `https://wa.me/${cleanWa}?text=${waText}`;

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      showToast('Tautan barang berhasil disalin ke clipboard!', 'success');
    }
  };

  const handleSendReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!reportReason.trim()) return;

    setIsReporting(true);
    try {
      await api.products.report(product.id, reportReason.trim());
      showToast('Laporan berhasil dikirim ke tim admin.', 'success');
      setShowReportInput(false);
      setReportReason('');
    } catch {
      showToast('Gagal mengirim laporan. Silakan coba lagi.', 'error');
    } finally {
      setIsReporting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl relative my-auto animate-in fade-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-10 w-8 h-8 rounded-full bg-slate-900/60 hover:bg-slate-900 text-white flex items-center justify-center transition-colors"
          aria-label="Tutup"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Product Image Banner */}
        <div className="relative aspect-16/9 sm:aspect-2/1 w-full bg-slate-900 overflow-hidden">
          <img
            src={product.imageUrl}
            alt={product.name}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover"
          />
          {isSold && (
            <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-xs flex items-center justify-center">
              <span className="px-4 py-2 rounded-full bg-rose-600 text-white font-extrabold text-sm tracking-widest uppercase">
                BARANG SUDAH TERJUAL
              </span>
            </div>
          )}
        </div>

        {/* Details Container */}
        <div className="p-5 sm:p-7 max-h-[70vh] overflow-y-auto custom-scrollbar space-y-6">
          {/* Header & Pricing */}
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 font-medium mb-1.5">
              <span className="text-emerald-700 font-semibold">{product.category}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span>{product.condition}</span>
              <span aria-hidden="true" className="text-slate-300">·</span>
              <span className="flex items-center gap-1">
                <Calendar className="w-3 h-3 text-slate-400" />
                {new Date(product.createdAt).toLocaleDateString('id-ID', {
                  day: 'numeric',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 leading-snug">
              {product.name}
            </h2>

            <div className="mt-3 flex items-baseline justify-between p-3.5 bg-slate-50 rounded-xl border border-slate-200">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block">
                  Harga Kesepakatan
                </span>
                <span className="text-2xl font-black text-slate-900 tabular-nums">
                  {formattedPrice}
                </span>
              </div>
              <div className="text-right">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-100/60 px-2.5 py-1 rounded-md">
                  0% Biaya Admin
                </span>
              </div>
            </div>
          </div>

          {/* Location & Seller Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <MapPin className="w-3.5 h-3.5 text-emerald-600" />
                <span>Area COD Kampus</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {product.codLocation || 'Kantin / Perpustakaan Kampus'}
              </p>
              <p className="text-slate-500 flex items-center gap-1">
                <Building2 className="w-3 h-3" />
                {product.campus}
              </p>
            </div>

            <div className="p-3.5 rounded-xl border border-slate-200 bg-white space-y-1">
              <div className="flex items-center gap-1.5 text-slate-400 font-bold uppercase tracking-wider text-[10px]">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                <span>Identitas Penjual</span>
              </div>
              <p className="font-semibold text-slate-800 text-sm">
                {product.sellerName}
              </p>
              <p className="text-emerald-700 font-medium">
                {product.sellerVerification === 'ktm_verified'
                  ? '✓ Terverifikasi Kartu Mahasiswa (KTM)'
                  : product.sellerVerification === 'email_verified'
                  ? '✓ Mahasiswa Terverifikasi Email'
                  : 'Mahasiswa Kampus'}
              </p>
            </div>
          </div>

          {/* Description */}
          <div>
            <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wider mb-2">
              Deskripsi Barang
            </h4>
            <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
              {product.description}
            </div>
          </div>

          {/* COD Safety Notice */}
          <div className="p-4 rounded-xl bg-emerald-50/70 border border-emerald-200 text-xs text-emerald-950 space-y-2">
            <div className="flex items-center gap-1.5 font-bold text-emerald-800">
              <AlertTriangle className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>Panduan Transaksi COD Aman</span>
            </div>
            <ul className="list-disc list-inside space-y-1 text-emerald-900 pl-1">
              <li>Sepakati lokasi COD di tempat umum kampus (Perpustakaan, Kantin, atau Gerbang Utama).</li>
              <li>Periksa kondisi barang secara langsung sebelum membayar tunai / QRIS.</li>
              <li>CampusCycle tidak meminta uang muka (DP) atau biaya transfer perantara.</li>
            </ul>
          </div>

          {/* Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row gap-3">
            {!isSold ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-1 py-3 px-5 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-sm transition-colors"
              >
                <MessageSquare className="w-4 h-4" />
                <span>Hubungi Penjual via WhatsApp</span>
              </a>
            ) : (
              <button
                disabled
                className="flex-1 py-3 px-5 rounded-xl bg-slate-200 text-slate-500 font-bold text-sm cursor-not-allowed"
              >
                Barang Sudah Tidak Tersedia (Laku)
              </button>
            )}

            <button
              type="button"
              onClick={handleShare}
              className="py-3 px-4 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-semibold text-xs flex items-center justify-center gap-1.5 transition-colors"
            >
              <Share2 className="w-4 h-4" />
              <span>Bagikan</span>
            </button>
          </div>

          {/* Report Button */}
          <div className="border-t border-slate-100 pt-3">
            {!showReportInput ? (
              <button
                onClick={() => setShowReportInput(true)}
                className="text-[11px] font-semibold text-slate-400 hover:text-rose-600 flex items-center gap-1 transition-colors"
              >
                <Flag className="w-3 h-3" />
                <span>Laporkan jika barang bermasalah / mencurigakan</span>
              </button>
            ) : (
              <form onSubmit={handleSendReport} className="space-y-2 mt-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Alasan Laporan:
                </label>
                <input
                  type="text"
                  required
                  value={reportReason}
                  onChange={(e) => setReportReason(e.target.value)}
                  placeholder="Misal: Penjual mencurigakan, barang palsu, atau deskripsi keliru"
                  className="w-full px-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-emerald-500"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={isReporting}
                    className="px-3 py-1.5 rounded-lg bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700 transition-colors"
                  >
                    {isReporting ? 'Mengirim...' : 'Kirim Laporan'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowReportInput(false)}
                    className="px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold hover:bg-slate-200 transition-colors"
                  >
                    Batal
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
