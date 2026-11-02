"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../supabase";
import DonationModal from "../../components/DonationModal";
import {
  Crown,
  ExternalLink,
  Search,
  ShoppingBag,
  Check,
  Copy,
  Coffee,
  Gift,
  Sparkles,
  X,
} from "lucide-react";

export default function PublicPage() {
  const params = useParams();
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDonate, setShowDonate] = useState(false);
  const [copied, setCopied] = useState(false);
  const [showImageModal, setShowImageModal] = useState(false);
  const [isOwnerViewing, setIsOwnerViewing] = useState(false);

  const username = decodeURIComponent(params?.id || "").toLowerCase();

  useEffect(() => {
    const savedUser = localStorage.getItem("carta_reyes_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      if (parsed.username === username) {
        setIsOwnerViewing(true);
      }
    }

    const fetchData = async () => {
      if (!username) {
        setError("Enlace incompleto.");
        setLoading(false);
        return;
      }

      const { data: userData, error: userError } = await supabase
        .from("profiles")
        .select("username, title, image")
        .eq("username", username)
        .maybeSingle();

      if (userError || !userData) {
        setError("Esta carta no existe todavía.");
        setLoading(false);
        return;
      }

      setProfile(userData);
      document.title = `Carta de @${userData.username} · Reyes Magos`;

      const { data: wishesData } = await supabase
        .from("wishes")
        .select("id, text, url, price, sort_order, is_reserved")
        .eq("username", username)
        .order("sort_order", { ascending: true });

      setWishes(wishesData || []);
      setLoading(false);
    };

    fetchData();
  }, [username]);

  const toggleReserveWish = async (wish) => {
    const nextState = !wish.is_reserved;
    setWishes((prev) =>
      prev.map((w) => (w.id === wish.id ? { ...w, is_reserved: nextState } : w))
    );

    await supabase
      .from("wishes")
      .update({ is_reserved: nextState })
      .eq("id", wish.id);
  };

  const handleShare = () => {
    if (typeof window !== "undefined") {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-3 animate-pulse">
          <div className="w-10 h-10 rounded-2xl bg-amber-100/70 flex items-center justify-center text-amber-700">
            <Crown className="w-5 h-5" />
          </div>
          <p className="text-stone-400 text-xs font-medium tracking-wide uppercase">
            Abriendo carta...
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-12 h-12 rounded-2xl bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
          <Gift className="w-6 h-6" />
        </div>
        <h1 className="text-lg font-semibold text-stone-900 mb-1">Carta no encontrada</h1>
        <p className="text-stone-500 mb-6 text-xs max-w-xs">{error}</p>
        <a
          href="/"
          className="px-5 py-2.5 bg-stone-900 text-white rounded-xl font-medium hover:bg-stone-800 transition text-xs"
        >
          Crear mi propia carta
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FAF8F5] flex flex-col items-center px-4 py-8 md:py-14 text-stone-900 selection:bg-amber-200">
      {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

      {/* LIGHTBOX DE IMAGEN */}
      {showImageModal && (
        <div
          className="fixed inset-0 bg-stone-950/90 z-50 flex items-center justify-center p-4 cursor-zoom-out backdrop-blur-xs"
          onClick={() => setShowImageModal(false)}
        >
          <button
            className="absolute top-5 right-5 p-2 rounded-full bg-white/10 text-white hover:bg-white/20 transition"
            aria-label="Cerrar imagen"
          >
            <X className="w-5 h-5" />
          </button>
          <img
            src={profile.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/guts.png";
            }}
            className="max-w-full max-h-[90vh] object-contain rounded-2xl shadow-2xl"
            alt="Imagen ampliada"
          />
        </div>
      )}

      {/* TARJETA EDITORIAL DE LA CARTA */}
      <article className="max-w-xl w-full bg-white p-6 sm:p-10 rounded-3xl shadow-sm border border-stone-200/80">
        {/* CABECERA */}
        <header className="text-center mb-8">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200/60 text-amber-700 text-[11px] font-medium mb-3">
            <Crown className="w-3.5 h-3.5" />
            <span>Carta a los Reyes Magos</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Lista de @{profile.username}
          </h1>

          {profile.title && (
            <p className="mt-4 text-stone-600 text-sm leading-relaxed whitespace-pre-line bg-[#FAF8F5] p-4 rounded-2xl border border-stone-200/60 italic">
              &ldquo;{profile.title}&rdquo;
            </p>
          )}
        </header>

        {/* BANNER DE MODO REY MAGO / DUEÑO */}
        {!isOwnerViewing ? (
          <div className="mb-6 bg-stone-900 text-stone-100 rounded-2xl p-3.5 text-xs flex items-start gap-3">
            <Sparkles className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              <span className="font-semibold text-white">Modo Rey Mago:</span> Si vas a regalar
              algo de esta lista, pulsa en{" "}
              <span className="underline decoration-amber-400">Reservar</span> para que otro
              familiar no lo compre repetido. (@{profile.username} no verá las reservas).
            </div>
          </div>
        ) : (
          <div className="mb-6 bg-amber-50/70 border border-amber-200/70 rounded-2xl p-3.5 text-xs text-stone-700 flex items-center justify-between gap-2">
            <span>
              👀 Vista previa de tu carta (las reservas de tus familiares están ocultas).
            </span>
            <a
              href="/"
              className="font-semibold text-stone-900 underline shrink-0 hover:text-amber-700"
            >
              Editar
            </a>
          </div>
        )}

        {/* LISTA DE DESEOS */}
        <div className="space-y-2.5 mb-8">
          {wishes.length === 0 ? (
            <p className="text-center text-stone-400 text-xs py-10 border border-dashed border-stone-200 rounded-2xl">
              Esta carta aún no tiene deseos anotados.
            </p>
          ) : (
            wishes.map((wish, index) => {
              const isReservedVisible = !isOwnerViewing && wish.is_reserved;

              return (
                <div
                  key={wish.id || index}
                  className={`group flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-2xl border transition gap-3 ${
                    isReservedVisible
                      ? "bg-stone-50/80 border-stone-200/60 opacity-65"
                      : "bg-white border-stone-200/90 hover:border-stone-300 shadow-2xs"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-xs font-mono text-stone-400 mt-0.5 select-none">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span
                          className={`text-sm font-medium break-words ${
                            isReservedVisible ? "line-through text-stone-400" : "text-stone-900"
                          }`}
                        >
                          {wish.text}
                        </span>
                        {wish.price && (
                          <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                            ~{wish.price}
                          </span>
                        )}
                      </div>

                      {isReservedVisible && (
                        <span className="inline-flex items-center gap-1 text-[11px] text-amber-700 font-medium mt-1">
                          <Crown className="w-3 h-3" />
                          <span>Ya reservado por un Rey Mago</span>
                        </span>
                      )}
                    </div>
                  </div>

                  {/* ACCIONES DEL REGALO */}
                  <div className="flex items-center gap-1.5 self-end sm:self-center shrink-0">
                    {wish.url && (
                      <a
                        href={wish.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl bg-stone-100 hover:bg-stone-200 text-stone-800 text-xs font-medium transition"
                        title="Abrir enlace exacto"
                      >
                        <span>Ver enlace</span>
                        <ExternalLink className="w-3 h-3" />
                      </a>
                    )}

                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(wish.text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-stone-900 hover:bg-stone-50 transition"
                      title="Buscar en Google"
                    >
                      <Search className="w-3.5 h-3.5" />
                    </a>

                    <a
                      href={`https://www.amazon.es/s?k=${encodeURIComponent(wish.text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-xl border border-stone-200 text-stone-500 hover:text-amber-600 hover:bg-amber-50/50 transition"
                      title="Buscar en Amazon"
                    >
                      <ShoppingBag className="w-3.5 h-3.5" />
                    </a>

                    {!isOwnerViewing && (
                      <button
                        onClick={() => toggleReserveWish(wish)}
                        className={`ml-1 px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                          wish.is_reserved
                            ? "bg-stone-200 text-stone-700 hover:bg-stone-300"
                            : "bg-stone-900 text-white hover:bg-stone-800"
                        }`}
                      >
                        {wish.is_reserved ? "Liberar" : "Reservar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* IMAGEN DE CIERRE */}
        {profile.image && (
          <div className="mt-6">
            <div
              onClick={() => setShowImageModal(true)}
              className="group relative rounded-2xl overflow-hidden border border-stone-200/80 bg-stone-100 cursor-zoom-in"
            >
              <img
                src={profile.image}
                onError={(e) => {
                  e.currentTarget.onerror = null;
                  e.currentTarget.src = "/guts.png";
                }}
                className="w-full h-auto max-h-[360px] object-cover group-hover:scale-[1.01] transition duration-300"
                alt="Postal de la carta"
              />
            </div>
          </div>
        )}
      </article>

      {/* FOOTER MINIMALISTA */}
      <footer className="mt-8 flex flex-col items-center gap-4 text-center">
        <div className="flex items-center gap-2">
          <button
            onClick={handleShare}
            className={`px-4 py-2 rounded-xl text-xs font-medium transition flex items-center gap-1.5 border ${
              copied
                ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
            }`}
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Enlace copiado</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Compartir carta</span>
              </>
            )}
          </button>

          <button
            onClick={() => setShowDonate(true)}
            className="px-4 py-2 rounded-xl text-xs font-medium bg-white border border-stone-200 text-stone-600 hover:bg-stone-50 transition flex items-center gap-1.5"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Apoyar</span>
          </button>
        </div>

        <p className="text-xs text-stone-400">
          ¿Quieres escribir la tuya?{" "}
          <a href="/" className="text-stone-800 font-medium underline hover:text-amber-700">
            Crear mi carta gratis
          </a>
        </p>
      </footer>
    </main>
  );
}