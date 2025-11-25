"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; // <--- USAMOS ESTO AHORA
import { db } from "../../firebase"; 
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

export default function PublicPage() {
  const params = useParams(); // Método moderno para leer la URL
  const [status, setStatus] = useState("Iniciando...");
  const [debugInfo, setDebugInfo] = useState({});
  
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);

  useEffect(() => {
    const run = async () => {
      // 1. Verificamos ID
      const userId = params?.id;
      setDebugInfo(prev => ({ ...prev, userIdRecibido: userId || "NINGUNO" }));
      
      if (!userId) {
        setStatus("ERROR: No se ha detectado ID en la URL.");
        return;
      }

      // 2. Verificamos Firebase
      if (!db) {
        setStatus("ERROR CRÍTICO: No se ha podido conectar con Firebase. Revisa la ruta del archivo import { db }.");
        return;
      }

      try {
        setStatus(`Buscando usuario en base de datos... (ID: ${userId})`);
        
        // 3. Buscar Perfil
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          setDebugInfo(prev => ({ ...prev, perfilEncontrado: "SÍ", datosPerfil: userSnap.data() }));
          setProfile(userSnap.data());
        } else {
          setStatus("ERROR: El usuario existe en la URL pero NO en la base de datos 'users'.");
          setDebugInfo(prev => ({ ...prev, perfilEncontrado: "NO" }));
          return;
        }

        setStatus("Perfil cargado. Buscando regalos...");

        // 4. Buscar Regalos
        const q = query(
            collection(db, "wishes"), 
            where("uid", "==", userId),
            orderBy("order", "asc")
        );
        
        const querySnapshot = await getDocs(q);
        const loadedWishes = querySnapshot.docs.map(doc => doc.data());
        
        setDebugInfo(prev => ({ ...prev, regalosEncontrados: loadedWishes.length }));
        setWishes(loadedWishes);
        setStatus("OK"); // Todo ha ido bien

      } catch (e) {
        console.error(e);
        setStatus("ERROR TÉCNICO: " + e.message);
        setDebugInfo(prev => ({ ...prev, errorDetalle: JSON.stringify(e) }));
      }
    };

    run();
  }, [params]);

  // --- PANTALLA DE DIAGNÓSTICO (SI ALGO VA MAL O CARGANDO) ---
  if (status !== "OK") {
    return (
      <div className="min-h-screen bg-black text-green-400 p-10 font-mono text-sm">
        <h1 className="text-xl font-bold text-white mb-4">🖥️ MODO DIAGNÓSTICO</h1>
        
        <div className="mb-4 p-4 border border-green-800 bg-gray-900">
          <p className="font-bold text-yellow-400">ESTADO ACTUAL:</p>
          <p className="text-lg">{status}</p>
        </div>

        <div className="p-4 border border-gray-700">
          <p className="font-bold text-white mb-2">DATOS TÉCNICOS:</p>
          <pre>{JSON.stringify(debugInfo, null, 2)}</pre>
        </div>

        <p className="mt-8 text-gray-500">
          Si ves esto, haz una captura y pásamela.
        </p>
      </div>
    );
  }

  // --- SI TODO VA BIEN (STATUS "OK"), MOSTRAMOS LA WEB NORMAL ---
  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-4 md:p-8 font-serif text-slate-800">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-4 bg-red-600"></div>
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2 mt-4">👑👑👑</h1>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Carta a los Reyes Magos</h2>
        <p className="text-center text-slate-600 mb-8 italic text-lg">"{profile.title}"</p>

        <div className="space-y-4 mb-10">
            {wishes.length === 0 ? (
                <p className="text-center text-gray-400">Aún no hay deseos.</p>
            ) : (
                wishes.map((wish, index) => (
                    <div key={index} className="flex items-center bg-slate-100 p-4 rounded-lg border-l-4 border-green-600 shadow-sm">
                        <span className="text-lg font-medium">{wish.text}</span>
                    </div>
                ))
            )}
        </div>

        <div className="mt-8 mb-2">
            <img 
                src={profile.image} 
                onError={(e) => { e.target.onerror = null; e.target.src = "/guts.png" }}
                className="w-full h-auto rounded-xl shadow-sm border-2 border-amber-500/30 object-cover max-h-[500px]" 
            />
        </div>
      </div>
      <footer className="mt-8 text-amber-800/60 text-sm text-center">
        ¿Quieres crear tu propia carta? <br/>
        <a href="/" className="font-bold underline hover:text-red-600">Hazlo gratis en reyes.kylareksas.com</a>
      </footer>
    </main>
  );
}