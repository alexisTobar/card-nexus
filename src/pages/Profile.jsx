import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Loader2, MessageCircle, Trophy, ShoppingCart, MapPin, 
  Layers, ArrowLeft, CheckCircle2, ListPlus, Trash2, Send 
} from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coleccionista");
  const [userPhoto, setUserPhoto] = useState(null);
  const [userWhatsapp, setUserWhatsapp] = useState("");

  // NUEVO: Estado para la lista de interés (carrito)
  const [interestList, setInterestList] = useState([]);

  const backgroundUrl = "https://i.postimg.cc/wv0006cf/pokemon-tcg-pocket-trading-has-spurred-a-strange-black-marke-punu.jpg";
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserWhatsapp(userData.whatsapp || "");
          setUserName(userData.displayName || "Coleccionista");
          setUserPhoto(userData.photoURL || null);
        }

        const q = query(collection(db, "userCollections"), where("uid", "==", uid));
        const snap = await getDocs(q);
        const fetchedCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        
        setCards(fetchedCards);
        
        if (!userDoc.exists() && fetchedCards.length > 0) {
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

  // LÓGICA DE SELECCIÓN DE CARTAS
  const toggleInterest = (card) => {
    setInterestList(prev => {
      const exists = prev.find(item => item.id === card.id);
      if (exists) {
        return prev.filter(item => item.id !== card.id);
      }
      return [...prev, card];
    });
  };

  // FUNCIÓN WHATSAPP CONSOLIDADA
  const handleSendBatchWhatsApp = () => {
    if (!userWhatsapp) {
      alert("Este vendedor aún no ha vinculado su WhatsApp.");
      return;
    }

    if (interestList.length === 0) {
      alert("Selecciona al menos una carta para enviar el mensaje.");
      return;
    }

    const cleanNumber = userWhatsapp.replace(/\D/g, '');
    const finalPhone = cleanNumber.startsWith('56') ? cleanNumber : `56${cleanNumber}`;
    
    // Construcción del listado para el mensaje
    const listadoCartas = interestList.map(c => `- ${c.name} ($${Number(c.price).toLocaleString('es-CL')})`).join('\n');
    const total = interestList.reduce((acc, curr) => acc + Number(curr.price), 0);

    const mensaje = `¡Hola ${userName}! He visto tu perfil en PokeAlbum y me interesan estas ${interestList.length} cartas:\n\n${listadoCartas}\n\n*Total estimado: $${total.toLocaleString('es-CL')} CLP*\n\n¿Aún las tienes disponibles?`;
      
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
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
      
      {/* BOTÓN VOLVER */}
      <button 
        onClick={() => navigate('/')}
        className="fixed top-6 left-6 z-[100] bg-black/40 backdrop-blur-xl border border-white/10 p-3 md:p-4 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all active:scale-90 group shadow-2xl"
      >
        <ArrowLeft size={20} className="group-hover:-translate-x-1 transition-transform" />
      </button>

      {/* BARRA FLOTANTE DE LISTA DE INTERÉS (Solo aparece si hay items) */}
      {interestList.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[90%] max-w-md bg-green-600 border-2 border-white/20 p-4 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between animate-in fade-in slide-in-from-bottom-10 duration-500">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase tracking-widest text-white/80">Lista de Interés</span>
            <span className="text-lg font-black italic">{interestList.length} Cartas seleccionadas</span>
          </div>
          <button 
            onClick={handleSendBatchWhatsApp}
            className="bg-white text-green-700 p-4 rounded-2xl hover:bg-yellow-400 hover:text-black transition-all active:scale-95 flex items-center gap-2"
          >
            <Send size={20} />
            <span className="font-black text-xs uppercase hidden sm:inline">Enviar Todo</span>
          </button>
        </div>
      )}

      {/* FONDO TCG OPTIMIZADO */}
      <div className="fixed inset-0 z-0 bg-cover bg-center bg-no-repeat opacity-40 pointer-events-none"
           style={{ backgroundImage: `url(${backgroundUrl})` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#020617]/40 via-[#020617]/80 to-[#020617] pointer-events-none" />

      {/* HEADER */}
      <header className="relative min-h-[400px] w-full flex items-center justify-center z-10 pt-32 pb-12">
        <div className="text-center space-y-6 px-4 w-full max-w-4xl">
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
        </div>
      </header>

      {/* GALERÍA */}
      <main className="max-w-[1440px] mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex items-center justify-between mb-8 md:mb-12">
          <div className="flex items-center gap-4">
            <div className="h-[2px] w-12 bg-yellow-500 shadow-[0_0_15px_rgba(234,179,8,0.5)]"></div>
            <h2 className="text-base md:text-lg font-black uppercase tracking-[0.3em] italic text-slate-200">Inventario Real</h2>
          </div>
          {interestList.length > 0 && (
            <button onClick={() => setInterestList([])} className="text-red-400 text-[10px] font-black uppercase flex items-center gap-2 hover:text-white transition-colors">
              <Trash2 size={14}/> Limpiar Selección
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 sm:gap-6 md:gap-8">
          {cards.map((card) => {
            const isSelected = interestList.some(item => item.id === card.id);
            return (
              <div 
                key={card.id} 
                onClick={() => toggleInterest(card)}
                className={`group flex flex-col h-full bg-black/40 backdrop-blur-md rounded-[1.5rem] md:rounded-[2.2rem] border transition-all duration-500 p-1.5 md:p-2 shadow-2xl cursor-pointer
                  ${isSelected ? 'border-yellow-400 ring-2 ring-yellow-400/20 scale-95' : 'border-white/10 hover:border-yellow-500/50'}`}
              >
                
                <div className="relative aspect-[2/3] rounded-[1.2rem] md:rounded-[1.6rem] overflow-hidden bg-slate-950 mb-3 md:mb-4">
                  <div className={`absolute inset-0 z-20 pointer-events-none holo-effect ${isSelected ? 'opacity-80' : 'opacity-40'}`} />
                  
                  <img src={card.image} alt={card.name} loading="lazy"
                    className="w-full h-full object-contain relative z-10 p-1 transition-transform duration-500 group-hover:scale-110" 
                  />

                  {/* INDICADOR DE SELECCIÓN */}
                  <div className="absolute top-2 right-2 z-30">
                    {isSelected ? (
                      <div className="bg-yellow-400 text-black p-1 rounded-full shadow-xl">
                        <CheckCircle2 size={18} />
                      </div>
                    ) : (
                      <div className="bg-black/40 backdrop-blur-md text-white p-1 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-opacity">
                        <ListPlus size={18} />
                      </div>
                    )}
                  </div>

                  <div className="absolute top-2 left-2 z-30">
                    <span className="bg-yellow-500 text-black text-[7px] md:text-[9px] font-black px-1.5 py-0.5 rounded uppercase">
                      {card.status}
                    </span>
                  </div>
                </div>

                <div className="px-1.5 md:px-3 pb-3 md:pb-4 space-y-3 flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="text-[8px] md:text-[10px] font-black uppercase truncate text-slate-400 mb-1">{card.name}</h3>
                    <div className="text-xl md:text-2xl font-black italic text-yellow-400">
                      ${Number(card.price).toLocaleString('es-CL')}
                    </div>
                    {card.delivery && (
                      <div className="flex items-center gap-1.5 text-[7px] md:text-[9px] text-slate-300 font-bold uppercase mt-2">
                        <MapPin size={10} className="text-yellow-500 shrink-0" /> 
                        <span className="truncate">{card.delivery}</span>
                      </div>
                    )}
                  </div>

                  <div className={`w-full py-2.5 rounded-xl md:rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all 
                    ${isSelected ? 'bg-yellow-500 text-black' : 'bg-white/5 text-white group-hover:bg-white/10'}`}>
                    {isSelected ? '¡En tu lista!' : 'Seleccionar'}
                  </div>
                </div>
              </div>
            );
          })}
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
      `}</style>
    </div>
  );
}