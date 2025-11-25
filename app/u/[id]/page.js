"use client";
import { useState, useEffect } from "react";
import { db } from "../../firebase"; // Asegúrate de que la ruta a firebase es correcta (sube 2 niveles)
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

// Esta es la página pública que verán los visitantes
export default function PublicPage({ params }) {
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = params.id; // Obtenemos el ID de la URL

        // 1. Cargar el Perfil del Usuario (Imagen y Texto)
        const userDoc = await getDoc(doc(db, "users", userId));
        if (userDoc.exists()) {
            setProfile(userDoc.data());
        }

        // 2. Cargar sus deseos
        const q = query(
            collection(db, "wishes"), 
            where("uid", "==", userId),
            orderBy("order", "asc")
        );
        const snapshot = await getDocs(q);
        setWishes(snapshot.docs.map(d => d.data()));
        
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params.id]);

  if (loading) return <div className="text-center p-10">Cargando la carta real... 👑</div>;
  if (!profile) return <div className="text-center p-10">Esta carta no existe 😢</div>;

  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-4 md:p-8 font-serif text-slate-800">
      <div className="max-w-2xl w-full bg-white p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden">
        
        <div className="absolute top-0 left-0 w-full h-4 bg-red-600"></div>
        
        <h1 className="text-4xl font-bold text-center text-red-700 mb-2 mt-4">👑👑👑</h1>
        <h2 className="text-3xl font-bold text-center text-slate-800 mb-6">Carta a los Reyes Magos</h2>
        
        {/* MENSAJE PERSONALIZADO DEL USUARIO */}
        <p className="text-center text-slate-600 mb-8 italic text-lg">
            "{profile.title}"
        </p>

        {/* LISTA (SOLO LECTURA) */}
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

        {/* IMAGEN PERSONALIZADA DEL USUARIO */}
        <div className="mt-8 mb-2">
            {/* Usamos img normal en vez de Image de Next para permitir URLs externas sin configurar dominios */}
            <img 
                src={profile.image} 
                alt="Navidad" 
                className="w-full h-auto rounded-xl shadow-sm border-2 border-amber-500/30 object-cover max-h-[400px]" 
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