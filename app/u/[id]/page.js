"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "../../supabase";
import DonationModal from "../../components/DonationModal";

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
    // Detectar si quien mira la carta es el propio dueño para ocultar el estado de reservas (Anti-Spoiler)
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

      // 1. Obtener perfil (Sin seleccionar nunca la columna PIN)
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
      document.title = `Carta de @${userData.username} a los Reyes Magos 👑`;

      // 2. Obtener lista de deseos
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

  // --- RESERVAR / LIBERAR REGALO (MODO REY MAGO) ---
  const toggleReserveWish = async (wish) => {
    const nextState = !wish.is_reserved;
    // Actualización optimista en interfaz
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
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
        <div className="text-center animate-pulse">
          <div className="text-5xl mb-3">👑</div>
          <p className="text-amber-800 font-serif text-lg">Abriendo el lacre real...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
        <div className="text-5xl mb-4">🐪</div>
        <h1 className="text-2xl font-bold text-red-600 mb-2">Carta no encontrada</h1>
        <p className="text-slate-600 mb-6 text-sm">{error}</p>
        <a
          href="/"
          className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition text-sm"
        >
          Crear mi propia carta
        </a>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-3 md:p-8 font-serif text-slate-800">
      {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

      {showImageModal && (
        <div
          className="fixed inset-0 bg-black/95 z-50 flex items-center justify-center p-4 cursor-zoom-out"
          onClick={() => setShowImageModal(false)}
        >
          <img
            src={profile.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/guts.png";
            }}
            className="max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
            alt="Imagen ampliada"
          />
        </div>
      )}

      <div className="max-w-2xl w-full bg-white p-5 md:p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden my-2">
        <div className="absolute top-0 left-0 w-full h-3 bg-red-600" />

        <h1 className="text-3xl md:text-4xl font-bold text-center text-red-700 mb-1 mt-3">
          👑👑👑
        </h1>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800">
          Carta a los Reyes Magos
        </h2>
        <p className="text-center text-xs font-sans uppercase tracking-widest text-amber-700 font-bold mt-1 mb-5">
          De: @{profile.username}
        </p>

        <p className="text-center text-slate-600 mb-6 italic text-base md:text-lg whitespace-pre-line bg-amber-50/60 p-4 rounded-xl border border-amber-200/60">
          &ldquo;{profile.title}&rdquo;
        </p>

        {/* AVISO DE COORDINACIÓN PARA FAMILIARES */}
        {!isOwnerViewing ? (
          <div className="mb-5 bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-xs font-sans text-emerald-900 flex items-center justify-between gap-2">
            <span>
              🤫 <strong>Modo Rey Mago:</strong> Si vas a comprar algo, márcalo como{" "}
              <em>&ldquo;Lo pido&rdquo;</em> para que otro familiar no lo compre repetido. (
              @{profile.username} no verá qué regalos están reservados).
            </span>
          </div>
        ) : (
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs font-sans text-amber-900 flex items-center justify-between">
            <span>
              👀 Estás viendo tu propia carta. Las reservas de tus Reyes Magos están ocultas para no arruinarte la sorpresa.
            </span>
            <a href="/" className="font-bold underline shrink-0 ml-2">
              Editar lista
            </a>
          </div>
        )}

        {/* LISTA DE REGALOS */}
        <div className="space-y-3 mb-8 font-sans">
          {wishes.length === 0 ? (
            <p className="text-center text-gray-400 italic py-6">
              Esta lista está vacía... ¡Aún!
            </p>
          ) : (
            wishes.map((wish, index) => {
              const reservedHiddenForOwner = !isOwnerViewing && wish.is_reserved;

              return (
                <div
                  key={wish.id || index}
                  className={`flex flex-col sm:flex-row justify-between items-start sm:items-center p-3.5 rounded-xl border-l-4 shadow-xs gap-3 transition ${
                    reservedHiddenForOwner
                      ? "bg-slate-100/70 border-slate-400 opacity-75"
                      : "bg-slate-50 border-emerald-600"
                  }`}
                >
                  <div className="w-full">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span
                        className={`text-base font-medium break-words ${
                          reservedHiddenForOwner ? "line-through text-slate-500" : "text-slate-800"
                        }`}
                      >
                        {wish.text}
                      </span>
                      {wish.price && (
                        <span className="text-xs bg-amber-100 text-amber-900 px-2 py-0.5 rounded-full font-bold">
                          ~{wish.price}
                        </span>
                      )}
                    </div>
                    {reservedHiddenForOwner && (
                      <span className="inline-block text-xs text-emerald-700 font-bold mt-1">
                        👑 Ya reservado por un Rey Mago
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                    {/* Si el usuario puso un enlace exacto, destacarlo */}
                    {wish.url && (
                      <a
                        href={wish.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-3 py-2 rounded-lg transition shadow-xs"
                      >
                        🔗 Ver exacto
                      </a>
                    )}

                    {/* Botón Google */}
                    <a
                      href={`https://www.google.com/search?q=${encodeURIComponent(wish.text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-gray-200 hover:border-blue-400 p-2 rounded-lg transition shadow-xs"
                      title="Buscar en Google"
                    >
                      <svg viewBox="0 0 24 24" width="18" height="18">
                        <path
                          d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                          fill="#4285F4"
                        />
                        <path
                          d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                          fill="#34A853"
                        />
                        <path
                          d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                          fill="#FBBC05"
                        />
                        <path
                          d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                          fill="#EA4335"
                        />
                      </svg>
                    </a>

                    {/* Botón Amazon */}
                    <a
                      href={`https://www.amazon.es/s?k=${encodeURIComponent(wish.text)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bg-white border border-gray-200 hover:border-yellow-500 p-2 rounded-lg transition shadow-xs flex items-center justify-center w-9 h-9"
                      title="Buscar en Amazon"
                    >
                      <img src="/amazon.png" alt="Amazon" className="w-5 h-5 object-contain" />
                    </a>

                    {/* Botón Reservar (Solo visible si NO es el dueño) */}
                    {!isOwnerViewing && (
                      <button
                        onClick={() => toggleReserveWish(wish)}
                        className={`text-xs font-bold px-3 py-2 rounded-lg border transition ${
                          wish.is_reserved
                            ? "bg-slate-200 border-slate-300 text-slate-700 hover:bg-slate-300"
                            : "bg-emerald-600 border-emerald-600 text-white hover:bg-emerald-700"
                        }`}
                      >
                        {wish.is_reserved ? "Liberar" : "👑 Lo pido"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* IMAGEN DE LA CARTA */}
        <div className="mt-6">
          <img
            src={profile.image}
            onError={(e) => {
              e.currentTarget.onerror = null;
              e.currentTarget.src = "/guts.png";
            }}
            className="w-full h-auto rounded-xl shadow-xs border-2 border-amber-500/30 object-cover max-h-[380px] cursor-zoom-in hover:opacity-95 transition"
            onClick={() => setShowImageModal(true)}
            alt="Imagen de la carta"
          />
        </div>
      </div>

      <footer className="mt-6 text-amber-800/70 text-xs md:text-sm text-center pb-8 flex flex-col gap-3 font-sans">
        <button
          onClick={handleShare}
          className={`px-5 py-2.5 rounded-full font-bold transition text-sm flex items-center justify-center gap-2 mx-auto shadow-xs border ${
            copied
              ? "bg-green-100 border-green-300 text-green-800"
              : "bg-white border-gray-300 text-gray-700 hover:bg-gray-50"
          }`}
        >
          {copied ? "✅ ¡Enlace Copiado!" : "🔗 Copiar enlace de esta carta"}
        </button>

        <button
          onClick={() => setShowDonate(true)}
          className="bg-amber-100 border border-amber-300 text-amber-900 px-5 py-2 rounded-full font-bold hover:bg-amber-200 transition text-sm flex items-center justify-center gap-2 mx-auto shadow-xs"
        >
          ☕ Apoyar al creador
        </button>

        <p className="pt-3">
          ¿Quieres hacer tu propia carta a los Reyes Magos? <br />
          <a href="/" className="font-bold underline text-red-700 hover:text-red-800">
            Créala gratis en 5 segundos aquí
          </a>
        </p>
      </footer>
    </main>
  );
}