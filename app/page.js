"use client";
import { useState, useEffect } from "react";
import { db, auth } from "./firebase"; 
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query, writeBatch, where, setDoc, getDoc 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Dashboard() {
  const [user, setUser] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [newWish, setNewWish] = useState("");
  const [loading, setLoading] = useState(true);
  const [isRegistering, setIsRegistering] = useState(false);
  const [enabled, setEnabled] = useState(false);
  const [showDonate, setShowDonate] = useState(false); // Estado para donación

  // Estados para configuración del perfil
  const [customTitle, setCustomTitle] = useState("Este año he intentado ser muy bueno...");
  const [customImage, setCustomImage] = useState("/guts.png");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  // 1. Detectar Usuario y Cargar Preferencias
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        try {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            if (userDoc.exists()) {
                const data = userDoc.data();
                setCustomTitle(data.title || "Este año he intentado ser muy bueno...");
                setCustomImage(data.image || "/guts.png");
            }
        } catch (error) {
            console.error("Error cargando perfil:", error);
        }
      } else {
        setWishes([]);
      }
    });
    return () => unsubscribe();
  }, []);

  // 2. Cargar Deseos
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
        collection(db, "wishes"), 
        where("uid", "==", user.uid),
        orderBy("order", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishesArr = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWishes(wishesArr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // --- FUNCIONES DE BASE DE DATOS ---

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
        if (isRegistering) {
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            await setDoc(doc(db, "users", userCred.user.uid), {
                title: "¡Hola Reyes Magos! Esta es mi lista",
                image: "/guts.png",
                email: email
            });
        } else {
            await signInWithEmailAndPassword(auth, email, password);
        }
    } catch (error) {
        alert("Error de autenticación: " + error.message);
    }
  };

  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
        await setDoc(doc(db, "users", user.uid), {
            title: customTitle,
            image: customImage, 
            email: user.email
        }, { merge: true });
        alert("¡Perfil actualizado con éxito!");
    } catch (e) {
        alert("Error guardando perfil: " + e.message);
    }
    setIsSavingProfile(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWish.trim()) return;
    const nextOrder = wishes.length; 
    await addDoc(collection(db, "wishes"), {
        text: newWish,
        timestamp: Date.now(),
        order: nextOrder,
        uid: user.uid
    });
    setNewWish("");
  };

  const handleDelete = async (id) => {
    if (confirm("¿Borrar deseo?")) await deleteDoc(doc(db, "wishes", id));
  };

  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;
    const items = Array.from(wishes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    setWishes(items);
    const batch = writeBatch(db);
    items.forEach((item, index) => {
        batch.update(doc(db, "wishes", item.id), { order: index });
    });
    await batch.commit();
  };

  if (!enabled) return null;

  // --- MODAL DE DONACIÓN ---
  const DonationModal = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDonate(false)}>
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center relative animate-fade-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDonate(false)} className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">🎁 Apoyar el proyecto</h3>
            <p className="text-sm text-slate-500 mb-4">Si te gusta la app, puedes invitarme a un café (o a un roscón) para mantener el servidor activo.</p>
            
            <div className="bg-slate-100 p-4 rounded-xl mb-4 inline-block">
                {/* CAMBIO AQUÍ: revo.jpg */}
                <img src="/revo.jpg" alt="QR Revolut" className="w-48 h-48 object-contain mix-blend-multiply" />
            </div>
            
            <a 
                href="https://revolut.me/kylareksas" 
                target="_blank" 
                className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
                Pagar con Revolut &rarr;
            </a>
            <p className="text-xs text-gray-400 mt-3">¡Muchas gracias por tu apoyo!</p>
        </div>
    </div>
  );

  // --- VISTA LOGIN / REGISTRO ---
  if (!user) {
    return (
        <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-6 md:p-8 rounded-2xl shadow-xl border-t-4 border-red-600">
                <h1 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-2">🎁 Carta de Reyes</h1>
                <p className="text-center text-gray-500 mb-6 text-sm md:text-base">Crea tu lista y compártela</p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input name="email" type="email" placeholder="Tu Email" required className="w-full p-3 border rounded text-sm md:text-base"/>
                    <input name="password" type="password" placeholder="Contraseña" required className="w-full p-3 border rounded text-sm md:text-base"/>
                    <button className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700 transition text-sm md:text-base">
                        {isRegistering ? "Crear Cuenta GRATIS" : "Entrar"}
                    </button>
                </form>
                <button onClick={() => setIsRegistering(!isRegistering)} className="w-full mt-4 text-sm text-center text-blue-600 underline">
                    {isRegistering ? "¿Ya tienes cuenta? Entra aquí" : "¿No tienes cuenta? Regístrate"}
                </button>
            </div>
        </main>
    );
  }

  // --- VISTA DASHBOARD ---
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      {showDonate && <DonationModal />}
      
      <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="space-y-6 order-2 md:order-1">
            <div className="bg-white p-5 md:p-6 rounded-xl shadow-md">
                <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">⚙️ Configuración</h2>
                
                {/* Input Título */}
                <div className="mb-5">
                    <label className="block text-sm font-bold text-gray-600 mb-1">Frase de la carta:</label>
                    <input 
                        type="text" 
                        value={customTitle} 
                        onChange={(e) => setCustomTitle(e.target.value)}
                        className="w-full p-2 border rounded focus:ring-2 focus:ring-yellow-400 outline-none"
                    />
                </div>

                {/* Input Imagen URL */}
                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-600 mb-2">Imagen (Enlace / URL):</label>
                    <p className="text-xs text-gray-400 mb-2">
                        Busca una imagen en Google/Pinterest, haz clic derecho &rarr; "Copiar dirección de imagen" y pégala aquí.
                    </p>
                    <input 
                        type="text" 
                        value={customImage} 
                        onChange={(e) => setCustomImage(e.target.value)}
                        className="w-full p-2 border rounded mb-2 focus:ring-2 focus:ring-yellow-400 outline-none"
                        placeholder="https://..."
                    />
                    
                    {customImage && customImage.startsWith('http') && (
                        <div className="mt-2 p-2 border border-dashed rounded bg-gray-50 text-center">
                             <p className="text-xs text-gray-400 mb-1">Vista previa:</p>
                             <img src={customImage} alt="Preview" className="h-20 mx-auto rounded object-contain" />
                        </div>
                    )}
                </div>
                
                <button 
                    onClick={handleSaveProfile} 
                    disabled={isSavingProfile} 
                    className="bg-slate-800 text-white px-4 py-3 rounded-lg hover:bg-slate-900 w-full font-bold transition disabled:opacity-50"
                >
                    {isSavingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            {/* Enlace Público */}
            <div className="bg-green-50 p-5 md:p-6 rounded-xl border border-green-200">
                <h2 className="text-lg font-bold text-green-800 mb-2">🌍 Tu Enlace Público</h2>
                <p className="text-sm text-green-700 mb-3">Comparte este enlace:</p>
                <div className="bg-white p-3 rounded border border-green-200 text-xs md:text-sm break-all font-mono select-all mb-3 overflow-hidden">
                    {typeof window !== 'undefined' ? `${window.location.origin}/u/${user.uid}` : 'Cargando...'}
                </div>
                <a href={`/u/${user.uid}`} target="_blank" className="block text-center bg-green-600 text-white py-2 rounded font-bold hover:bg-green-700 transition">
                    Abrir mi carta &rarr;
                </a>
            </div>

            {/* BOTÓN DONACIÓN Y LOGOUT */}
            <div className="text-center space-y-4 pt-4">
                 <button 
                    onClick={() => setShowDonate(true)} 
                    className="text-sm font-bold text-slate-500 hover:text-blue-600 transition flex items-center justify-center gap-2 w-full"
                >
                    ☕ Invítame a un café
                </button>

                <button onClick={() => signOut(auth)} className="text-red-500 text-sm underline">
                    Cerrar Sesión
                </button>
            </div>
        </div>

        {/* COLUMNA DERECHA: LISTA */}
        <div className="bg-white p-5 md:p-6 rounded-xl shadow-md border-t-4 border-yellow-400 order-1 md:order-2 h-fit">
            <h2 className="text-lg md:text-xl font-bold mb-4 flex items-center gap-2">📝 Tu Lista de Deseos</h2>
            
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                placeholder="Añadir deseo..."
                className="flex-1 p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-yellow-400 outline-none"
              />
              <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded-lg font-bold hover:bg-yellow-600 text-xl leading-none shadow-sm transition active:scale-95">+</button>
            </form>

            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="wishesList">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3 min-h-[50px]">
                            {wishes.length === 0 && <p className="text-center text-gray-400 italic py-4">Tu lista está vacía</p>}
                            {wishes.map((wish, index) => (
                                <Draggable key={wish.id} draggableId={wish.id} index={index}>
                                    {(provided, snapshot) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className={`flex justify-between items-center bg-slate-50 p-3 md:p-4 rounded-lg border border-slate-200 group transition-all touch-manipulation
                                                ${snapshot.isDragging ? "shadow-lg bg-yellow-50 border-yellow-300 scale-[1.02]" : "hover:border-slate-300"}
                                            `}
                                        >
                                            <div className="flex items-center gap-3 overflow-hidden">
                                                <span className="text-gray-300 text-xl cursor-grab active:cursor-grabbing touch-none">::</span>
                                                <span className="break-words truncate">{wish.text}</span>
                                            </div>
                                            <button onClick={() => handleDelete(wish.id)} className="text-red-400 hover:text-red-600 font-bold p-2 rounded-full hover:bg-red-50 transition">✕</button>
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