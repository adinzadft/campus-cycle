import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { useAuth } from '../context/AuthContext.tsx';
import { useToast } from './Toast.tsx';
import { api } from '../services/api.ts';
import {
  Package,
  PlusCircle,
  CheckCircle2,
  RotateCcw,
  Trash2,
  Edit3,
  MapPin,
  X,
  AlertCircle
} from 'lucide-react';

interface SellerDashboardProps {
  products: Product[];
  onRefresh: () => void;
  onNavigateToSell: () => void;
}

export const SellerDashboard: React.FC<SellerDashboardProps> = ({
  products,
  onRefresh,
  onNavigateToSell
}) => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  // Filter items owned by current user
  const myProducts = user ? products.filter((p) => p.ownerId === user.id) : [];
  const availableCount = myProducts.filter((p) => p.status === 'available').length;
  const soldCount = myProducts.filter((p) => p.status === 'sold').length;

  const handleToggleStatus = async (id: string) => {
    try {
      const res = await api.products.toggleStatus(id);
      showToast(res.message, 'success');
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal mengubah status barang.', 'error');
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await api.products.delete(id);
      showToast('Barang berhasil dihapus.', 'info');
      setDeleteConfirmId(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menghapus barang.', 'error');
    }
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    setIsUpdating(true);
    try {
      await api.products.update(editingProduct.id, {
        name: editingProduct.name,
        price: Number(editingProduct.price),
        category: editingProduct.category,
        condition: editingProduct.condition,
        codLocation: editingProduct.codLocation,
        description: editingProduct.description,
        whatsapp: editingProduct.whatsapp,
      });

      showToast('Data barang berhasil diperbarui!', 'success');
      setEditingProduct(null);
      onRefresh();
    } catch (err: any) {
      showToast(err.message || 'Gagal menyimpan perubahan.', 'error');
    } finally {
      setIsUpdating(false);
    }
  };

  if (!user) {
    return (
      <div className="max-w-xl mx-auto my-12 p-8 bg-white rounded-2xl border border-slate-200 text-center space-y-3">
        <Package className="w-12 h-12 text-slate-300 mx-auto" />
        <h3 className="text-lg font-bold text-slate-900">Masuk Untuk Melihat Barang Saya</h3>
        <p className="text-xs text-slate-500">
          Silakan masuk untuk mengelola jualan, mengubah status barang laku, atau mengedit informasi produk Anda.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 my-6">
      {/* Header & Stats Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold text-slate-900">Kelola Jualan Saya</h2>
          <p className="text-slate-500 text-xs sm:text-sm mt-0.5">
            Daftar barang yang Anda pasang di etalase CampusCycle.
          </p>
        </div>

        <button
          onClick={onNavigateToSell}
          className="px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm flex items-center gap-2 shadow-xs transition-colors shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Tambah Jualan Baru</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-3 gap-3 sm:gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
            Total Jualan
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-900 tabular-nums">
            {myProducts.length}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-emerald-700 uppercase tracking-wider block">
            Tersedia (Aktif)
          </span>
          <span className="text-xl sm:text-2xl font-black text-emerald-700 tabular-nums">
            {availableCount}
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200">
          <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
            Laku / Terjual
          </span>
          <span className="text-xl sm:text-2xl font-black text-slate-700 tabular-nums">
            {soldCount}
          </span>
        </div>
      </div>

      {/* Product List */}
      {myProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-dashed border-slate-300 p-12 text-center space-y-3">
          <Package className="w-12 h-12 text-slate-300 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">Belum Ada Barang Yang Anda Jual</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Rapikan kamar kos Anda! Jual buku, pakaian praktikum, atau elektronik bekas Anda kepada sesama mahasiswa.
          </p>
          <div className="pt-2">
            <button
              onClick={onNavigateToSell}
              className="px-5 py-2.5 rounded-xl bg-emerald-50 text-emerald-700 font-bold text-xs hover:bg-emerald-100 transition-colors"
            >
              Mulai Jual Barang Sekarang
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {myProducts.map((item) => {
            const formattedPrice = new Intl.NumberFormat('id-ID', {
              style: 'currency',
              currency: 'IDR',
              maximumFractionDigits: 0,
            }).format(item.price);

            const isSold = item.status === 'sold';

            return (
              <div
                key={item.id}
                className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 shadow-xs"
              >
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="w-16 h-16 sm:w-20 sm:h-20 rounded-xl object-cover border border-slate-100 shrink-0"
                  />
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-emerald-700">
                        {item.category}
                      </span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span className="text-xs text-slate-500">{item.condition}</span>
                      <span className="text-slate-300 text-xs">·</span>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                          isSold
                            ? 'bg-rose-100 text-rose-700'
                            : 'bg-emerald-100 text-emerald-800'
                        }`}
                      >
                        {isSold ? 'LAKU' : 'TERSEDIA'}
                      </span>
                    </div>

                    <h4 className="font-bold text-slate-900 text-sm sm:text-base truncate max-w-md">
                      {item.name}
                    </h4>

                    <div className="flex items-center gap-3 text-xs">
                      <span className="font-extrabold text-slate-900 tabular-nums">
                        {formattedPrice}
                      </span>
                      <span className="text-slate-400 flex items-center gap-1">
                        <MapPin className="w-3 h-3" />
                        {item.codLocation || item.campus}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Action Controls */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end pt-3 md:pt-0 border-t md:border-t-0 border-slate-100">
                  <button
                    onClick={() => handleToggleStatus(item.id)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors ${
                      isSold
                        ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800'
                    }`}
                  >
                    {isSold ? (
                      <>
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Tandai Tersedia</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Tandai Laku</span>
                      </>
                    )}
                  </button>

                  <button
                    onClick={() => setEditingProduct(item)}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 hover:text-slate-900 text-xs font-semibold transition-colors"
                    title="Edit Informasi Barang"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setDeleteConfirmId(item.id)}
                    className="p-2 rounded-xl border border-rose-200 hover:bg-rose-50 text-rose-600 text-xs font-semibold transition-colors"
                    title="Hapus Barang"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 text-center space-y-4 shadow-xl">
            <div className="w-12 h-12 rounded-full bg-rose-100 text-rose-600 flex items-center justify-center mx-auto">
              <AlertCircle className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">Hapus Barang Ini?</h3>
            <p className="text-xs text-slate-500">
              Barang akan dihapus secara permanen dari etalase CampusCycle. Tindakan ini tidak dapat dibatalkan.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold"
              >
                Batal
              </button>
              <button
                onClick={() => handleDelete(deleteConfirmId)}
                className="flex-1 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs"
              >
                Ya, Hapus
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Product Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl my-auto space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-base">Edit Barang Jualan</h3>
              <button
                onClick={() => setEditingProduct(null)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveEdit} className="space-y-3 text-xs">
              <div>
                <label className="block font-bold text-slate-700 mb-1">Nama Barang</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, name: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Harga (Rp)</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={editingProduct.price}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block font-bold text-slate-700 mb-1">Kategori</label>
                  <select
                    value={editingProduct.category}
                    onChange={(e) =>
                      setEditingProduct({
                        ...editingProduct,
                        category: e.target.value as any,
                      })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                  >
                    <option value="Buku">Buku & Catatan</option>
                    <option value="Elektronik">Elektronik</option>
                    <option value="Pakaian">Pakaian</option>
                    <option value="Kebutuhan Kos">Kebutuhan Kos</option>
                    <option value="Aksesoris">Aksesoris</option>
                    <option value="Lainnya">Lainnya</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Lokasi Favorit COD</label>
                <input
                  type="text"
                  required
                  value={editingProduct.codLocation || ''}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, codLocation: e.target.value })
                  }
                  placeholder="Misal: Kantin FILKOM / Perpus Pusat"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">Deskripsi Lengkap</label>
                <textarea
                  rows={3}
                  required
                  value={editingProduct.description}
                  onChange={(e) =>
                    setEditingProduct({ ...editingProduct, description: e.target.value })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="flex-1 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isUpdating}
                  className="flex-1 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold"
                >
                  {isUpdating ? 'Menyimpan...' : 'Simpan Perubahan'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
