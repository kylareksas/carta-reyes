"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation"; 
import { db } from "../../firebase"; 
import { collection, query, where, orderBy, getDocs, doc, getDoc } from "firebase/firestore";

export default function PublicPage() {
  const params = useParams(); 
  const [profile, setProfile] = useState(null);
  const [wishes, setWishes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showDonate, setShowDonate] = useState(false); // Estado para el modal

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userId = params?.id;
        if (!userId) { setError("Enlace incompleto."); return; }

        // 1. Buscar Perfil
        const userRef = doc(db, "users", userId);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
            const userData = userSnap.data();
            setProfile(userData);

            // Título dinámico
            if (userData.title) {
                document.title = `${userData.title.substring(0, 50)} 👑`;
            } else {
                document.title = "Carta a los Reyes Magos 👑";
            }

        } else { 
            setError("Esta carta no existe."); 
            setLoading(false); 
            return; 
        }

        // 2. Buscar Regalos
        const q = query(collection(db, "wishes"), where("uid", "==", userId), orderBy("order", "asc"));
        const querySnapshot = await getDocs(q);
        setWishes(querySnapshot.docs.map(doc => doc.data()));
        
      } catch (e) {
        console.error(e);
        setError("Hubo un problema cargando la carta.");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [params]);

  // --- MODAL DE DONACIÓN ---
  const DonationModal = () => (
    <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={() => setShowDonate(false)}>
        <div className="bg-white p-6 rounded-2xl max-w-sm w-full text-center relative animate-fade-in" onClick={e => e.stopPropagation()}>
            <button onClick={() => setShowDonate(false)} className="absolute top-2 right-4 text-2xl text-gray-400 hover:text-gray-600">&times;</button>
            <h3 className="text-xl font-bold text-slate-800 mb-2">🎁 Apoyar el proyecto</h3>
            <p className="text-sm text-slate-500 mb-4">Esta plataforma es gratuita. Si te gusta, puedes invitar al desarrollador a un café.</p>
            
            <div className="bg-slate-100 p-4 rounded-xl mb-4 inline-block">
                <img src="/revo.jpg" alt="QR Revolut" className="w-48 h-48 object-contain mix-blend-multiply" />
            </div>
            
            <a 
                href="https://revolut.me/kylareksas" 
                target="_blank" 
                className="block w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition"
            >
                Pagar con Revolut &rarr;
            </a>
            <p className="text-xs text-gray-400 mt-3">¡Muchas gracias!</p>
        </div>
    </div>
  );

  // --- PANTALLAS DE CARGA / ERROR ---
  if (loading) return (
      <div className="min-h-screen bg-amber-50 flex items-center justify-center p-4">
          <div className="text-center animate-pulse">
              <div className="text-5xl md:text-6xl mb-4">👑</div>
              <p className="text-amber-800 font-serif text-lg md:text-xl">Buscando la carta real...</p>
          </div>
      </div>
  );
  
  if (error) return (
      <div className="min-h-screen bg-amber-50 flex flex-col items-center justify-center p-6 text-center">
          <div className="text-5xl md:text-6xl mb-4">😢</div>
          <h1 className="text-xl md:text-2xl font-bold text-red-600 mb-2">Vaya...</h1>
          <p className="text-slate-600 mb-6 text-sm md:text-base">{error}</p>
          <a href="/" className="px-6 py-3 bg-red-600 text-white rounded-full font-bold hover:bg-red-700 transition text-sm">
              Crear mi propia carta
          </a>
      </div>
  );

  // --- CARTA FINAL ---
  return (
    <main className="min-h-screen bg-amber-50 flex flex-col items-center p-3 md:p-8 font-serif text-slate-800">
      {showDonate && <DonationModal />}

      <div className="max-w-2xl w-full bg-white p-4 md:p-8 rounded-2xl shadow-xl border-4 border-yellow-500 relative overflow-hidden my-4 md:my-0">
        
        <div className="absolute top-0 left-0 w-full h-3 md:h-4 bg-red-600"></div>
        
        <h1 className="text-3xl md:text-4xl font-bold text-center text-red-700 mb-2 mt-4">👑👑👑</h1>
        <h2 className="text-2xl md:text-3xl font-bold text-center text-slate-800 mb-4 md:mb-6">Carta a los Reyes Magos</h2>
        
        <p className="text-center text-slate-600 mb-6 md:mb-8 italic text-base md:text-lg break-words px-2">
            "{profile.title}"
        </p>

        <div className="space-y-3 md:space-y-4 mb-8 md:mb-10">
            {wishes.length === 0 ? (
                <p className="text-center text-gray-400 italic">Esta lista está vacía... ¡Aún!</p>
            ) : (
                wishes.map((wish, index) => (
                    <div key={index} className="flex items-center bg-slate-100 p-3 md:p-4 rounded-lg border-l-4 border-green-600 shadow-sm">
                        <span className="text-base md:text-lg font-medium break-words">{wish.text}</span>
                    </div>
                ))
            )}
        </div>

        <div className="mt-6 md:mt-8 mb-2">
            <img 
                src={profile.image} 
                onError={(e) => { e.target.onerror = null; e.target.src = "/guts.png" }}
                className="w-full h-auto rounded-xl shadow-sm border-2 border-amber-500/30 object-cover max-h-[300px] md:max-h-[500px]" 
            />
        </div>

      </div>
      
      <footer className="mt-8 text-amber-800/60 text-xs md:text-sm text-center pb-8 space-y-4">
        <p>
            ¿Quieres crear tu propia carta? <br/>
            <a href="/" className="font-bold underline hover:text-red-600">Hazlo gratis en reyes.kylareksas.com</a>
        </p>
        
        {/* BOTÓN DONACIÓN EN PÚBLICO (NUEVO ESTILO) */}
        <button 
            onClick={() => setShowDonate(true)}
            className="bg-amber-100 border border-amber-300 text-amber-900 px-5 py-2 rounded-full font-bold hover:bg-amber-200 transition text-sm flex items-center justify-center gap-2 mx-auto shadow-sm"
        >
            ☕ Apoyar al creador
        </button>
      </footer>
    </main>
  );
}