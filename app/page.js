"use client";
import Image from "next/image";
import { useState, useEffect } from "react";
import { db, auth } from "./firebase";
import { 
  collection, addDoc, onSnapshot, deleteDoc, doc, orderBy, query, writeBatch 
} from "firebase/firestore";
import { 
  signInWithEmailAndPassword, signOut, onAuthStateChanged 
} from "firebase/auth";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";

export default function Home() {
  const [wishes, setWishes] = useState([]);
  const [user, setUser] = useState(null);
  const [newWish, setNewWish] = useState("");
  const [loading, setLoading] = useState(true);

  // Solución para evitar errores de hidratación con Drag&Drop
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    const animation = requestAnimationFrame(() => setEnabled(true));
    return () => {
      cancelAnimationFrame(animation);
      setEnabled(false);
    };
  }, []);

  // 1. Escuchar cambios (Ordenados por el campo 'order')
  useEffect(() => {
    // CAMBIO: Ahora ordenamos por 'order' ascendente (0, 1, 2...)
    const q = query(collection(db, "wishes"), orderBy("order", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const wishesArr = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setWishes(wishesArr);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // 2. Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
    });
    return () => unsubscribe();
  }, []);

  // --- Funciones ---

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!newWish.trim()) return;
    try {
      // CAMBIO: Asignamos el orden al final de la lista actual
      const nextOrder = wishes.length; 
      await addDoc(collection(db, "wishes"), {
        text: newWish,
        timestamp: Date.now(),
        order: nextOrder 
      });
      setNewWish("");
    } catch (error) {
      console.error("Error añadiendo:", error);
    }
  };

  const handleDelete = async (id) => {
    if (confirm("¿Borrar este deseo?")) {
      await deleteDoc(doc(db, "wishes", id));
    }
  };

  // FUNCIÓN CLAVE: Reordenar al arrastrar
  const handleOnDragEnd = async (result) => {
    if (!result.destination) return;

    // 1. Reordenar visualmente al instante (para que se sienta rápido)
    const items = Array.from(wishes);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    
    setWishes(items); // Actualizar estado local

    // 2. Guardar el nuevo orden en Firebase (Batch update)
    // Esto actualiza todos los documentos con su nueva posición
    try {
        const batch = writeBatch(db);
        items.forEach((item, index) => {
            const docRef = doc(db, "wishes", item.id);
            batch.update(docRef, { order: index });
        });
        await batch.commit();
    } catch (error) {
        console.error("Error guardando el orden:", error);
    }
  };

  const handleLogin = async () => {
    const email = prompt("Email Real:");
    const password = prompt("Contraseña Real:");
    if (email && password) {
        try {
            await signInWithEmailAndPassword(auth, email, password);
        } catch (e) {
            alert("Error: " + e.message);
        }
    }
  };

  if (!enabled) {
    return null; // Esperar a que el navegador esté listo para evitar parpadeos
  }

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-4 md:p-8 font-serif text-slate-800">
      
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-4 bg-red-600"></div>
        
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2 mt-4">👑👑👑</h1>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Carta a los Reyes Magos</h2>
        <p className="text-center text-slate-600 mb-8 italic">"Este año la vida no me da para escribir..."</p>

        {/* LISTA ARRASTRABLE */}
        {loading ? (
           <p className="text-center">Cargando ilusiones...</p>
        ) : (
        <DragDropContext onDragEnd={handleOnDragEnd}>
            <Droppable droppableId="wishesList">
                {(provided) => (
                    <div 
                        className="space-y-4 mb-10"
                        {...provided.droppableProps}
                        ref={provided.innerRef}
                    >
                        {wishes.length === 0 && <p className="text-center text-gray-400">La carta está vacía... ¡Aún!</p>}
                        
                        {wishes.map((wish, index) => (
                            <Draggable 
                                key={wish.id} 
                                draggableId={wish.id} 
                                index={index}
                                isDragDisabled={!user} // ¡IMPORTANTE! Solo el admin puede arrastrar
                            >
                                {(provided, snapshot) => (
                                    <div
                                        ref={provided.innerRef}
                                        {...provided.draggableProps}
                                        {...provided.dragHandleProps}
                                        style={{ ...provided.draggableProps.style }}
                                        className={`flex justify-between items-center bg-slate-100 p-4 rounded-lg border-l-4 border-green-600 shadow-sm transition 
                                            ${snapshot.isDragging ? "bg-green-50 shadow-2xl scale-105" : ""}
                                            ${user ? "cursor-grab active:cursor-grabbing" : ""}
                                        `}
                                    >
                                        <div className="flex items-center gap-3 w-full">
                                            {/* Icono de agarre (solo visible para admin) */}
                                            {user && <span className="text-gray-400 text-xl">::</span>}
                                            <span className="text-lg font-medium break-words w-full">{wish.text}</span>
                                        </div>

                                        {user && (
                                            <button onClick={() => handleDelete(wish.id)} className="ml-4 text-red-500 font-bold px-2">X</button>
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
        )}

        {/* Panel Admin */}
        {user ? (
          <div className="mt-6 pt-6 border-t-2 border-dashed border-gray-300">
            <h3 className="text-sm font-bold text-gray-500 mb-2 uppercase tracking-wider">Zona Privada</h3>
            <form onSubmit={handleAdd} className="flex gap-2 flex-col sm:flex-row">
              <input
                type="text"
                value={newWish}
                onChange={(e) => setNewWish(e.target.value)}
                placeholder="Añadir nuevo regalo..."
                className="flex-1 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-green-500"
              />
              <button type="submit" className="bg-green-600 text-white px-6 py-2 rounded font-bold hover:bg-green-700">Añadir</button>
            </form>
            <button onClick={() => signOut(auth)} className="mt-4 text-xs text-gray-400 hover:text-gray-600 underline">Cerrar sesión</button>
          </div>
        ) : (
          <div className="mt-8 text-center">
              <button onClick={handleLogin} className="text-3xl text-gray-300 hover:text-yellow-500 transition-colors p-2" title="Zona de sus majestades">♔</button>
          </div>
        )}

        <div className="mt-8 mb-2">
            <Image src="/guts.png" alt="Guts esperando la navidad" width={800} height={400} className="w-full h-auto rounded-xl shadow-sm border-2 border-amber-500/30" priority />
        </div>
      </div>
      <footer className="mt-8 text-amber-800/60 text-sm">Creado con ilusión en Next.js</footer>
    </main>
  );
}