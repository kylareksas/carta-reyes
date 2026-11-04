// app/components/WhatsNewBanner.tsx
"use client";
import { useState, useEffect } from "react";
import { Sparkles, X, KeyRound, ShieldAlert, Compass, Link2 } from "lucide-react";

const STORAGE_KEY = "carta_reyes_news_v2026_dismissed";

export default function WhatsNewBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [dontShowAgain, setDontShowAgain] = useState(true); // Marcado por defecto para ahorrar clics

  useEffect(() => {
    const isDismissed = localStorage.getItem(STORAGE_KEY);
    if (!isDismissed) {
      setIsVisible(true);
    }
  }, []);

  const handleClose = () => {
    if (dontShowAgain) {
      localStorage.setItem(STORAGE_KEY, "true");
    }
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 sm:inset-auto sm:bottom-5 sm:right-5 z-50 p-3 sm:p-0 max-w-md w-full animate-in fade-in slide-in-from-bottom-4 duration-200">
      <div className="bg-white rounded-3xl p-5 sm:p-6 shadow-2xl border border-stone-200/90 relative overflow-hidden">
        {/* Banda superior decorativa sutil */}
        <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-amber-400 via-amber-600 to-stone-900" />

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-amber-50 border border-amber-200/70 text-amber-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 rounded-full bg-stone-100 text-stone-600 font-semibold">
                Edición 2026
              </span>
              <h3 className="text-sm font-semibold text-stone-900 mt-0.5">
                ¿Qué hay de nuevo este año?
              </h3>
            </div>
          </div>

          <button
            onClick={() => setIsVisible(false)}
            className="p-1.5 rounded-full text-stone-400 hover:text-stone-700 hover:bg-stone-100 transition"
            title="Cerrar por ahora"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Lista de novedades respecto al año pasado */}
        <ul className="space-y-3 text-xs text-stone-600 mb-5">
          <li className="flex items-start gap-2.5">
            <KeyRound className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-900">Acceso rápido con PIN:</strong> Olvídate de contraseñas largas. Entra o crea tu carta con un PIN de 4 números. *(Base de datos nueva: crea tu cuenta de nuevo si tenías una el año pasado).*
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-900">Reserva de regalos Anti-Spoiler:</strong> Tus familiares pueden marcar qué regalos van a comprarte para no repetir, ¡pero tú nunca verás cuáles están reservados!
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <Compass className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-900">Muro Público opcional:</strong> Activa el interruptor en tu perfil si quieres que tus amigos encuentren tu carta en <em>Explorar</em> sin pasarles el enlace.
            </span>
          </li>

          <li className="flex items-start gap-2.5">
            <Link2 className="w-4 h-4 text-stone-700 shrink-0 mt-0.5" />
            <span>
              <strong className="text-stone-900">Enlaces exactos y precios:</strong> Ahora puedes adjuntar el link directo a la tienda y el precio orientativo en cada deseo.
            </span>
          </li>
        </ul>

        {/* Pie del banner: Checkbox "No mostrar más" + Botón */}
        <div className="pt-3.5 border-t border-stone-100 flex items-center justify-between gap-3">
          <label className="flex items-center gap-2 cursor-pointer select-none text-xs text-stone-500 hover:text-stone-800">
            <input
              type="checkbox"
              checked={dontShowAgain}
              onChange={(e) => setDontShowAgain(e.target.checked)}
              className="w-4 h-4 rounded border-stone-300 text-stone-900 focus:ring-stone-900 accent-stone-900 cursor-pointer"
            />
            <span>No volver a mostrar</span>
          </label>

          <button
            onClick={handleClose}
            className="bg-stone-900 text-white px-4 py-2 rounded-xl text-xs font-medium hover:bg-stone-800 transition shrink-0"
          >
            ¡Entendido!
          </button>
        </div>
      </div>
    </div>
  );
}