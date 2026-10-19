import React, { useState, useEffect, useCallback } from 'react';
import { ToastProvider, useToast } from './components/Toast.tsx';
import { AuthProvider, useAuth } from './context/AuthContext.tsx';
import { Navbar } from './components/Navbar.tsx';
import { SafetyBanner } from './components/SafetyBanner.tsx';
import { ProductCard } from './components/ProductCard.tsx';
import { ProductDetailModal } from './components/ProductDetailModal.tsx';
import { SellProductForm } from './components/SellProductForm.tsx';
import { SellerDashboard } from './components/SellerDashboard.tsx';
import { AuthModal } from './components/AuthModal.tsx';
import { KTMVerificationModal } from './components/KTMVerificationModal.tsx';
import { UserProfileModal } from './components/UserProfileModal.tsx';
import { AdminPanel } from './components/AdminPanel.tsx';
import { Product, ProductCategory } from './types/index.ts';
import { api } from './services/api.ts';
import {
  Search,
  PackageOpen,
  RotateCcw,
  RefreshCw,
} from 'lucide-react';

const CATEGORIES: ProductCategory[] = [
  'Semua',
  'Buku',
  'Elektronik',
  'Pakaian',
  'Kebutuhan Kos',
  'Aksesoris',
  'Lainnya'
];

const CITIES: string[] = [
  'Semua Kota',
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

const CampusCycleContent: React.FC = () => {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [activeTab, setActiveTab] = useState<'explore' | 'sell' | 'dashboard' | 'admin' | 'profile'>('explore');
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [fetchError, setFetchError] = useState<string | null>(null);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<ProductCategory>('Semua');
  const [sortOption, setSortOption] = useState<'newest' | 'price_asc' | 'price_desc'>('newest');
  const [onlyAvailable, setOnlyAvailable] = useState<boolean>(false);
  const [selectedCity, setSelectedCity] = useState<string>('Semua Kota');

  // 1. Tambah state debouncedSearch
const [debouncedSearch, setDebouncedSearch] = useState(searchQuery);

// 2. Efek penundaan 400ms saat mengetik
useEffect(() => {
  const timer = setTimeout(() => {
    setDebouncedSearch(searchQuery);
  }, 400);

  return () => clearTimeout(timer);
}, [searchQuery]);



  // Modals
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isKtmModalOpen, setIsKtmModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

  // Auto Open Product Detail dari Parameter URL saat pertama kali halaman dimuat
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const productIdFromUrl = urlParams.get('product');

    if (productIdFromUrl) {
      api.products.getById(productIdFromUrl)
        .then((productData) => {
          setSelectedProduct(productData);
        })
        .catch(() => {
          showToast('Barang dari tautan tidak ditemukan atau sudah dihapus.', 'error');
        });
    }
  }, [showToast]);

  // Handler saat kartu produk di etalase diklik
  const handleOpenDetail = (product: Product) => {
    setSelectedProduct(product);
    // Ubah URL tanpa mereload halaman
    window.history.pushState({}, '', `/?product=${product.id}`);
  };

  // Handler saat modal detail ditutup
  const handleCloseDetail = () => {
    setSelectedProduct(null);
    // Kembalikan URL ke homepage bersih
    window.history.pushState({}, '', window.location.pathname);
  };

  // Fetch all products
  const fetchProducts = useCallback(async () => {
  setIsLoading(true);
  setFetchError(null);
  try {
    const data = await api.products.getAll({
      search: debouncedSearch || undefined,
      category: selectedCategory,
      city: selectedCity,
      sort: sortOption,
    });
    setProducts(data);
  } catch (err: any) {
    setFetchError(err.message || 'Gagal memuat katalog barang dari server.');
  } finally {
    setIsLoading(false);
  }
}, [debouncedSearch, selectedCategory, selectedCity, sortOption]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  // Filter client-side for immediate reactivity
  const filteredProducts = products.filter((item) => {
    if (onlyAvailable && item.status !== 'available') return false;
    return true;
  });

  const myItemsCount = user ? products.filter((p) => p.ownerId === user.id).length : 0;

  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('Semua');
    setSelectedCity('Semua Kota');
    setSortOption('newest');
    setOnlyAvailable(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navbar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={(tab) => {
          if (tab === 'profile') {
            setIsProfileModalOpen(true);
          } else {
            setActiveTab(tab);
          }
        }}
        myItemsCount={myItemsCount}
        openAuthModal={() => setIsAuthModalOpen(true)}
        openKtmModal={() => setIsKtmModalOpen(true)}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-5">
        {/* TAB 1: ETALASE KAMPUS */}
        {activeTab === 'explore' && (
          <div className="space-y-6">
            {/* PRD Banner */}
            <SafetyBanner />

            {/* Search, Filter & Sort Controls */}
            <div className="bg-white rounded-2xl border border-slate-200 p-4 sm:p-5 shadow-xs space-y-4">
              <div className="flex flex-col md:flex-row gap-3">
                {/* Search Bar */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Cari Barang"
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm focus:outline-emerald-600 focus:bg-white transition-all"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
                    >
                      Batal
                    </button>
                  )}
                </div>

                {/* City Select Filter */}
                <div className="w-full md:w-48">
                  <select
                    value={selectedCity}
                    onChange={(e) => setSelectedCity(e.target.value)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-emerald-600"
                  >
                    {CITIES.map((c) => (
                      <option key={c} value={c}>
                        {c === 'Semua Kota' ? 'Semua Kota' : `${c}`}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Category Select */}
                <div className="w-full md:w-56">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value as ProductCategory)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-emerald-600"
                  >
                    {CATEGORIES.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat === 'Semua' ? 'Semua Kategori' : cat}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sort Option */}
                <div className="w-full md:w-52">
                  <select
                    value={sortOption}
                    onChange={(e) => setSortOption(e.target.value as any)}
                    className="w-full py-2.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-emerald-600"
                  >
                    <option value="newest">Urutkan: Terbaru</option>
                    <option value="price_asc">Harga: Termurah</option>
                    <option value="price_desc">Harga: Termahal</option>
                  </select>
                </div>
              </div>

              {/* Quick Interactive Category Buttons & Available Toggle */}
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 pt-1 border-t border-slate-100">
                <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full custom-scrollbar text-xs">
                  <span className="text-slate-400 font-semibold mr-1 shrink-0">Kategori Cepat:</span>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      className={`px-3 py-1.5 rounded-lg font-semibold transition-colors shrink-0 ${
                        selectedCategory === cat
                          ? 'bg-emerald-600 text-white'
                          : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-600 shrink-0">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span>Hanya Barang Tersedia</span>
                </label>
              </div>
            </div>

            {/* Error State */}
            {fetchError && (
              <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center justify-between">
                <div>
                  <strong className="block font-bold">Terjadi Kesalahan:</strong>
                  <span>{fetchError}</span>
                </div>
                <button
                  onClick={fetchProducts}
                  className="px-3 py-1.5 rounded-lg bg-rose-600 text-white font-bold text-xs hover:bg-rose-700 transition-colors shrink-0"
                >
                  Coba Lagi
                </button>
              </div>
            )}

            {/* Products Grid */}
            {isLoading ? (
              <div className="py-20 text-center space-y-3">
                <RefreshCw className="w-8 h-8 text-emerald-600 animate-spin mx-auto" />
                <p className="text-xs text-slate-500 font-medium">
                  Memuat barang dari database kampus...
                </p>
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="bg-white rounded-2xl border border-dashed border-slate-300 py-16 px-4 text-center space-y-3">
                <PackageOpen className="w-12 h-12 text-slate-300 mx-auto" />
                <h3 className="text-base font-bold text-slate-800">
                  Barang Tidak Ditemukan
                </h3>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Tidak ada barang yang cocok dengan kata kunci atau filter saat ini.
                </p>
                <div className="pt-2">
                  <button
                    onClick={handleResetFilters}
                    className="px-4 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 font-bold text-xs inline-flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Reset Semua Filter</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    onSelect={handleOpenDetail}
                  />
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 2: JUAL BARANG */}
        {activeTab === 'sell' && (
          <SellProductForm
            onSuccess={() => {
              fetchProducts();
              setActiveTab('explore');
            }}
            openAuthModal={() => setIsAuthModalOpen(true)}
            openKtmModal={() => setIsKtmModalOpen(true)}
          />
        )}

        {/* TAB 3: BARANG SAYA */}
        {activeTab === 'dashboard' && (
          <SellerDashboard
            products={products}
            onRefresh={fetchProducts}
            onNavigateToSell={() => setActiveTab('sell')}
          />
        )}

        {/* TAB 4: ADMIN PANEL */}
        {activeTab === 'admin' && <AdminPanel />}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 text-slate-400 text-xs py-8 border-t border-slate-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded bg-emerald-600 flex items-center justify-center text-white text-xs font-black">
                CC
              </div>
              <span className="text-white font-bold tracking-wide">CampusCycle</span>
              <span className="text-slate-500">| Marketplace Mahasiswa Terpercaya</span>
            </div>

            <div className="flex items-center gap-6">
              <button
                type="button"
                onClick={() =>
                  showToast(
                    'CampusCycle adalah platform preloved sesama mahasiswa dengan 0% biaya admin dan COD area kampus.',
                    'info'
                  )
                }
                className="hover:text-emerald-400 transition-colors"
              >
                Tentang Kami
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast(
                    'Panduan COD: Bertemu selalu di area umum kampus (Kantin/Perpus) dan cek fisik barang sebelum membayar.',
                    'info'
                  )
                }
                className="hover:text-emerald-400 transition-colors"
              >
                Panduan COD Aman
              </button>

              <button
                type="button"
                onClick={() =>
                  showToast(
                    'Punya keluhan atau kendala akun? Hubungi Admin CampusCycle via WhatsApp.',
                    'info'
                  )
                }
                className="hover:text-emerald-400 transition-colors"
              >
                Bantuan
              </button>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row justify-between items-center pt-4 border-t border-slate-800 text-slate-500 gap-2">
            <p>© 2026 CampusCycle. Dibuat eksklusif untuk kemudahan transaksi mahasiswa Indonesia.</p>
            <p>100% COD Antar-Mahasiswa · 0% Potongan Komisi</p>
          </div>
        </div>
      </footer>

      {/* Product Detail Modal */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={handleCloseDetail}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={() => {
          fetchProducts();
        }}
      />

      {/* KTM Modal */}
      <KTMVerificationModal
        isOpen={isKtmModalOpen}
        onClose={() => setIsKtmModalOpen(false)}
      />

      {/* User Profile Modal */}
      <UserProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => setIsProfileModalOpen(false)}
        openKtmModal={() => setIsKtmModalOpen(true)}
      />
    </div>
  );
};

export default function App() {
  return (
    <ToastProvider>
      <AuthProvider>
        <CampusCycleContent />
      </AuthProvider>
    </ToastProvider>
  );
}