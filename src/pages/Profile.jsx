import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Loader2, Instagram, MessageCircle, Sparkles, Trophy, ShoppingCart, MapPin, Languages } from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const [cards, setCards] = useState([]);
  const [featuredCards, setFeaturedCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coleccionista");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const q = query(collection(db, "userCollections"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const fetchedCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        // Ordenar por precio para sacar las destacadas (top 3)
        const sorted = [...fetchedCards].sort((a, b) => Number(b.price) - Number(a.price));
        
        setCards(fetchedCards);
        setFeaturedCards(sorted.slice(0, 3));
        
        if (fetchedCards.length > 0) {
          setUserName(fetchedCards[0].userName || "Coleccionista");
        }
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid]);

  const handleWhatsApp = (cardName, cardPrice) => {
    const telefono = "56900000000"; // CAMBIA ESTO POR TU NÚMERO DE CHILE (569...)
    const mensaje = `¡Hola ${userName}! He visto tu perfil en NexusHub y me interesa la carta: ${cardName} ($${Number(cardPrice).toLocaleString('es-CL')} CLP). ¿Aún la tienes?`;
    window.open(`https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex flex-col items-center justify-center text-white">
        <Loader2 className="animate-spin text-yellow-400 mb-4" size={40} />
        <p className="text-[10px] font-black uppercase tracking-[0.5em]">Sincronizando Álbum...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-32">
      
      {/* HEADER DE PERFIL */}
      <header className="relative h-[450px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-[#020617]/80 to-[#020617] z-0" />
        <div className="relative z-10 text-center space-y-6 px-4">
          <div className="inline-block bg-yellow-500 p-5 rounded-[2.5rem] shadow-2xl shadow-yellow-500/40 animate-bounce">
            <Sparkles size={40} className="text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-6xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
              {userName} <span className="text-yellow-400 block md:inline text-glow">Vault</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-xs tracking-[0.6em]">
              Coleccionista Verificado • {cards.length} Cartas en Venta
            </p>
          </div>
          <div className="flex justify-center gap-4">
             <button className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-pink-600 transition-all group">
                <Instagram size={20} className="group-hover:scale-110 transition-transform" />
             </button>
             <button className="bg-white/5 border border-white/10 p-4 rounded-2xl hover:bg-green-600 transition-all group">
                <MessageCircle size={20} className="group-hover:scale-110 transition-transform" />
             </button>
          </div>
        </div>
      </header>

      {/* SECCIÓN VITRINA (TOP 3) */}
      {featuredCards.length > 0 && (
        <section className="max-w-7xl mx-auto px-8 mb-24 relative z-20">
          <div className="flex items-center gap-4 mb-10">
            <Trophy className="text-yellow-500" />
            <h2 className="text-sm font-black uppercase tracking-[0.4em] text-slate-400">Piezas Maestras</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {featuredCards.map((card) => (
              <div key={card.id} className="relative group">
                <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-blue-500 rounded-[2rem] blur opacity-25 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                <div className="relative bg-slate-900 rounded-[2rem] p-6 border border-white/10 overflow-hidden">
                   <img src={card.image} className="w-full rounded-xl mb-4 shadow-2xl" alt={card.name} />
                   <div className="space-y-2">
                      <p className="font-black text-xs uppercase truncate text-slate-400">{card.name}</p>
                      <div className="flex justify-between items-end">
                        <span className="text-yellow-400 font-black italic text-3xl">
                          ${Number(card.price).toLocaleString('es-CL')}
                        </span>
                        <span className="text-[10px] font-bold text-slate-500">CLP</span>
                      </div>
                   </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GALERÍA COMPLETA */}
      <main className="max-w-7xl mx-auto px-8 relative z-20">
        <div className="flex items-center gap-4 mb-12">
          <div className="h-[2px] w-12 bg-yellow-500"></div>
          <h2 className="text-sm font-black uppercase tracking-[0.4em]">Inventario Disponible</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {cards.map((card) => (
            <div key={card.id} className="group relative">
              <div className="holo-card relative rounded-2xl overflow-hidden border border-white/5 bg-slate-950 transition-all duration-500 group-hover:shadow-[0_0_40px_rgba(234,179,8,0.2)] group-hover:-translate-y-3">
                
                <img src={card.image} alt={card.name} className="w-full h-auto z-10 relative" />

                {/* Etiquetas Rápidas (Idioma / Estado) */}
                <div className="absolute top-2 left-2 z-40 flex flex-col gap-1">
                  <span className="bg-yellow-500 text-black text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-tighter shadow-xl">
                    {card.status}
                  </span>
                  {card.language && (
                    <span className="bg-black/80 text-white border border-white/20 text-[7px] font-black px-2 py-0.5 rounded uppercase tracking-tighter backdrop-blur-md">
                      {card.language}
                    </span>
                  )}
                </div>

                {/* Capa Holográfica */}
                <div className="holo-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20" />

                {/* Panel de Información al Hover */}
                <div className="absolute inset-0 z-30 flex flex-col justify-end bg-gradient-to-t from-black via-black/40 to-transparent p-4 opacity-0 group-hover:opacity-100 transition-all duration-300">
                    <p className="text-[9px] font-black uppercase text-yellow-400 mb-1">{card.name}</p>
                    <p className="text-xl font-black italic mb-1">${Number(card.price).toLocaleString('es-CL')}</p>
                    <p className="text-[8px] text-slate-400 font-bold flex items-center gap-1 mb-3">
                      <MapPin size={8} /> {card.delivery || "A convenir"}
                    </p>
                    <button 
                      onClick={() => handleWhatsApp(card.name, card.price)}
                      className="w-full bg-yellow-500 text-black py-3 rounded-xl text-[10px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 hover:bg-white transition-colors shadow-lg"
                    >
                      <ShoppingCart size={14} /> Consultar
                    </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem] opacity-20">
             <p className="font-black uppercase tracking-[0.5em]">El Vault está cerrado temporalmente.</p>
          </div>
        )}
      </main>

      <style>{`
        .text-glow { text-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
        
        .holo-card { transform-style: preserve-3d; }
        
        .holo-effect {
          background: linear-gradient(
            135deg,
            rgba(255,255,255,0) 0%,
            rgba(255,255,255,0) 35%,
            rgba(255,255,255,0.4) 50%,
            rgba(255,255,255,0) 65%,
            rgba(255,255,255,0) 100%
          );
          background-size: 250% 250%;
          mix-blend-mode: color-dodge;
        }

        .group:hover .holo-effect {
          animation: holoSwipe 2s linear infinite;
        }

        @keyframes holoSwipe {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
      `}</style>
    </div>
  );
}