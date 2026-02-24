import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { useParams } from 'react-router-dom';
import { Loader2, MessageCircle, Sparkles, Trophy, ShoppingCart, MapPin } from 'lucide-react';

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
    const telefono = "56900000000"; // CAMBIA ESTO
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
      <header className="relative h-[400px] w-full overflow-hidden flex items-center justify-center">
        <div className="absolute inset-0 bg-gradient-to-b from-yellow-500/10 via-[#020617]/80 to-[#020617] z-0" />
        <div className="relative z-10 text-center space-y-6 px-4">
          <div className="inline-block bg-yellow-500 p-5 rounded-[2.5rem] shadow-2xl shadow-yellow-500/40 animate-bounce">
            <Sparkles size={40} className="text-black" />
          </div>
          <div className="space-y-2">
            <h1 className="text-5xl md:text-8xl font-black uppercase italic tracking-tighter leading-none">
              {userName} <span className="text-yellow-400 block md:inline text-glow">Vault</span>
            </h1>
            <p className="text-slate-500 font-bold uppercase text-[10px] tracking-[0.6em]">
              Coleccionista Verificado • {cards.length} Cartas en Venta
            </p>
          </div>
          <div className="flex justify-center">
            <button 
              onClick={() => handleWhatsApp("tu perfil", "varios")}
              className="bg-green-600 border border-green-400/50 p-4 rounded-2xl hover:bg-green-500 transition-all flex items-center gap-3 shadow-[0_0_20px_rgba(22,163,74,0.4)]"
            >
              <MessageCircle size={20} className="text-white" />
              <span className="text-[10px] font-black uppercase tracking-widest text-white">Contactar Vendedor</span>
            </button>
          </div>
        </div>
      </header>

      {/* VITRINA (TOP 3) - Visible y destacada siempre */}
      {featuredCards.length > 0 && (
        <section className="max-w-7xl mx-auto px-6 mb-20 relative z-20">
          <div className="flex items-center gap-4 mb-8">
            <Trophy className="text-yellow-500" size={20} />
            <h2 className="text-xs font-black uppercase tracking-[0.4em] text-slate-400">Piezas Maestras</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {featuredCards.map((card) => (
              <div key={card.id} className="relative bg-slate-900/50 border border-white/10 rounded-[2.5rem] p-5 overflow-hidden group">
                <img src={card.image} className="w-full rounded-xl mb-4 shadow-2xl transition-transform group-hover:scale-105" alt={card.name} />
                <div className="space-y-3">
                  <p className="font-black text-[10px] uppercase truncate text-slate-400">{card.name}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-yellow-400 font-black italic text-2xl">
                      ${Number(card.price).toLocaleString('es-CL')}
                    </span>
                    <button 
                      onClick={() => handleWhatsApp(card.name, card.price)}
                      className="bg-yellow-500 text-black p-3 rounded-xl hover:bg-white transition-colors"
                    >
                      <ShoppingCart size={18} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* GALERÍA COMPLETA - Optimizada para Scroll Infinito en Móvil */}
      <main className="max-w-7xl mx-auto px-4 relative z-20">
        <div className="flex items-center gap-4 mb-10">
          <div className="h-[2px] w-12 bg-yellow-500"></div>
          <h2 className="text-xs font-black uppercase tracking-[0.4em]">Inventario</h2>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 md:gap-8">
          {cards.map((card) => (
            <div key={card.id} className="flex flex-col gap-3">
              <div className="relative aspect-[2/3] holo-card rounded-2xl overflow-hidden border border-white/10 bg-slate-950 shadow-xl group">
                <img src={card.image} alt={card.name} className="w-full h-full object-cover z-10 relative" />
                
                {/* Badge de Idioma/Estado SIEMPRE visible */}
                <div className="absolute top-2 left-2 z-40 flex flex-col gap-1">
                  <span className="bg-yellow-500 text-black text-[7px] font-black px-1.5 py-0.5 rounded uppercase shadow-lg">
                    {card.status}
                  </span>
                </div>

                {/* Badge de PRECIO SIEMPRE visible en la carta */}
                <div className="absolute bottom-2 right-2 z-40 bg-black/80 backdrop-blur-md border border-yellow-500/50 px-2 py-1 rounded-lg">
                  <p className="text-yellow-400 font-black text-[10px]">
                    ${Number(card.price).toLocaleString('es-CL')}
                  </p>
                </div>

                {/* Efecto holográfico sigue funcionando al tocar/hover */}
                <div className="holo-effect absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 z-20" />
              </div>

              {/* Info y Botón debajo de la carta - SIEMPRE visible */}
              <div className="px-1 space-y-2">
                <p className="text-[9px] font-bold uppercase truncate text-slate-300">{card.name}</p>
                <button 
                  onClick={() => handleWhatsApp(card.name, card.price)}
                  className="w-full bg-white/5 border border-white/10 text-white py-2.5 rounded-xl text-[9px] font-black uppercase tracking-tighter flex items-center justify-center gap-2 active:bg-yellow-500 active:text-black transition-all"
                >
                  <ShoppingCart size={12} /> Comprar
                </button>
              </div>
            </div>
          ))}
        </div>

        {cards.length === 0 && (
          <div className="text-center py-40 border-2 border-dashed border-white/5 rounded-[4rem] opacity-20">
              <p className="font-black uppercase tracking-[0.5em]">El Vault está vacío.</p>
          </div>
        )}
      </main>

      <style>{`
        .text-glow { text-shadow: 0 0 30px rgba(234, 179, 8, 0.4); }
        .holo-card { transform-style: preserve-3d; transition: all 0.3s ease; }
        .holo-effect {
          background: linear-gradient(135deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.3) 50%, rgba(255,255,255,0) 100%);
          background-size: 250% 250%;
          mix-blend-mode: color-dodge;
        }
        .group:hover .holo-effect { animation: holoSwipe 2s linear infinite; }
        @keyframes holoSwipe {
          0% { background-position: 200% 200%; }
          100% { background-position: -200% -200%; }
        }
      `}</style>
    </div>
  );
}