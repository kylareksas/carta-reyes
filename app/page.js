"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DonationModal from "./components/DonationModal";

export default function Dashboard() {
  const [user, setUser] = useState(null); // { username, title, image }
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  // Estados Login / Registro con PIN de 4 dígitos
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // Estados Formulario de Nuevo Deseo
  const [newWishText, setNewWishText] = useState("");
  const [newWishUrl, setNewWishUrl] = useState("");
  const [newWishPrice, setNewWishPrice] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Estados Perfil
  const [customTitle, setCustomTitle] = useState("Este año he intentado ser muy bueno...");
  const [customImage, setCustomImage] = useState("/guts.png");
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    // Recuperar sesión guardada en navegador
    const savedUser = localStorage.getItem("carta_reyes_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setCustomTitle(parsed.title || "Este año he intentado ser muy bueno...");
      setCustomImage(parsed.image || "/guts.png");
      fetchWishes(parsed.username);
    } else {
      setLoading(false);
    }
    return () => cancelAnimationFrame(animation);
  }, []);

  const fetchWishes = async (username) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("wishes")
      .select("id, text, url, price, sort_order") // OMITIMOS is_reserved para no hacer spoiler al dueño
      .eq("username", username)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setWishes(data);
    }
    setLoading(false);
  };

  // --- AUTENTICACIÓN CON USUARIO + PIN 4 DÍGITOS ---
  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    const cleanUsername = usernameInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (cleanUsername.length < 3) {
      setAuthError("El usuario debe tener al menos 3 caracteres (letras o números).");
      return;
    }

    if (!/^\d{4}$/.test(pinInput)) {
      setAuthError("El PIN debe ser exactamente de 4 números (ej: 1234).");
      return;
    }

    setAuthLoading(true);

    try {
      if (isRegistering) {
        // Comprobar si existe
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (existing) {
          setAuthError("Ese nombre de usuario ya está cogido. Prueba otro.");
          setAuthLoading(false);
          return;
        }

        const newProfile = {
          username: cleanUsername,
          pin: pinInput,
          title: "¡Hola Reyes Magos! Este año me he portado genial y esta es mi lista:",
          image: "/guts.png",
        };

        const { error: insertError } = await supabase.from("profiles").insert([newProfile]);
        if (insertError) throw insertError;

        const sessionData = {
          username: newProfile.username,
          title: newProfile.title,
          image: newProfile.image,
        };
        localStorage.setItem("carta_reyes_user", JSON.stringify(sessionData));
        setUser(sessionData);
        setCustomTitle(sessionData.title);
        setCustomImage(sessionData.image);
        setWishes([]);
      } else {
        // Iniciar sesión verificando usuario y PIN
        const { data, error } = await supabase
          .from("profiles")
          .select("username, title, image, pin")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (error || !data || data.pin !== pinInput) {
          setAuthError("Usuario o PIN incorrectos.");
          setAuthLoading(false);
          return;
        }

        const sessionData = {
          username: data.username,
          title: data.title,
          image: data.image,
        };
        localStorage.setItem("carta_reyes_user", JSON.stringify(sessionData));
        setUser(sessionData);
        setCustomTitle(data.title);
        setCustomImage(data.image);
        fetchWishes(data.username);
      }
    } catch (err) {
      setAuthError("Error de conexión. Inténtalo de nuevo.");
      console.error(err);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("carta_reyes_user");
    setUser(null);
    setWishes([]);
    setPinInput("");
  };

  // --- GUARDAR PERFIL ---
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ title: customTitle, image: customImage })
      .eq("username", user.username);

    if (!error) {
      const updated = { ...user, title: customTitle, image: customImage };
      setUser(updated);
      localStorage.setItem("carta_reyes_user", JSON.stringify(updated));
      alert("✅ ¡Carta actualizada!");
    } else {
      alert("Error al guardar: " + error.message);
    }
    setIsSavingProfile(false);
  };

  // --- AÑADIR, BORRAR Y REORDENAR DESEOS ---
  const handleAddWish = async (e) => {
    e.preventDefault();
    if (!newWishText.trim() || !user) return;

    const nextOrder = wishes.length;
    const { data, error } = await supabase
      .from("wishes")
      .insert([
        {
          username: user.username,
          text: newWishText.trim(),
          url: newWishUrl.trim(),
          price: newWishPrice.trim(),
          sort_order: nextOrder,
        },
      ])
      .select("id, text, url, price, sort_order")
      .single();

    if (!error && data) {
      setWishes([...wishes, data]);
      setNewWishText("");
      setNewWishUrl("");
      setNewWishPrice("");
      setShowExtraFields(false);
    }
  };

  const handleDeleteWish = async (id) => {
    setWishes(wishes.filter((w) => w.id !== id));
    await supabase.from("wishes").delete().eq("id", id);
  };

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(wishes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, idx) => ({ ...item, sort_order: idx }));
    setWishes(updatedItems);

    // Actualizar orden en Supabase en paralelo
    await Promise.all(
      updatedItems.map((item) =>
        supabase.from("wishes").update({ sort_order: item.sort_order }).eq("id", item.id)
      )
    );
  };

  const copyPublicUrl = () => {
    if (typeof window !== "undefined" && user) {
      navigator.clipboard.writeText(`${window.location.origin}/u/${user.username}`);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2000);
    }
  };

  if (!enabled) return null;

  // --- PANTALLA DE ACCESO CON PIN DE 4 DÍGITOS ---
  if (!user) {
    return (
      <main className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-4 text-slate-800">
        {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

        <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-4 border-red-600 mb-6">
          <div className="text-center mb-6">
            <span className="text-4xl">👑</span>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-800 mt-1">
              Carta a los Reyes
            </h1>
            <p className="text-gray-500 text-sm mt-1">
              {isRegistering
                ? "Crea tu carta en 5 segundos con un PIN de 4 números"
                : "Entra con tu nombre y tu PIN de 4 números"}
            </p>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Tu Nombre / Usuario
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value.toLowerCase().replace(/\s+/g, ""))}
                placeholder="ej: dani"
                required
                autoComplete="username"
                className="w-full p-3 border border-gray-300 rounded-xl text-base focus:ring-2 focus:ring-red-400 outline-none"
              />
              {usernameInput && (
                <p className="text-xs text-gray-400 mt-1">
                  Tu enlace será: <span className="font-mono text-slate-600">/u/{usernameInput}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                PIN de 4 dígitos
              </label>
              <input
                type="password"
                inputMode="numeric"
                maxLength={4}
                pattern="\d{4}"
                value={pinInput}
                onChange={(e) => setPinInput(e.target.value.replace(/\D/g, "").slice(0, 4))}
                placeholder="••••"
                required
                className="w-full p-3 border border-gray-300 rounded-xl text-center text-2xl tracking-[0.75em] font-mono focus:ring-2 focus:ring-red-400 outline-none"
              />
            </div>

            {authError && (
              <div className="bg-red-50 border border-red-200 text-red-600 text-xs p-3 rounded-lg font-medium">
                ⚠️ {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-red-600 text-white p-3.5 rounded-xl font-bold hover:bg-red-700 transition shadow-md disabled:opacity-50"
            >
              {authLoading
                ? "Cargando..."
                : isRegistering
                ? "Crear mi Carta 🎁"
                : "Entrar a mi Carta"}
            </button>
          </form>

          <div className="mt-5 border-t pt-4 text-center">
            <button
              onClick={() => {
                setIsRegistering(!isRegistering);
                setAuthError("");
              }}
              className="text-sm font-medium text-blue-600 hover:underline"
            >
              {isRegistering
                ? "¿Ya tienes una carta? Entra aquí"
                : "¿Aún no tienes carta? Créala gratis"}
            </button>
          </div>
        </div>

        <button
          onClick={() => setShowDonate(true)}
          className="bg-amber-100 border border-amber-300 text-amber-900 px-5 py-2 rounded-full font-bold hover:bg-amber-200 transition text-sm flex items-center gap-2 shadow-xs"
        >
          ☕ Invítame a un café
        </button>
      </main>
    );
  }

  // --- PANEL DE EDICIÓN DEL USUARIO ---
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}

      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-12 gap-6">
        {/* COLUMNA IZQUIERDA (5 cols): ENLACE Y PERFIL */}
        <div className="md:col-span-5 space-y-6 order-2 md:order-1">
          {/* TARJETA DE COMPARTIR */}
          <div className="bg-emerald-50 p-5 rounded-2xl border border-emerald-200 shadow-xs">
            <h2 className="text-base font-bold text-emerald-900 mb-1">
              🌍 Tu Enlace para compartir
            </h2>
            <p className="text-xs text-emerald-700 mb-3">
              Pásalo por WhatsApp. Tus familiares podrán reservar regalos en secreto sin que tú lo veas para no arruinarte la sorpresa.
            </p>
            <div className="bg-white p-2.5 rounded-lg border border-emerald-200 text-xs font-mono select-all mb-3 truncate">
              {typeof window !== "undefined"
                ? `${window.location.origin}/u/${user.username}`
                : `/u/${user.username}`}
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={copyPublicUrl}
                className="bg-white border border-emerald-300 text-emerald-800 py-2 rounded-lg font-bold text-xs hover:bg-emerald-100 transition"
              >
                {copiedLink ? "✅ ¡Copiado!" : "📋 Copiar enlace"}
              </button>
              <a
                href={`/u/${user.username}`}
                target="_blank"
                className="bg-emerald-600 text-white py-2 rounded-lg font-bold text-xs text-center hover:bg-emerald-700 transition"
              >
                Ver mi carta &rarr;
              </a>
            </div>
          </div>

          {/* PERSONALIZACIÓN DE LA CARTA */}
          <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200">
            <h2 className="text-lg font-bold mb-4">
              ⚙️ Personalizar carta de <span className="text-red-600">@{user.username}</span>
            </h2>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Mensaje de introducción:
              </label>
              <textarea
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                rows={4}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none resize-y"
                placeholder="Queridos Reyes Magos..."
              />
            </div>

            <div className="mb-4">
              <label className="block text-xs font-bold uppercase text-gray-500 mb-1">
                Imagen final (URL):
              </label>
              <input
                type="text"
                value={customImage}
                onChange={(e) => setCustomImage(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-amber-400 outline-none"
                placeholder="https://..."
              />
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="bg-slate-900 text-white py-2.5 px-4 rounded-xl hover:bg-slate-800 w-full font-bold text-sm transition disabled:opacity-50"
            >
              {isSavingProfile ? "Guardando..." : "Guardar mensaje e imagen"}
            </button>
          </div>

          <div className="flex items-center justify-between pt-2 px-1">
            <button
              onClick={() => setShowDonate(true)}
              className="text-amber-800 bg-amber-100 hover:bg-amber-200 px-4 py-2 rounded-xl text-xs font-bold transition"
            >
              ☕ Apoyar la app
            </button>
            <button
              onClick={handleLogout}
              className="text-red-500 hover:text-red-700 text-xs font-bold underline"
            >
              Salir de @{user.username}
            </button>
          </div>
        </div>

        {/* COLUMNA DERECHA (7 cols): LISTA DE DESEOS */}
        <div className="md:col-span-7 bg-white p-5 md:p-6 rounded-2xl shadow-xs border-t-4 border-amber-400 order-1 md:order-2 h-fit">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg md:text-xl font-bold">📝 Tus Deseos ({wishes.length})</h2>
            <span className="text-xs text-gray-400">Arrastra para ordenar por prioridad</span>
          </div>

          {/* FORMULARIO DE AÑADIR DESEO */}
          <form onSubmit={handleAddWish} className="mb-6 bg-slate-50 p-3.5 rounded-xl border border-slate-200">
            <div className="flex gap-2">
              <input
                type="text"
                value={newWishText}
                onChange={(e) => setNewWishText(e.target.value)}
                placeholder="¿Qué te gustaría pedir? (ej: Aeropress Clear)"
                className="flex-1 p-2.5 bg-white border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-amber-400 outline-none"
              />
              <button
                type="submit"
                className="bg-amber-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-amber-600 transition shrink-0"
              >
                Añadir
              </button>
            </div>

            <div className="mt-2">
              <button
                type="button"
                onClick={() => setShowExtraFields(!showExtraFields)}
                className="text-xs text-blue-600 hover:underline font-medium"
              >
                {showExtraFields
                  ? "− Ocultar enlace y precio"
                  : "+ Añadir enlace exacto o precio aproximado (opcional)"}
              </button>

              {showExtraFields && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2 pt-2 border-t border-slate-200">
                  <input
                    type="url"
                    value={newWishUrl}
                    onChange={(e) => setNewWishUrl(e.target.value)}
                    placeholder="Enlace directo (https://...)"
                    className="sm:col-span-2 p-2 bg-white border border-gray-300 rounded-lg text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={newWishPrice}
                    onChange={(e) => setNewWishPrice(e.target.value)}
                    placeholder="Precio aprox (ej: 35€)"
                    className="p-2 bg-white border border-gray-300 rounded-lg text-xs outline-none"
                  />
                </div>
              )}
            </div>
          </form>

          {/* LISTA ORDENABLE */}
          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="wishesList">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2.5 min-h-[50px]"
                >
                  {wishes.length === 0 && !loading && (
                    <p className="text-center text-gray-400 italic py-8 text-sm">
                      Aún no has añadido ningún regalo a tu carta.
                    </p>
                  )}

                  {wishes.map((wish, index) => (
                    <Draggable key={wish.id} draggableId={String(wish.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          {...provided.dragHandleProps}
                          className={`flex justify-between items-center bg-white p-3.5 rounded-xl border transition-all
                            ${
                              snapshot.isDragging
                                ? "shadow-lg bg-amber-50 border-amber-400 scale-[1.01]"
                                : "border-slate-200 hover:border-slate-300"
                            }
                          `}
                        >
                          <div className="flex items-center gap-3 overflow-hidden pr-2">
                            <span className="text-gray-300 font-bold cursor-grab active:cursor-grabbing select-none">
                              #{index + 1} ⋮⋮
                            </span>
                            <div className="overflow-hidden">
                              <p className="font-medium text-sm md:text-base break-words">
                                {wish.text}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                {wish.price && (
                                  <span className="text-xs bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-semibold">
                                    ~{wish.price}
                                  </span>
                                )}
                                {wish.url && (
                                  <a
                                    href={wish.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="text-xs text-blue-600 underline truncate max-w-[180px]"
                                  >
                                    Ver enlace incluido
                                  </a>
                                )}
                              </div>
                            </div>
                          </div>

                          <button
                            onClick={() => handleDeleteWish(wish.id)}
                            className="text-gray-400 hover:text-red-600 p-1.5 rounded-lg hover:bg-red-50 transition shrink-0"
                            title="Eliminar deseo"
                          >
                            ✕
                          </button>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </div>
    </main>
  );
}