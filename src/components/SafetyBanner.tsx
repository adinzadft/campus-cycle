import React from 'react';
import { ShieldCheck, Banknote, Handshake, MessageSquare } from 'lucide-react';

export const SafetyBanner: React.FC = () => {
  return (
    <div className="bg-slate-900 rounded-2xl p-5 sm:p-7 text-white shadow-xs relative overflow-hidden my-4 border border-slate-800">
      <div className="relative z-10 max-w-3xl">
        <div className="inline-flex items-center gap-1.5 bg-emerald-500/20 text-emerald-300 text-xs px-3 py-1 rounded-full border border-emerald-500/30 mb-3 font-semibold">
          <ShieldCheck className="w-3.5 h-3.5" />
          <span>Ekosistem Kampus Terpercaya</span>
        </div>

        <h1 className="text-xl sm:text-2xl font-extrabold tracking-tight mb-2">
          Transparan, Cepat, Tanpa Potongan Admin!
        </h1>

        

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-4 border-t border-slate-800 text-xs">
          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
            <Banknote className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-100 block">0% Biaya Admin</span>
              <span className="text-[11px] text-slate-400 block">Harga murni kesepakatan</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
            <Handshake className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-100 block">COD Area Kampus</span>
              <span className="text-[11px] text-slate-400 block">Cek barang dulu sebelum bayar</span>
            </div>
          </div>

          <div className="p-2.5 rounded-xl bg-white/5 border border-white/5 flex items-center gap-2.5">
            <MessageSquare className="w-4 h-4 text-emerald-400 shrink-0" />
            <div>
              <span className="font-bold text-slate-100 block">Chat Langsung WA</span>
              <span className="text-[11px] text-slate-400 block">Langsung terhubung ke penjual</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
