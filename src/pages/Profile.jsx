import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Loader2, MessageCircle, Trophy, ShoppingCart, MapPin, Layers } from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coleccionista");
  const [userPhoto, setUserPhoto] = useState(null);

  // URL de fondo y TU LOGO como imagen principal de perfil
  const backgroundUrl = "https://i.postimg.cc/wv0006cf/pokemon-tcg-pocket-trading-has-spurred-a-strange-black-marke-punu.jpg";
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const q = query(collection(db, "userCollections"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const fetchedCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCards(fetchedCards);
        
        if (fetchedCards.length > 0) {
          const data = fetchedCards[0];
          setUserName(data.userName || "Coleccionista");
          // Si el usuario tiene foto de Google la usa, si no, usa TU LOGO VIKINGO por defecto
          setUserPhoto(data.userPhoto || miLogoVikingo);
        } else {
          // Si no hay cartas aún, mostrar logo vikingo por defecto
          setUserPhoto(miLogoVikingo);
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
        setUserPhoto(miLogoVikingo);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handleWhatsApp = (cardName, cardPrice) => {
    const telefono = "56900000000"; 
    const mensaje = `¡Hola ${userName}! He visto tu perfil en NexusHub y me interesa la carta: ${cardName} ($${Number(cardPrice).toLocaleString('es-CL')} CLP). ¿Aún la tienes?`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-yellow-400 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Abriendo Vault...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-32 selection:bg-yellow-400 selection:text-black relative overflow-x-hidden">
      
      {/* FONDO TCG */}
      <div 
        className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 transition-opacity duration-1000"
        style={{ backgroundImage: `url(${backgroundUrl})` }}
      />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/80 to-[#020617] pointer-events-none" />

      {/* HEADER AJUSTADO PARA NOTEBOOKS (pt-32 para que no se corte arriba) */}
      <header className="relative min-h-[500px] w-full flex items-center justify-center z-10 pt-32 pb-12 md:pt-40">
        <div className="text-center space-y-6 px-4 w-full max-w-4xl">
          
          {/* LOGO DE PERFIL (Vikingo o Google) */}
        

          <div className="space-y-4">
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-[0.85] break-words">
              {userName} <span className="text-yellow-400 block sm:inline text-glow">POKECOLE</span>
            </h1>
            <div className="flex flex-wrap items-center justify-center gap-2">
               <span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-yellow-400 flex items-center gap-2">
                <Trophy size={12} /> Vendedor Verificado
               </span>
               <span className="bg-black/60 backdrop-blur-md border border-white/10 px-3 py-1.5 rounded-full text-[8px] md:text-[10px] font-black uppercase tracking-[0.2em] text-white">
                {cards.length} Artículos
               </span>
            </div>
          </div>

          <button 
            onClick={() => handleWhatsApp("tu perfil", "varios")}
            className="group relative bg-green-600 hover:bg-green-500 text-white px-8 py-4 rounded-2xl transition-all shadow-xl flex items-center gap-3 mx-auto active:scale-95 text-xs md:text-sm font-black uppercase tracking-widest"
          >
            <MessageCircle size={20} className="group-hover:rotate-12 transition-transform" />
            Contactar Vendedor
          </button>
        </div>
      </header>

      {/* GALERÍA */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8 relative z-10">
        <div className="flex items-center gap-4 mb-8 md:mb-12">
          <div className="h-[2px] w-12 bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
          <h2 className="text-base md:text-lg font-black uppercase tracking-[0.3em] italic text-slate-200">Inventario Real</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6 md:gap-8">
          {cards.map((card) => (
            <div key={card.id} className="group flex flex-col h-full bg-black/40 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.2rem] border border-white/10 hover:border-yellow-500/50 transition-all duration-500 p-1.5 md:p-2 shadow-2xl">
              
              <div className="relative aspect-[2/3] rounded-[1.2rem] md:rounded-[1.6rem] overflow-hidden bg-slate-950 mb-3 md:mb-4">
                <div className="absolute inset-0 z-20 pointer-events-none holo-effect opacity-40" />
                <img src={card.image} alt={card.name} className="w-full h-full object-contain relative z-10 p-1" />

                <div className="absolute top-2 left-2 z-30">
                  <span className="bg-yellow-500 text-black text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                    {card.status}
                  </span>
                </div>
              </div>

              {/* INFO VENTA */}
              <div className="px-1.5 md:px-3 pb-3 md:pb-4 space-y-3 flex-1 flex flex-col justify-between">
                <div>
                  <h3 className="text-[8px] md:text-[10px] font-black uppercase truncate text-slate-400 mb-1 tracking-wider">{card.name}</h3>
                  
                  <div className="text-xl sm:text-2xl md:text-3xl font-black italic tracking-tighter text-yellow-400">
                    ${Number(card.price).toLocaleString('es-CL')}
                  </div>

                  {/* CANTIDAD: X Disponibles */}
                  {card.quantity > 0 && (
                    <div className="flex items-center gap-1 mt-1">
                      <Layers size={10} className="text-slate-500" />
                      <span className="text-[9px] md:text-[10px] font-bold text-slate-300 uppercase tracking-tighter">
                        {card.quantity} {card.quantity === 1 ? 'Disponible' : 'Disponibles'}
                      </span>
                    </div>
                  )}

                  <div className="text-[7px] md:text-[8px] text-slate-500 font-bold uppercase mt-1">Moneda: CLP</div>

                  {card.delivery && (
                    <div className="flex items-center gap-1.5 text-[7px] md:text-[9px] text-slate-300 font-bold uppercase mt-2">
                      <MapPin size={10} className="text-yellow-500 shrink-0" /> 
                      <span className="truncate">{card.delivery}</span>
                    </div>
                  )}
                </div>

                <button 
                  onClick={() => handleWhatsApp(card.name, card.price)}
                  className="w-full bg-white text-black hover:bg-yellow-500 py-3 rounded-xl md:rounded-2xl text-[9px] md:text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-xl"
                >
                  <ShoppingCart size={14} /> 
                  <span>Consultar</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, button { font-family: 'Archivo Black', sans-serif; }
        .text-glow { text-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
        .holo-effect {
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0) 30%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 70%, transparent 75%);
          background-size: 200% 100%;
          mix-blend-mode: overlay;
          animation: automaticHolo 4s infinite linear;
        }
        @keyframes automaticHolo {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        body { background-color: #020617; overflow-x: hidden; }
      `}</style>
    </div>
  );
}