"use client";
import { useState, useEffect } from "react";
import { db } from "../../firebase"; // Asegúrate de que esta ruta sube 2 niveles
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

export default function PublicPage({ params }) {
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = params.id; 

        // 1. Cargar el Perfil (User)
        // Intentamos leer el documento en 'users'. Si falla por permisos, saltará al catch.
        const userDoc = await getDoc(doc(db, "users", userId));
        
        if (userDoc.exists()) {
            setProfile(userDoc.data());
        } else {
            setErrorMsg("No hemos encontrado el perfil de este usuario.");
            setLoading(false);
            return; // Paramos aquí si no hay usuario
        }

        // 2. Cargar los Deseos (Wishes)
        const q = query(
            collection(db, "wishes"), 
            where("uid", "==", userId),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        setWishes(snapshot.docs.map(d => d.data()));
        
      } catch (error) {
        console.error(error);
        setErrorMsg("Error cargando la carta. " + error.message);
      } finally {
        setLoading(false);
      }
    };

    if(params.id) fetchData();
  }, [params.id]);

  if (loading) return <div className="text-center p-10">Cargando la carta real... 👑</div>;
  
  if (errorMsg || !profile) return (
      <div className="text-center p-10 bg-amber-50 h-screen flex flex-col items-center justify-center">
          <h1 className="text-2xl font-bold text-red-600 mb-2">¡Vaya! 😢</h1>
          <p>{errorMsg}</p>
          <a href="/" className="mt-4 underline text-blue-600">Volver al inicio</a>
      </div>
  );

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-4 md:p-8 font-serif text-slate-800">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-4 bg-red-600"></div>
        
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2 mt-4">👑👑👑</h1>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Carta a los Reyes Magos</h2>
        
        {/* MENSAJE PERSONALIZADO */}
        <p className="text-center text-slate-600 mb-8 italic text-lg">
            "{profile.title}"
        </p>

        {/* LISTA DE REGALOS */}
        <div className="space-y-4 mb-10">
            {wishes.length === 0 ? (
                <p className="text-center text-gray-400">Aún no hay deseos en esta lista.</p>
            ) : (
                wishes.map((wish, index) => (
                    <div key={index} className="flex items-center bg-slate-100 p-4 rounded-lg border-l-4 border-green-600 shadow-sm">
                        <span className="text-lg font-medium">{wish.text}</span>
                    </div>
                ))
            )}
        </div>

        {/* IMAGEN PERSONALIZADA */}
        <div className="mt-8 mb-2">
            <img 
                src={profile.image} 
                alt="Navidad" 
                // Usamos onError para cargar una imagen de seguridad si la URL del usuario falla
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