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
  const [showDonate, setShowDonate] = useState(false);
  const [copied, setCopied] = useState(false);
  // NUEVO ESTADO: Para controlar el modal de la imagen a pantalla completa
  const [showImageModal, setShowImageModal] = useState(false);

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

  // --- FUNCIÓN PARA COPIAR ENLACE ---
  const handleShare = () => {
    if (typeof window !== 'undefined') {
        navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000); 
    }
  };

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

      {/* NUEVO: MODAL DE IMAGEN A PANTALLA COMPLETA */}
      {showImageModal && (
        <div 
            className="fixed inset-0 bg-black/95 z-[100] flex items-center justify-center p-4 cursor-zoom-out animate-fade-in"
            onClick={() => setShowImageModal(false)}
        >
            {/* Botón cerrar explícito (opcional, ya que el fondo cierra) */}
            <button className="absolute top-4 right-4 text-white/70 hover:text-white text-4xl leading-none">&times;</button>
            
            <img 
                src={profile.image} 
                onError={(e) => { e.target.onerror = null; e.target.src = "/guts.png" }}
                className="w-auto h-auto max-w-full max-h-[90vh] object-contain rounded-lg shadow-2xl"
                alt="Imagen a pantalla completa"
            />
        </div>
      )}

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
                    <div key={index} className="flex flex-col sm:flex-row justify-between items-center bg-slate-100 p-3 md:p-4 rounded-lg border-l-4 border-green-600 shadow-sm gap-3">
                        <span className="text-base md:text-lg font-medium break-words w-full text-left">{wish.text}</span>
                        
                        <div className="flex gap-2 shrink-0">
                            {/* Botón Google */}
                            <a 
                                href={`https://www.google.com/search?q=${encodeURIComponent(wish.text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-gray-200 hover:border-blue-400 hover:bg-blue-50 text-gray-700 p-2 rounded-lg transition shadow-sm"
                                title="Buscar en Google"
                            >
                                <svg viewBox="0 0 24 24" width="20" height="20" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/>
                                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
                                </svg>
                            </a>

                            {/* Botón Amazon */}
                            <a 
                                href={`https://www.amazon.es/s?k=${encodeURIComponent(wish.text)}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="bg-white border border-gray-200 hover:border-yellow-500 hover:bg-yellow-50 text-gray-700 p-2 rounded-lg transition shadow-sm"
                                title="Buscar en Amazon"
                            >
<svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" xmlns="http://www.w3.org/2000/svg">
    <path d="M13.6 23.6c-3.3-2.4-6.6-3.3-9.6-2.6-1.1.3-2.1.9-2.8 1.7-.2.3-.6.3-.8.1-.2-.2-.3-.6-.1-.8 1.5-1.8 3.5-2.6 5.9-2.3 2.9.3 6 1.5 9.2 3.6.3.2.4.7.2 1-.2.3-.7.4-1 .2zm2.1-6.7c-1.5 1.9-3.7 3.3-6.2 3.8-.6.1-1.1.2-1.6.2-3.6 0-6.7-2.3-6.7-6.3 0-4.7 4-8.6 9-8.6 2.6 0 4.7 1 5.8 2.7.2-1.4.4-2.7.4-4.1 0-1.4-.2-2.9-.8-4.3-.4-.8-1.4-1.2-2.3-1.1-1.7.2-3.2.9-4.5 2-.3.3-.9.2-1.1-.1-.2-.3-.2-.9.1-1.1 1.7-1.4 3.6-2.2 5.7-2.5 1.6-.2 3.2.5 3.9 1.9.7 1.7.9 3.4.9 5.4 0 1.4-.2 3-.5 4.5 1 .5 2.1.8 3.2.8.9-.1 1.8-.4 2.5-.9.3-.3.8-.2 1 .1.2.3.2.8-.1 1-1 .8-2.2 1.3-3.5 1.5-1.2.1-2.5-.2-3.7-.8-.4.9-1.1 1.8-1.8 2.4zm-2.8-8.3c-.8-1.2-2.2-1.9-3.7-1.9-3.1 0-5.7 2.5-5.7 5.5 0 2.5 1.8 3.8 4.1 3.8 2.1 0 4.2-1.2 5.4-3v-4.4z"/>
</svg>
                            </a>
                        </div>
                    </div>
                ))
            )}
        </div>

        <div className="mt-6 md:mt-8 mb-2">
            {/* IMAGEN PRINCIPAL CON CLICK PARA AMPLIAR */}
            <img 
                src={profile.image} 
                onError={(e) => { e.target.onerror = null; e.target.src = "/guts.png" }}
                /* Añadido cursor-zoom-in, hover, y onClick */
                className="w-full h-auto rounded-xl shadow-sm border-2 border-amber-500/30 object-cover max-h-[300px] md:max-h-[500px] cursor-zoom-in hover:opacity-95 transition"
                onClick={() => setShowImageModal(true)}
            />
            {/* NUEVA LEYENDA/TIP */}
            <p className="text-center text-xs text-amber-800/40 mt-2 italic px-4">
                Tip: Para evitar recortes, usa imágenes horizontales (ej: 4:3) de al menos 1024px de ancho. Haz clic para ampliar.
            </p>
        </div>

      </div>
      
      <footer className="mt-6 text-amber-800/60 text-xs md:text-sm text-center pb-8 flex flex-col gap-3">
        
        {/* BOTÓN COPIAR ENLACE */}
        <button 
            onClick={handleShare}
            className={`
                px-5 py-2 rounded-full font-bold transition text-sm flex items-center justify-center gap-2 mx-auto shadow-sm border
                ${copied 
                    ? "bg-green-100 border-green-300 text-green-800" 
                    : "bg-white border-gray-300 text-gray-600 hover:bg-gray-50 hover:border-gray-400"
                }
            `}
        >
            {copied ? (
                <>✅ ¡Enlace Copiado!</>
            ) : (
                <>🔗 Copiar enlace de la carta</>
            )}
        </button>

        {/* BOTÓN DONACIÓN */}
        <button 
            onClick={() => setShowDonate(true)}
            className="bg-amber-100 border border-amber-300 text-amber-900 px-5 py-2 rounded-full font-bold hover:bg-amber-200 transition text-sm flex items-center justify-center gap-2 mx-auto shadow-sm"
        >
            ☕ Apoyar al creador
        </button>

        <p className="pt-4">
            ¿Quieres crear tu propia carta? <br/>
            <a href="/" className="font-bold underline hover:text-red-600">Hazlo gratis en reyes.kylareksas.com</a>
        </p>
      </footer>
    </main>
  );
}