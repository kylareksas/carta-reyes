// app/page.js
"use client";
import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import DonationModal from "./components/DonationModal";
import WhatsNewBanner from "./components/WhatsNewBanner";
import {
  Crown,
  Plus,
  GripVertical,
  Trash2,
  Copy,
  Check,
  ExternalLink,
  LogOut,
  Coffee,
  Link as LinkIcon,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Globe,
  Lock,
  Compass,
  Pencil,
  X
} from "lucide-react";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [enabled, setEnabled] = useState(false);
  const [showDonate, setShowDonate] = useState(false);

  // Auth
  const [isRegistering, setIsRegistering] = useState(false);
  const [usernameInput, setUsernameInput] = useState("");
  const [pinInput, setPinInput] = useState("");
  const [authError, setAuthError] = useState("");
  const [authLoading, setAuthLoading] = useState(false);

  // --- ESTOS SON LOS QUE FALTAN O SE HAN BORRADO ---
  // Nuevo deseo
  const [newWishText, setNewWishText] = useState("");
  const [newWishUrl, setNewWishUrl] = useState("");
  const [newWishPrice, setNewWishPrice] = useState("");
  const [showExtraFields, setShowExtraFields] = useState(false);

  // Estados para Edición de deseos (los que añadimos antes)
  const [editingWishId, setEditingWishId] = useState(null);
  const [editWishText, setEditWishText] = useState("");
  const [editWishUrl, setEditWishUrl] = useState("");
  const [editWishPrice, setEditWishPrice] = useState("");

  // Perfil y Visibilidad Pública
  const [customTitle, setCustomTitle] = useState("Este año he intentado portarme muy bien...");
  const [customImage, setCustomImage] = useState("/guts.png");
  const [isPublic, setIsPublic] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    const savedUser = localStorage.getItem("carta_reyes_user");
    if (savedUser) {
      const parsed = JSON.parse(savedUser);
      setUser(parsed);
      setCustomTitle(parsed.title || "Este año he intentado portarme muy bien...");
      setCustomImage(parsed.image || "/guts.png");
      setIsPublic(Boolean(parsed.is_public));
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
      .select("id, text, url, price, sort_order")
      .eq("username", username)
      .order("sort_order", { ascending: true });

    if (!error && data) setWishes(data);
    setLoading(false);
  };

  const handleAuth = async (e) => {
    e.preventDefault();
    setAuthError("");

    const cleanUsername = usernameInput
      .trim()
      .toLowerCase()
      .replace(/[^a-z0-9_-]/g, "");

    if (cleanUsername.length < 3) {
      setAuthError("El usuario debe tener al menos 3 caracteres.");
      return;
    }

    if (!/^\d{4}$/.test(pinInput)) {
      setAuthError("El PIN debe tener exactamente 4 dígitos numéricos.");
      return;
    }

    setAuthLoading(true);

    try {
      if (isRegistering) {
        const { data: existing } = await supabase
          .from("profiles")
          .select("username")
          .eq("username", cleanUsername)
          .maybeSingle();

        if (existing) {
          setAuthError("Este usuario ya está en uso. Elige otro.");
          setAuthLoading(false);
          return;
        }

        const newProfile = {
          username: cleanUsername,
          pin: pinInput,
          title: "Queridos Reyes Magos, este año me he portado genial y esta es mi lista de deseos:",
          image: "/guts.png",
          is_public: false,
        };

        const { error: insertError } = await supabase.from("profiles").insert([newProfile]);
        if (insertError) throw insertError;

        const sessionData = {
          username: newProfile.username,
          title: newProfile.title,
          image: newProfile.image,
          is_public: false,
        };
        localStorage.setItem("carta_reyes_user", JSON.stringify(sessionData));
        setUser(sessionData);
        setCustomTitle(sessionData.title);
        setCustomImage(sessionData.image);
        setIsPublic(false);
        setWishes([]);
      } else {
        const { data, error } = await supabase
          .from("profiles")
          .select("username, title, image, is_public, pin")
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
          is_public: Boolean(data.is_public),
        };
        localStorage.setItem("carta_reyes_user", JSON.stringify(sessionData));
        setUser(sessionData);
        setCustomTitle(data.title);
        setCustomImage(data.image);
        setIsPublic(Boolean(data.is_public));
        fetchWishes(data.username);
      }
    } catch (err) {
      setAuthError("Error al conectar con el servidor.");
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

  // Cambiar visibilidad pública/privada al instante
  const handleTogglePublic = async () => {
    if (!user) return;
    const nextValue = !isPublic;
    setIsPublic(nextValue);

    const { error } = await supabase
      .from("profiles")
      .update({ is_public: nextValue })
      .eq("username", user.username);

    if (!error) {
      const updated = { ...user, is_public: nextValue };
      setUser(updated);
      localStorage.setItem("carta_reyes_user", JSON.stringify(updated));
    } else {
      setIsPublic(!nextValue); // Revertir si falla
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    const { error } = await supabase
      .from("profiles")
      .update({ title: customTitle, image: customImage, is_public: isPublic })
      .eq("username", user.username);

    if (!error) {
      const updated = {
        ...user,
        title: customTitle,
        image: customImage,
        is_public: isPublic,
      };
      setUser(updated);
      localStorage.setItem("carta_reyes_user", JSON.stringify(updated));
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 2500);
    }
    setIsSavingProfile(false);
  };

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

  const handleEditClick = (wish) => {
    setEditingWishId(wish.id);
    setEditWishText(wish.text);
    setEditWishUrl(wish.url || "");
    setEditWishPrice(wish.price || "");
  };

  const handleCancelEdit = () => {
    setEditingWishId(null);
  };

  const handleSaveEdit = async (id) => {
    if (!editWishText.trim()) return;

    // 1. Actualización optimista en la interfaz
    setWishes(wishes.map(w => w.id === id ? {
      ...w, 
      text: editWishText.trim(), 
      url: editWishUrl.trim(), 
      price: editWishPrice.trim()
    } : w));
    
    setEditingWishId(null);

    // 2. Guardar en Supabase
    const { error } = await supabase
      .from("wishes")
      .update({ 
        text: editWishText.trim(), 
        url: editWishUrl.trim(), 
        price: editWishPrice.trim() 
      })
      .eq("id", id);

    if (error) {
      alert("Error al actualizar el regalo");
      console.error(error);
    }
  };

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(wishes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    const updatedItems = items.map((item, idx) => ({ ...item, sort_order: idx }));
    setWishes(updatedItems);

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

  // --- LOGIN / REGISTRO ---
  if (!user) {
    return (
      <main className="min-h-screen bg-[#FAF8F5] flex flex-col items-center justify-center p-4 text-stone-900 selection:bg-amber-200">
        {showDonate && <DonationModal onClose={() => setShowDonate(false)} />}
          <WhatsNewBanner />
        <div className="max-w-sm w-full bg-white p-7 rounded-3xl shadow-sm border border-stone-200/80 mb-5">
          <div className="flex flex-col items-center text-center mb-6">
            <div className="w-11 h-11 bg-amber-50 border border-amber-200/60 text-amber-600 rounded-2xl flex items-center justify-center mb-3 shadow-2xs">
              <Crown className="w-5 h-5" />
            </div>
            <h1 className="text-xl font-semibold tracking-tight text-stone-900">
              Carta de Reyes
            </h1>
            <p className="text-stone-500 text-xs mt-1">
              Crea y comparte tu lista de deseos sin complicaciones
            </p>
          </div>

          <div className="grid grid-cols-2 p-1 bg-stone-100 rounded-xl mb-6 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsRegistering(false);
                setAuthError("");
              }}
              className={`py-2 rounded-lg transition ${
                !isRegistering
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Iniciar sesión
            </button>
            <button
              type="button"
              onClick={() => {
                setIsRegistering(true);
                setAuthError("");
              }}
              className={`py-2 rounded-lg transition ${
                isRegistering
                  ? "bg-white text-stone-900 shadow-2xs"
                  : "text-stone-500 hover:text-stone-800"
              }`}
            >
              Crear carta
            </button>
          </div>

          <form onSubmit={handleAuth} className="space-y-4">
            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">
                Usuario
              </label>
              <input
                type="text"
                value={usernameInput}
                onChange={(e) =>
                  setUsernameInput(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))
                }
                placeholder="ej. dani"
                required
                autoComplete="username"
                className="w-full px-3.5 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:bg-white focus:border-stone-900 transition outline-none"
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">
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
                className="w-full px-3.5 py-2.5 bg-stone-50/70 border border-stone-200 rounded-xl text-center text-xl tracking-[0.6em] font-mono focus:bg-white focus:border-stone-900 transition outline-none"
              />
            </div>

            {authError && (
              <div className="bg-red-50/80 border border-red-200/80 text-red-600 text-xs px-3 py-2.5 rounded-xl">
                {authError}
              </div>
            )}

            <button
              type="submit"
              disabled={authLoading}
              className="w-full bg-stone-900 text-white py-3 rounded-xl text-sm font-medium hover:bg-stone-800 active:scale-[0.99] transition disabled:opacity-50"
            >
              {authLoading
                ? "Accediendo..."
                : isRegistering
                ? "Crear mi carta"
                : "Entrar"}
            </button>
          </form>
        </div>

        {/* BOTÓN PARA EXPLORAR CARTAS PÚBLICAS SIN LOGUEARSE */}
        <div className="flex flex-col items-center gap-3">
          <a
            href="/explorar"
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-white border border-stone-200/90 shadow-2xs text-xs font-medium text-stone-700 hover:border-stone-400 transition"
          >
            <Compass className="w-4 h-4 text-amber-600" />
            <span>Explorar cartas públicas de la gente</span>
          </a>

          <button
            onClick={() => setShowDonate(true)}
            className="text-stone-400 hover:text-stone-700 text-xs font-medium flex items-center gap-1.5 transition mt-1"
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>Apoyar el proyecto</span>
          </button>
        </div>
      </main>
    );
  }

  // --- DASHBOARD ---
  return (
    <div className="min-h-screen bg-[#FAF8F5] text-stone-900">
{showDonate && <DonationModal onClose={() => setShowDonate(false)} />}
<WhatsNewBanner />
      {/* NAVBAR SUPERIOR */}
      <header className="sticky top-0 z-30 bg-[#FAF8F5]/80 backdrop-blur-md border-b border-stone-200/70">
        <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 bg-amber-50 border border-amber-200/70 text-amber-600 rounded-xl flex items-center justify-center">
              <Crown className="w-4 h-4" />
            </div>
            <span className="text-sm font-semibold tracking-tight">@{user.username}</span>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/explorar"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-white border border-stone-200 text-stone-700 hover:bg-stone-50 transition"
            >
              <Compass className="w-3.5 h-3.5 text-amber-600" />
              <span className="hidden sm:inline">Explorar cartas</span>
            </a>

            <button
              onClick={copyPublicUrl}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                copiedLink
                  ? "bg-emerald-50 border-emerald-200 text-emerald-700"
                  : "bg-white border-stone-200 text-stone-700 hover:bg-stone-50"
              }`}
            >
              {copiedLink ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copiado</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Copiar enlace</span>
                </>
              )}
            </button>

            <a
              href={`/u/${user.username}`}
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition"
            >
              <span>Mi carta</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>

            <button
              onClick={handleLogout}
              className="p-2 text-stone-400 hover:text-stone-700 rounded-xl hover:bg-stone-100 transition"
              title="Cerrar sesión"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* COLUMNA PRINCIPAL (7 cols): LISTA DE DESEOS */}
        <section className="lg:col-span-7 space-y-5">
          <div className="flex items-baseline justify-between">
            <div>
              <h1 className="text-lg font-semibold tracking-tight">Lista de deseos</h1>
              <p className="text-xs text-stone-500">
                Arrastra los elementos para ordenarlos por prioridad
              </p>
            </div>
            <span className="text-xs font-mono text-stone-400 bg-stone-100 px-2.5 py-1 rounded-full">
              {wishes.length} {wishes.length === 1 ? "regalo" : "regalos"}
            </span>
          </div>

          <form
            onSubmit={handleAddWish}
            className="bg-white p-3.5 rounded-2xl border border-stone-200/90 shadow-2xs transition focus-within:border-stone-400"
          >
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newWishText}
                onChange={(e) => setNewWishText(e.target.value)}
                placeholder="Añadir un deseo a la lista..."
                className="flex-1 px-2 py-1.5 text-sm bg-transparent outline-none placeholder:text-stone-400"
              />
              <button
                type="submit"
                disabled={!newWishText.trim()}
                className="bg-stone-900 text-white px-3.5 py-2 rounded-xl text-xs font-medium hover:bg-stone-800 transition flex items-center gap-1 disabled:opacity-30 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Añadir</span>
              </button>
            </div>

            <div className="mt-2 pt-2 border-t border-stone-100 flex flex-col">
              <button
                type="button"
                onClick={() => setShowExtraFields(!showExtraFields)}
                className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1 w-fit transition"
              >
                {showExtraFields ? (
                  <>
                    <ChevronUp className="w-3 h-3" />
                    <span>Ocultar detalles opcionales</span>
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3" />
                    <span>Añadir enlace directo o precio aproximado</span>
                  </>
                )}
              </button>

              {showExtraFields && (
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mt-2.5">
                  <div className="sm:col-span-2 flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/70">
                    <LinkIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                    <input
                      type="url"
                      value={newWishUrl}
                      onChange={(e) => setNewWishUrl(e.target.value)}
                      placeholder="https://tienda.com/producto..."
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                  <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200/70">
                    <span className="text-xs text-stone-400">€</span>
                    <input
                      type="text"
                      value={newWishPrice}
                      onChange={(e) => setNewWishPrice(e.target.value)}
                      placeholder="Precio (ej. 35€)"
                      className="w-full bg-transparent text-xs outline-none"
                    />
                  </div>
                </div>
              )}
            </div>
          </form>

          <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="wishesList">
              {(provided) => (
                <div
                  {...provided.droppableProps}
                  ref={provided.innerRef}
                  className="space-y-2 min-h-[60px]"
                >
                  {wishes.length === 0 && !loading && (
                    <div className="text-center py-12 bg-white/50 rounded-2xl border border-dashed border-stone-200">
                      <Sparkles className="w-5 h-5 text-stone-300 mx-auto mb-2" />
                      <p className="text-xs text-stone-400">
                        Tu carta está en blanco. Añade tu primer deseo arriba.
                      </p>
                    </div>
                  )}

                  {wishes.map((wish, index) => (
                    <Draggable key={wish.id} draggableId={String(wish.id)} index={index}>
                      {(provided, snapshot) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className={`group flex items-center justify-between bg-white px-3.5 py-3 rounded-2xl border transition-all ${
                            snapshot.isDragging
                              ? "shadow-lg border-stone-900 scale-[1.01] z-10"
                              : "border-stone-200/80 hover:border-stone-300"
                          } ${editingWishId === wish.id ? "ring-2 ring-stone-900 border-transparent" : ""}`}
                        >
                          {/* --- MODO EDICIÓN --- */}
                          {editingWishId === wish.id ? (
                            <div className="w-full flex flex-col gap-2 py-1">
                              <input
                                type="text"
                                value={editWishText}
                                onChange={(e) => setEditWishText(e.target.value)}
                                className="w-full px-3 py-2 bg-stone-50 border border-stone-200 rounded-xl text-sm outline-none focus:bg-white focus:border-stone-900 transition"
                                placeholder="Nombre del regalo..."
                                autoFocus
                              />
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                                <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 focus-within:bg-white focus-within:border-stone-900 transition">
                                  <LinkIcon className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                                  <input
                                    type="url"
                                    value={editWishUrl}
                                    onChange={(e) => setEditWishUrl(e.target.value)}
                                    placeholder="Enlace (opcional)"
                                    className="w-full bg-transparent text-xs outline-none"
                                  />
                                </div>
                                <div className="flex items-center gap-2 bg-stone-50 px-3 py-1.5 rounded-xl border border-stone-200 focus-within:bg-white focus-within:border-stone-900 transition">
                                  <span className="text-xs text-stone-400">€</span>
                                  <input
                                    type="text"
                                    value={editWishPrice}
                                    onChange={(e) => setEditWishPrice(e.target.value)}
                                    placeholder="Precio (opcional)"
                                    className="w-full bg-transparent text-xs outline-none"
                                  />
                                </div>
                              </div>
                              <div className="flex items-center justify-end gap-2 mt-1">
                                <button
                                  onClick={handleCancelEdit}
                                  className="px-3 py-1.5 rounded-lg text-xs font-medium text-stone-500 hover:bg-stone-100 transition"
                                >
                                  Cancelar
                                </button>
                                <button
                                  onClick={() => handleSaveEdit(wish.id)}
                                  className="px-4 py-1.5 rounded-lg text-xs font-medium bg-stone-900 text-white hover:bg-stone-800 transition"
                                >
                                  Guardar
                                </button>
                              </div>
                            </div>
                          ) : (
                            /* --- MODO VISTA NORMAL --- */
                            <>
                              <div className="flex items-center gap-3 overflow-hidden pr-2">
                                <div
                                  {...provided.dragHandleProps}
                                  className="text-stone-300 hover:text-stone-500 cursor-grab active:cursor-grabbing p-1 -ml-1"
                                >
                                  <GripVertical className="w-4 h-4" />
                                </div>
                                <span className="text-xs font-mono text-stone-400 select-none">
                                  {String(index + 1).padStart(2, "0")}
                                </span>
                                <div className="overflow-hidden">
                                  <p className="text-sm font-medium text-stone-800 break-words">
                                    {wish.text}
                                  </p>
                                  {(wish.price || wish.url) && (
                                    <div className="flex items-center gap-2 mt-1">
                                      {wish.price && (
                                        <span className="text-[11px] bg-stone-100 text-stone-600 px-2 py-0.5 rounded-md font-medium">
                                          ~{wish.price}
                                        </span>
                                      )}
                                      {wish.url && (
                                        <a
                                          href={wish.url}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                          className="text-[11px] text-amber-700 hover:underline flex items-center gap-0.5 truncate max-w-[200px]"
                                        >
                                          <LinkIcon className="w-2.5 h-2.5 shrink-0" />
                                          <span>Enlace</span>
                                        </a>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0 opacity-80 group-hover:opacity-100 transition">
                                <button
                                  onClick={() => handleEditClick(wish)}
                                  className="p-1.5 text-stone-300 hover:text-blue-600 rounded-xl hover:bg-blue-50 transition"
                                  title="Editar"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => handleDeleteWish(wish.id)}
                                  className="p-1.5 text-stone-300 hover:text-red-600 rounded-xl hover:bg-red-50 transition"
                                  title="Eliminar"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </>
                          )}
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </section>

        {/* COLUMNA LATERAL (5 cols): VISIBILIDAD Y PERSONALIZACIÓN */}
        <aside className="lg:col-span-5 space-y-5">
          {/* INTERRUPTOR DE VISIBILIDAD EN EL MURO PÚBLICO */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs">
            <div className="flex items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div
                  className={`p-2 rounded-xl border mt-0.5 ${
                    isPublic
                      ? "bg-emerald-50 border-emerald-200 text-emerald-600"
                      : "bg-stone-100 border-stone-200 text-stone-500"
                  }`}
                >
                  {isPublic ? <Globe className="w-4 h-4" /> : <Lock className="w-4 h-4" />}
                </div>
                <div>
                  <h2 className="text-sm font-semibold tracking-tight">
                    {isPublic ? "Visible en el muro público" : "Solo mediante enlace"}
                  </h2>
                  <p className="text-xs text-stone-500 mt-0.5 leading-relaxed">
                    {isPublic
                      ? "Cualquier persona puede encontrar tu carta en la sección Explorar sin tener el enlace."
                      : "Solo quienes tengan tu enlace directo (/u/" +
                        user.username +
                        ") pueden ver tu carta."}
                  </p>
                </div>
              </div>

              <button
                type="button"
                role="switch"
                aria-checked={isPublic}
                onClick={handleTogglePublic}
                className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out ${
                  isPublic ? "bg-emerald-600" : "bg-stone-200"
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-xs transition duration-200 ease-in-out ${
                    isPublic ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>
          </div>

          {/* PERSONALIZACIÓN DE LA CARTA */}
          <div className="bg-white p-5 rounded-2xl border border-stone-200/80 shadow-2xs space-y-4">
            <div>
              <h2 className="text-sm font-semibold tracking-tight">Apariencia de la carta</h2>
              <p className="text-xs text-stone-500">
                Personaliza la nota y la imagen que verán al abrir tu carta
              </p>
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">
                Nota introductoria
              </label>
              <textarea
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                rows={4}
                className="w-full p-3 bg-stone-50/70 border border-stone-200 rounded-xl text-sm focus:bg-white focus:border-stone-900 outline-none resize-y transition leading-relaxed"
                placeholder="Queridos Reyes Magos..."
              />
            </div>

            <div>
              <label className="block text-[11px] font-medium uppercase tracking-wider text-stone-400 mb-1.5">
                URL de imagen o ilustración
              </label>
              <div className="flex items-center gap-2 bg-stone-50/70 px-3 py-2 rounded-xl border border-stone-200 focus-within:bg-white focus-within:border-stone-900 transition">
                <ImageIcon className="w-4 h-4 text-stone-400 shrink-0" />
                <input
                  type="text"
                  value={customImage}
                  onChange={(e) => setCustomImage(e.target.value)}
                  className="w-full bg-transparent text-xs outline-none"
                  placeholder="https://..."
                />
              </div>

              {customImage && (
                <div className="mt-3 rounded-xl overflow-hidden border border-stone-200/70 bg-stone-50 max-h-36 flex items-center justify-center">
                  <img
                    src={customImage}
                    alt="Vista previa"
                    onError={(e) => {
                      e.currentTarget.onerror = null;
                      e.currentTarget.src = "/guts.png";
                    }}
                    className="w-full h-36 object-cover"
                  />
                </div>
              )}
            </div>

            <button
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className={`w-full py-2.5 px-4 rounded-xl text-xs font-medium transition flex items-center justify-center gap-1.5 ${
                savedSuccess
                  ? "bg-emerald-600 text-white"
                  : "bg-stone-900 text-white hover:bg-stone-800"
              }`}
            >
              {isSavingProfile ? (
                "Guardando..."
              ) : savedSuccess ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Cambios guardados</span>
                </>
              ) : (
                "Guardar apariencia"
              )}
            </button>
          </div>

          <button
            onClick={() => setShowDonate(true)}
            className="w-full py-2.5 px-4 rounded-2xl border border-stone-200/80 bg-white hover:bg-stone-50 text-stone-600 text-xs font-medium transition flex items-center justify-center gap-1.5"
          >
            <Coffee className="w-3.5 h-3.5 text-amber-600" />
            <span>Invitar a un café al creador</span>
          </button>
        </aside>
      </main>
    </div>
  );
}