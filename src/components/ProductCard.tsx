import React, { useState } from 'react';
import { Product } from '../types/index.ts';
import { MessageSquare, ShieldCheck, MapPin, Eye } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onSelect }) => {
  const [imageError, setImageError] = useState(false);
  const isSold = product.status === 'sold';

  const formattedPrice = new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(product.price);

  // Generate WhatsApp Direct Link
  const rawWa = product.whatsapp ? product.whatsapp.replace(/[^0-9]/g, '') : '';
  const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.slice(1) : rawWa.startsWith('62') ? rawWa : '62' + rawWa;
  const waText = encodeURIComponent(
    `Halo ${product.sellerName}, saya tertarik dengan barang preloved "${product.name}" (${formattedPrice}) di CampusCycle. Apakah masih bisa COD di area kampus?`
  );
  const waUrl = `https://wa.me/${cleanWa}?text=${waText}`;

  return (
    <div
      onClick={() => onSelect(product)}
      className="group bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs hover:shadow-md transition-all duration-200 flex flex-col cursor-pointer"
    >
      {/* Product Image Frame */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        {!imageError && product.imageUrl ? (
          <img
            src={product.imageUrl}
            alt={product.name}
            onError={() => setImageError(true)}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover group-hover:scale-102 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-slate-100 text-slate-400 p-4 text-center">
            <span className="text-2xl mb-1">📦</span>
            <span className="text-xs font-medium">{product.name}</span>
          </div>
        )}

        {/* Sold Overlay */}
        {isSold && (
          <div className="absolute inset-0 bg-slate-950/70 backdrop-blur-[2px] flex items-center justify-center p-4">
            <span className="px-3.5 py-1.5 rounded-full bg-rose-600 text-white font-extrabold text-xs tracking-wider uppercase shadow-md">
              Terjual / Laku
            </span>
          </div>
        )}

        {/* Quick Demo Label if applicable */}
        {product.isDemo && (
          <div className="absolute top-2.5 right-2.5">
            <span className="bg-slate-900/75 backdrop-blur-xs text-slate-200 text-[10px] font-semibold px-2 py-0.5 rounded-md">
              Demo
            </span>
          </div>
        )}
      </div>

      {/* Card Content */}
      <div className="p-4 flex-1 flex flex-col justify-between">
        <div>
          {/* Zero-Pill Clean Unboxed Metadata */}
          <div className="flex items-center gap-1.5 text-xs text-slate-500 mb-1.5 font-medium">
            <span className="text-emerald-700">{product.category}</span>
            <span aria-hidden="true" className="text-slate-300">·</span>
            <span>{product.condition}</span>
          </div>

          {/* Title */}
          <h3 className="font-bold text-slate-900 text-sm sm:text-base leading-snug line-clamp-2 group-hover:text-emerald-700 transition-colors mb-1.5">
            {product.name}
          </h3>

          {/* Location snippet */}
          <div className="flex items-center gap-1 text-xs text-slate-500 mb-2">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{product.codLocation || product.campus}</span>
          </div>
        </div>

        {/* Price & Seller footer */}
        <div className="pt-3 border-t border-slate-100 mt-2">
          <div className="flex items-baseline justify-between mb-3">
            <div>
              <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
                Harga COD
              </span>
              <span className="text-base sm:text-lg font-bold text-slate-900 tabular-nums">
                {formattedPrice}
              </span>
            </div>
            <div className="text-right">
              <span className="text-[10px] font-semibold uppercase text-slate-400 block tracking-wider">
                Penjual
              </span>
              <div className="flex items-center gap-1 justify-end text-xs font-semibold text-slate-700">
                {product.sellerVerification !== 'unverified' && (
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                )}
                <span className="truncate max-w-[110px]">{product.sellerName}</span>
              </div>
            </div>
          </div>

          {/* Action CTA */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onSelect(product);
              }}
              className="flex-1 py-2 px-3 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
            >
              <Eye className="w-3.5 h-3.5 text-slate-500" />
              <span>Detail</span>
            </button>

            {!isSold ? (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-xs font-bold flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <MessageSquare className="w-3.5 h-3.5" />
                <span>Chat WA</span>
              </a>
            ) : (
              <button
                disabled
                className="flex-1 py-2 px-3 rounded-xl bg-slate-100 text-slate-400 text-xs font-semibold cursor-not-allowed"
              >
                Sudah Laku
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
