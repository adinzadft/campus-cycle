import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';
import { ProductCategory, ProductCondition } from '../types/index.ts';
import {
  Upload,
  Image as ImageIcon,
  ShieldAlert,
  CheckCircle,
  HelpCircle,
  Building2,
  MapPin,
  Lock
} from 'lucide-react';

interface SellProductFormProps {
  onSuccess: () => void;
  openAuthModal: () => void;
  openKtmModal: () => void;
}

export const SellProductForm: React.FC<SellProductFormProps> = ({
  onSuccess,
  openAuthModal,
  openKtmModal
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<Exclude<ProductCategory, 'Semua'>>('Buku');
  const [condition, setCondition] = useState<ProductCondition>('Baik (Biasa Pakai)');
  const [whatsapp, setWhatsapp] = useState(user?.whatsapp || '');
  const [campus, setCampus] = useState(user?.campus || '');
  const [codLocation, setCodLocation] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // If user is not logged in
  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-8 p-8 bg-white rounded-2xl border border-slate-200 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center mx-auto">
          <Lock className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Masuk Untuk Jual Barang</h2>
        <p className="text-sm text-slate-500 max-w-md mx-auto">
          CampusCycle adalah platform terpercaya khusus mahasiswa. Silakan masuk atau daftar menggunakan email kampus Anda untuk mulai menjual barang.
        </p>
        <div className="pt-2">
          <button
            onClick={openAuthModal}
            className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-sm transition-colors"
          >
            Masuk / Daftar Akun
          </button>
        </div>
      </div>
    );
  }

  // If user is unverified
  if (user.verificationStatus === 'unverified') {
    return (
      <div className="max-w-xl mx-auto my-8 p-8 bg-white rounded-2xl border border-amber-200 shadow-xs text-center space-y-4">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Verifikasi Mahasiswa Diperlukan</h2>
        <p className="text-sm text-slate-600 max-w-md mx-auto">
          Demi keamanan ekosistem kampus dan mencegah penipuan, hanya mahasiswa yang telah terverifikasi resmi (melalui email kampus atau kartu mahasiswa KTM) yang dapat menayangkan barang jualan.
        </p>

        {user.ktmStatus === 'pending' ? (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
            <strong>Pengajuan KTM Anda Sedang Ditinjau Admin:</strong> Mohon tunggu pemeriksaan identitas oleh tim verifikasi kami.
          </div>
        ) : (
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={openKtmModal}
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-sm transition-colors"
            >
              Unggah Foto KTM Mahasiswa
            </button>
          </div>
        )}
      </div>
    );
  }

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Harap pilih file gambar (JPG, PNG, atau WEBP).', 'error');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast('Ukuran gambar maksimal 5 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setImagePreview(base64);
      setImageUrl(base64);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const finalImage = imagePreview || imageUrl.trim();
    if (!finalImage) {
      showToast('Foto barang wajib diunggah!', 'error');
      return;
    }

    const numPrice = Number(price);
    if (isNaN(numPrice) || numPrice < 0) {
      showToast('Harga harus berupa angka valid.', 'error');
      return;
    }

    const cleanWa = whatsapp.replace(/[^0-9]/g, '');
    if (cleanWa.length < 8) {
      showToast('Nomor WhatsApp minimal 8 digit.', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      await api.products.create({
        name: name.trim(),
        price: numPrice,
        category,
        condition,
        description: description.trim(),
        imageUrl: finalImage,
        whatsapp: cleanWa,
        campus: campus.trim() || user.campus,
        codLocation: codLocation.trim() || 'Area Kampus',
      });

      showToast('Barang berhasil ditayangkan di Etalase Kampus!', 'success');
      setName('');
      setPrice('');
      setDescription('');
      setImageUrl('');
      setImagePreview(null);
      setCodLocation('');
      onSuccess();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan barang. Periksa koneksi Anda.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto my-6 bg-white rounded-2xl border border-slate-200 shadow-xs p-6 sm:p-8">
      <div className="mb-6 pb-4 border-b border-slate-100">
        <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
          <span>Pasang Barang Jualan Baru</span>
        </h2>
        <p className="text-slate-500 text-xs sm:text-sm mt-1">
          Barang preloved Anda akan langsung terlihat oleh mahasiswa satu kampus. COD 100% tanpa potongan admin.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Nama Barang */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Nama Barang *
          </label>
          <input
            type="text"
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Contoh: Buku Kalkulus Purcell Ed.9 / Kipas Meja Kos"
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
          />
        </div>

        {/* Harga & Kategori */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Harga COD (Rp) *
            </label>
            <input
              type="number"
              required
              min="0"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="Contoh: 45000"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kategori Barang *
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 font-medium"
            >
              <option value="Buku">Buku & Catatan Kuliah</option>
              <option value="Elektronik">Elektronik & Gadget</option>
              <option value="Pakaian">Pakaian & Jas Lab</option>
              <option value="Kebutuhan Kos">Kebutuhan Kamar Kos</option>
              <option value="Aksesoris">Aksesoris & Kendaraan</option>
              <option value="Lainnya">Lainnya</option>
            </select>
          </div>
        </div>

        {/* Kondisi & WhatsApp */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kondisi Barang *
            </label>
            <select
              value={condition}
              onChange={(e) => setCondition(e.target.value as any)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 font-medium"
            >
              <option value="Sangat Baik (Like New)">Sangat Baik (Like New)</option>
              <option value="Baik (Biasa Pakai)">Baik (Biasa Pakai)</option>
              <option value="Cukup (Ada Minus)">Cukup (Ada Cacat/Minus)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              No. WhatsApp Penjual *
            </label>
            <input
              type="text"
              required
              value={whatsapp}
              onChange={(e) => setWhatsapp(e.target.value)}
              placeholder="08123456789 atau 628123456789"
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
            />
            <span className="text-[10px] text-slate-400 mt-1 block">
              Pembeli akan menghubungi Anda langsung melalui WhatsApp ini
            </span>
          </div>
        </div>

        {/* Kampus & Area COD */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kampus *
            </label>
            <div className="relative">
              <Building2 className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={campus}
                onChange={(e) => setCampus(e.target.value)}
                placeholder="Contoh: UIN Malang / Univ. Brawijaya"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Lokasi Favorit COD Kampus *
            </label>
            <div className="relative">
              <MapPin className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                required
                value={codLocation}
                onChange={(e) => setCodLocation(e.target.value)}
                placeholder="Misal: Kantin Saintek / Perpustakaan Pusat"
                className="w-full pl-9 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all"
              />
            </div>
          </div>
        </div>

        {/* Foto Barang */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Foto Produk *
          </label>
          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            {imagePreview ? (
              <div className="relative max-w-xs mx-auto aspect-4/3 rounded-xl overflow-hidden border border-slate-200 shadow-xs">
                <img
                  src={imagePreview}
                  alt="Preview"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => {
                    setImagePreview(null);
                    setImageUrl('');
                  }}
                  className="absolute top-2 right-2 px-2 py-1 bg-slate-900/80 text-white rounded-md text-xs font-bold"
                >
                  Ganti Foto
                </button>
              </div>
            ) : (
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Pilih File Foto dari Perangkat</span>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Format JPG, PNG, atau WEBP (Maksimal 5 MB). Pastikan foto jelas dan asli.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Deskripsi Barang */}
        <div>
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
            Deskripsi Lengkap *
          </label>
          <textarea
            required
            rows={4}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Jelaskan alasan jual, kelengkapan barang, minus (jika ada), pemakaian berapa lama, dan jam yang disepakati untuk COD..."
            className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 focus:bg-white transition-all leading-relaxed"
          ></textarea>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 disabled:bg-slate-300 text-white font-bold text-sm shadow-sm transition-colors flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <span>Menyimpan ke Etalase...</span>
            ) : (
              <>
                <CheckCircle className="w-4 h-4" />
                <span>Tayangkan di Etalase Kampus</span>
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
};
