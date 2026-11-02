// app/components/DonationModal.tsx
"use client";
import { X, Coffee, ArrowUpRight } from "lucide-react";

export default function DonationModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 bg-stone-950/40 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="bg-white p-6 rounded-3xl max-w-sm w-full text-center relative shadow-2xl border border-stone-100"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
          aria-label="Cerrar"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="w-10 h-10 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-amber-100">
          <Coffee className="w-5 h-5" />
        </div>

        <h3 className="text-lg font-semibold text-stone-900 tracking-tight">
          Apoyar el proyecto
        </h3>
        <p className="text-xs text-stone-500 mt-1 mb-5 leading-relaxed px-2">
          Esta plataforma es gratuita y sin anuncios. Si te resulta útil, puedes invitarme a un café para mantener el servidor.
        </p>

        <div className="bg-stone-50 p-4 rounded-2xl mb-5 inline-block border border-stone-200/60">
          <img
            src="/revo.jpg"
            alt="QR Revolut"
            className="w-44 h-44 object-contain mix-blend-multiply rounded-lg"
          />
        </div>

        <a
          href="https://revolut.me/kylareksas"
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1.5 w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-800 transition shadow-xs"
        >
          <span>Abrir Revolut</span>
          <ArrowUpRight className="w-4 h-4" />
        </a>
      </div>
    </div>
  );
}