// app/explorar/page.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import {
  Crown,
  Search,
  Sparkles,
  ArrowLeft,
  ArrowUpRight,
  Gift,
  Users,
} from "lucide-react";

export default function ExplorePage() {
  const [letters, setLetters] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchPublicLetters = async () => {
      setLoading(true);
      setErrorMsg("");

      try {
        // 1. Traemos todos los perfiles públicos (consulta simple que nunca falla)
        const { data: profilesData, error: profilesError } = await supabase
          .from("profiles")
          .select("username, title, image, created_at")
          .eq("is_public", true)
          .order("created_at", { ascending: false });

        if (profilesError) throw profilesError;

        if (!profilesData || profilesData.length === 0) {
          setLetters([]);
          return;
        }

        // 2. Traemos los deseos de esos usuarios públicos
        const usernames = profilesData.map((p) => p.username);
        const { data: wishesData, error: wishesError } = await supabase
          .from("wishes")
          .select("id, username, text, sort_order")
          .in("username", usernames)
          .order("sort_order", { ascending: true });

        if (wishesError) throw wishesError;

        // 3. Unimos cada perfil con sus deseos (mostrando también los que tienen 0 deseos)
        const combined = profilesData.map((profile) => ({
          ...profile,
          wishes: (wishesData || []).filter((w) => w.username === profile.username),
        }));

        setLetters(combined);
      } catch (err) {
        console.error("Error cargando el muro público:", err);
        setErrorMsg(err.message || "Error al cargar las cartas.");
      } finally {
        // El finally garantiza que NUNCA se quede pillado en los esqueletos grises
        setLoading(false);
      }
    };

    fetchPublicLetters();
  }, []);

  const filteredLetters = letters.filter(
    (item) =>
      item.username.toLowerCase().includes(search.toLowerCase()) ||
      (item.title && item.title.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900 selection:bg-amber-200">
      {/* HEADER */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
          <a
            href="/"
            className="flex items-center gap-2 text-xs font-medium text-stone-600 hover:text-stone-900 transition"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a mi carta</span>
          </a>

          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-amber-50 border border-amber-200/70 text-amber-600 rounded-lg flex items-center justify-center">
              <Crown className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-semibold tracking-tight">Muro Público</span>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 md:py-12">
        {/* CABECERA Y BUSCADOR */}
        <div className="max-w-xl mx-auto text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-stone-200/60 text-stone-700 text-[11px] font-medium mb-3">
            <Users className="w-3.5 h-3.5" />
            <span>Comunidad Real</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-semibold tracking-tight text-stone-900">
            Cartas de la comunidad
          </h1>
          <p className="text-xs sm:text-sm text-stone-500 mt-1.5">
            Encuentra la carta de tus amigos o coge ideas viendo qué pide la gente este año.
          </p>

          <div className="mt-6 flex items-center gap-2.5 bg-white px-4 py-3 rounded-2xl border border-stone-200/90 shadow-2xs focus-within:border-stone-900 transition">
            <Search className="w-4 h-4 text-stone-400 shrink-0" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre de usuario (ej. dani)..."
              className="w-full bg-transparent text-sm outline-none placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* MENSAJE DE ERROR SI FALLA SUPABASE */}
        {errorMsg && (
          <div className="max-w-md mx-auto mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-2xl text-xs text-center">
            ⚠️ Hubo un problema al conectar: {errorMsg}
          </div>
        )}

        {/* LISTADO DE CARTAS */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-56 bg-white rounded-3xl border border-stone-200/60 p-5 animate-pulse flex flex-col justify-between"
              >
                <div className="w-24 h-4 bg-stone-200 rounded" />
                <div className="space-y-2">
                  <div className="w-full h-3 bg-stone-100 rounded" />
                  <div className="w-2/3 h-3 bg-stone-100 rounded" />
                </div>
                <div className="w-full h-8 bg-stone-100 rounded-xl" />
              </div>
            ))}
          </div>
        ) : filteredLetters.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-stone-200 max-w-md mx-auto p-6">
            <Sparkles className="w-6 h-6 text-stone-300 mx-auto mb-2" />
            <p className="text-sm font-medium text-stone-700">No se encontraron cartas públicas</p>
            <p className="text-xs text-stone-400 mt-1">
              {search
                ? `No hay ninguna carta pública que coincida con "${search}".`
                : "Sé el primero en hacer pública tu carta desde tu panel de control."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredLetters.map((item) => (
              <a
                key={item.username}
                href={`/u/${item.username}`}
                className="group bg-white rounded-3xl border border-stone-200/80 hover:border-stone-400 p-5 shadow-2xs hover:shadow-md transition flex flex-col justify-between"
              >
                <div>
                  {/* Cabecera de la tarjeta */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <img
                        src={item.image || "/guts.png"}
                        onError={(e) => {
                          e.currentTarget.onerror = null;
                          e.currentTarget.src = "/guts.png";
                        }}
                        alt={item.username}
                        className="w-9 h-9 rounded-xl object-cover border border-stone-200 shrink-0 bg-stone-100"
                      />
                      <span className="font-semibold text-sm text-stone-900 truncate">
                        @{item.username}
                      </span>
                    </div>

                    <span className="text-[11px] font-mono bg-amber-50 text-amber-800 border border-amber-200/60 px-2.5 py-0.5 rounded-full shrink-0">
                      {item.wishes.length} {item.wishes.length === 1 ? "deseo" : "deseos"}
                    </span>
                  </div>

                  {/* Nota recortada */}
                  {item.title && (
                    <p className="text-xs text-stone-500 italic line-clamp-2 mb-4 bg-[#FAF8F5] p-2.5 rounded-xl border border-stone-100">
                      &ldquo;{item.title}&rdquo;
                    </p>
                  )}

                  {/* Vista previa de los 2 primeros deseos o aviso de lista vacía */}
                  <div className="space-y-1.5 mb-4">
                    {item.wishes.length === 0 ? (
                      <div className="text-xs text-stone-400 italic bg-stone-50/60 px-3 py-2 rounded-lg border border-dashed border-stone-200 text-center">
                        Aún pensando qué pedir...
                      </div>
                    ) : (
                      <>
                        {item.wishes.slice(0, 2).map((w, idx) => (
                          <div
                            key={w.id || idx}
                            className="flex items-center gap-2 text-xs text-stone-700 bg-stone-50/80 px-2.5 py-1.5 rounded-lg border border-stone-200/50"
                          >
                            <Gift className="w-3 h-3 text-amber-600 shrink-0" />
                            <span className="truncate">{w.text}</span>
                          </div>
                        ))}
                        {item.wishes.length > 2 && (
                          <p className="text-[11px] text-stone-400 pl-1">
                            + {item.wishes.length - 2} más en su lista...
                          </p>
                        )}
                      </>
                    )}
                  </div>
                </div>

                {/* Pie de tarjeta */}
                <div className="pt-3 border-t border-stone-100 flex items-center justify-between text-xs font-medium text-stone-900 group-hover:text-amber-700 transition">
                  <span>Abrir carta completa</span>
                  <ArrowUpRight className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition" />
                </div>
              </a>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}