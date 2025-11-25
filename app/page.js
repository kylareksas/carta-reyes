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

  // Estados para configuración del perfil
  const [customTitle, setCustomTitle] = useState("Este año he intentado ser muy bueno...");
  const [customImage, setCustomImage] = useState("/guts.png");
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Evitar problemas de hidratación con Drag&Drop
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => cancelAnimationFrame(animation);
  }, []);

  // 1. Detectar Usuario y Cargar sus Preferencias
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Cargar perfil del usuario (mensaje y foto) de la base de datos
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

  // 2. Cargar Deseos del Usuario
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    const q = query(
        collection(db, "wishes"), 
        where("uid", "==", user.uid), // Solo mis deseos
        orderBy("order", "asc")
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishesArr = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
      setWishes(wishesArr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [user]);

  // --- Funciones de Lógica ---

  const handleAuth = async (e) => {
    e.preventDefault();
    const email = e.target.email.value;
    const password = e.target.password.value;
    try {
        if (isRegistering) {
            // 1. Crear usuario en Auth
            const userCred = await createUserWithEmailAndPassword(auth, email, password);
            // 2. Crear documento de perfil en Firestore AUTOMÁTICAMENTE
            await setDoc(doc(db, "users", userCred.user.uid), {
                title: "¡Hola Reyes Magos! Esta es mi lista",
                image: "/guts.png", // Imagen por defecto
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
        // Guardar/Actualizar configuración
        await setDoc(doc(db, "users", user.uid), {
            title: customTitle,
            image: customImage,
            email: user.email // Guardamos email por si acaso
        }, { merge: true });
        alert("¡Perfil actualizado con éxito!");
    } catch (e) {
        console.error(e);
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
        uid: user.uid // Guardamos el UID del usuario
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

  // --- VISTA DE LOGIN / REGISTRO ---
  if (!user) {
    return (
        <main className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
            <div className="max-w-md w-full bg-white p-8 rounded-2xl shadow-xl border-t-4 border-red-600">
                <h1 className="text-3xl font-bold text-center text-slate-800 mb-2">🎁 Carta de Reyes</h1>
                <p className="text-center text-gray-500 mb-6">Crea tu lista y compártela</p>
                <form onSubmit={handleAuth} className="space-y-4">
                    <input name="email" type="email" placeholder="Tu Email" required className="w-full p-3 border rounded"/>
                    <input name="password" type="password" placeholder="Contraseña" required className="w-full p-3 border rounded"/>
                    <button className="w-full bg-red-600 text-white p-3 rounded font-bold hover:bg-red-700">
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

  // --- VISTA DEL DASHBOARD (LOGUEADO) ---
  return (
    <main className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans text-slate-800">
      <div className="max-w-4xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-8">
        
        {/* COLUMNA IZQUIERDA: CONFIGURACIÓN */}
        <div className="space-y-6">
            <div className="bg-white p-6 rounded-xl shadow-md">
                <h2 className="text-xl font-bold mb-4">⚙️ Tu Configuración</h2>
                
                <label className="block text-sm font-bold text-gray-600 mb-1">Frase de la carta:</label>
                <input 
                    type="text" 
                    value={customTitle} 
                    onChange={(e) => setCustomTitle(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                />

                <label className="block text-sm font-bold text-gray-600 mb-1">Imagen (URL):</label>
                <p className="text-xs text-gray-400 mb-1">Sube tu foto o pega una URL de internet.</p>
                <input 
                    type="text" 
                    value={customImage} 
                    onChange={(e) => setCustomImage(e.target.value)}
                    className="w-full p-2 border rounded mb-4"
                    placeholder="https://..."
                />
                
                <button onClick={handleSaveProfile} disabled={isSavingProfile} className="bg-slate-800 text-white px-4 py-2 rounded hover:bg-slate-900 w-full">
                    {isSavingProfile ? "Guardando..." : "Guardar Cambios"}
                </button>
            </div>

            <div className="bg-green-100 p-6 rounded-xl border border-green-300">
                <h2 className="text-lg font-bold text-green-800 mb-2">🌍 Tu enlace público</h2>
                <p className="text-sm text-green-700 mb-3">Comparte este enlace:</p>
                <div className="bg-white p-3 rounded border border-green-200 text-sm break-all font-mono select-all mb-2">
                    {typeof window !== 'undefined' ? `${window.location.origin}/u/${user.uid}` : 'Cargando...'}
                </div>
                <a href={`/u/${user.uid}`} target="_blank" className="block text-center text-green-700 font-bold underline">
                    Probar a abrir mi carta &rarr;
                </a>
            </div>

            <button onClick={() => signOut(auth)} className="text-red-500 text-sm underline">Cerrar Sesión</button>
        </div>

        {/* COLUMNA DERECHA: EDICIÓN DE LISTA */}
        <div className="bg-white p-6 rounded-xl shadow-md border-t-4 border-yellow-400">
            <h2 className="text-xl font-bold mb-4">📝 Tu Lista de Deseos</h2>
            
            <form onSubmit={handleAdd} className="flex gap-2 mb-6">
              <input
                type="text"
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                placeholder="Añadir deseo..."
                className="flex-1 p-2 border border-gray-300 rounded"
              />
              <button type="submit" className="bg-yellow-500 text-white px-4 py-2 rounded font-bold hover:bg-yellow-600">+</button>
            </form>

            <DragDropContext onDragEnd={handleOnDragEnd}>
                <Droppable droppableId="wishesList">
                    {(provided) => (
                        <div {...provided.droppableProps} ref={provided.innerRef} className="space-y-3">
                            {wishes.map((wish, index) => (
                                <Draggable key={wish.id} draggableId={wish.id} index={index}>
                                    {(provided) => (
                                        <div
                                            ref={provided.innerRef}
                                            {...provided.draggableProps}
                                            {...provided.dragHandleProps}
                                            className="flex justify-between items-center bg-slate-50 p-3 rounded border border-slate-200"
                                        >
                                            <div className="flex items-center gap-2">
                                                <span className="text-gray-400 cursor-grab">::</span>
                                                <span className="break-all">{wish.text}</span>
                                            </div>
                                            <button onClick={() => handleDelete(wish.id)} className="text-red-500 font-bold px-2">x</button>
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