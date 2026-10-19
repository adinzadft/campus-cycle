import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';
import { ProductCategory, ProductCondition } from '../types/index.ts';
import {
  Upload,
  ShieldAlert,
  CheckCircle,
  Building2,
  MapPin,
  Lock,
  X
} from 'lucide-react';

interface SellProductFormProps {
  onSuccess: () => void;
  openAuthModal: () => void;
  openKtmModal: () => void;
}

const CITY_OPTIONS = [
  'Malang',
  'Surabaya',
  'Bandung',
  'Yogyakarta',
  'Semarang',
  'Solo',
  'Depok',
  'Bogor',
  'Lainnya'
];

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
  const [city, setCity] = useState('Malang');

  // State untuk Multi-Image Upload
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Jika pengguna belum login
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

  // Jika verifikasi pengguna belum lengkap
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

  // Handler saat memilih file foto baru
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;

    const filesArray = Array.from(e.target.files);
    const validFiles: File[] = [];

    for (const file of filesArray) {
      if (!file.type.startsWith('image/')) {
        showToast(`File "${file.name}" bukan format gambar valid.`, 'error');
        continue;
      }
      if (file.size > 5 * 1024 * 1024) {
        showToast(`Ukuran file "${file.name}" melebihi 5 MB.`, 'error');
        continue;
      }
      validFiles.push(file);
    }

    if (validFiles.length === 0) return;

    // Batasi maksimal 5 foto
    const combinedFiles = [...selectedFiles, ...validFiles].slice(0, 5);
    if (selectedFiles.length + validFiles.length > 5) {
      showToast('Maksimal 5 foto per produk.', 'info');
    }

    setSelectedFiles(combinedFiles);

    // Generate preview URLs
    const newPreviews = combinedFiles.map((file) => URL.createObjectURL(file));
    setPreviewUrls(newPreviews);
  };

  // Handler hapus foto dari daftar antrean
  const handleRemoveImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    const updatedPreviews = previewUrls.filter((_, i) => i !== index);

    setSelectedFiles(updatedFiles);
    setPreviewUrls(updatedPreviews);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (selectedFiles.length === 0) {
      showToast('Minimal unggah 1 foto produk!', 'error');
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
      // 1. Upload seluruh file gambar ke Supabase Storage Bucket 'product-images'
      const uploadedUrls = await api.products.uploadProductImages(selectedFiles);

      // 2. Simpan record produk ke database Supabase
      await api.products.create({
        name: name.trim(),
        price: numPrice,
        category,
        condition,
        description: description.trim(),
        imageUrl: uploadedUrls[0] || '', // Cover utama
        images: uploadedUrls,            // Array seluruh foto
        whatsapp: cleanWa,
        city,
        campus: campus.trim() || user.campus,
        codLocation: codLocation.trim() || 'Area Kampus',
      });

      showToast('Barang berhasil ditayangkan di Etalase Kampus!', 'success');
      setName('');
      setPrice('');
      setDescription('');
      setSelectedFiles([]);
      setPreviewUrls([]);
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
          Barang preloved Anda akan langsung terlihat oleh mahasiswa. COD 100% tanpa potongan admin.
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
              <option value="Buku">Buku</option>
              <option value="Elektronik">Elektronik</option>
              <option value="Pakaian">Pakaian</option>
              <option value="Kebutuhan Kos">Kebutuhan Kos</option>
              <option value="Aksesoris">Aksesoris</option>
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

        {/* Kota / Wilayah & Nama Kampus */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Kota / Wilayah *
            </label>
            <select
              value={city}
              onChange={(e) => setCity(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-emerald-600 font-medium"
            >
              {CITY_OPTIONS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Nama Kampus *
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
        </div>

        {/* Area COD Kampus */}
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

        {/* Multi-Image Upload */}
        <div className="space-y-2">
          <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
            Foto Produk (Maksimal 5 Foto) *
          </label>

          <div className="p-4 rounded-xl border border-dashed border-slate-300 bg-slate-50 text-center space-y-3">
            {selectedFiles.length < 5 && (
              <div>
                <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold shadow-2xs transition-colors">
                  <Upload className="w-4 h-4 text-emerald-600" />
                  <span>Pilih Foto ({selectedFiles.length}/5)</span>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                  />
                </label>
                <p className="text-[11px] text-slate-400 mt-2">
                  Format JPG, PNG, atau WEBP (Maksimal 5 MB per foto). Foto pertama akan menjadi sampul utama.
                </p>
              </div>
            )}

            {/* Grid Preview Foto yang Dipilih */}
            {previewUrls.length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 mt-3">
                {previewUrls.map((url, idx) => (
                  <div
                    key={idx}
                    className="relative aspect-square rounded-xl bg-slate-100 overflow-hidden border border-slate-200 group shadow-2xs"
                  >
                    <img
                      src={url}
                      alt={`Preview ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    {idx === 0 && (
                      <span className="absolute bottom-1 left-1 bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.5 rounded">
                        Sampul
                      </span>
                    )}
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute top-1 right-1 bg-rose-600 hover:bg-rose-700 text-white rounded-full p-1 transition-colors"
                      aria-label="Hapus Foto"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
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
              <span>Mengunggah Foto & Menyimpan...</span>
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