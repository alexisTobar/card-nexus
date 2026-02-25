import React, { useState, useEffect } from 'react';
import { db } from '../lib/firebase';
import { collection, query, where, getDocs, doc, getDoc } from 'firebase/firestore';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { 
  Loader2, MessageCircle, Trophy, ShoppingCart, MapPin, 
  Layers, ArrowLeft, CheckCircle2, ListPlus, Trash2, Send, Sparkles
} from 'lucide-react';

export default function Profile() {
  const { uid } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  
  const queryParams = new URLSearchParams(location.search);
  const albumIdFromUrl = queryParams.get('album');

  const [cards, setCards] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userName, setUserName] = useState("Coleccionista");
  const [userPhoto, setUserPhoto] = useState(null);
  const [userWhatsapp, setUserWhatsapp] = useState("");
  const [albumName, setAlbumName] = useState("");

  const [interestList, setInterestList] = useState([]);

  const backgroundUrl = "https://i.postimg.cc/wv0006cf/pokemon-tcg-pocket-trading-has-spurred-a-strange-black-marke-punu.jpg";
  
  useEffect(() => {
    const fetchProfile = async () => {
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", uid));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setUserWhatsapp(userData.whatsapp || "");
          setUserName(userData.displayName || "Coleccionista");
          setUserPhoto(userData.photoURL || null);
        }

        if (albumIdFromUrl) {
          const albumDoc = await getDoc(doc(db, "albums", albumIdFromUrl));
          if (albumDoc.exists()) {
            setAlbumName(albumDoc.data().name);
          }
        }

        let q;
        if (albumIdFromUrl) {
          q = query(
            collection(db, "userCollections"), 
            where("uid", "==", uid),
            where("albumId", "==", albumIdFromUrl)
          );
        } else {
          q = query(collection(db, "userCollections"), where("uid", "==", uid));
        }

        const snap = await getDocs(q);
        const fetchedCards = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCards(fetchedCards);
        
      } catch (err) {
        console.error("Error al cargar perfil:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [uid, albumIdFromUrl]);

  const toggleInterest = (card) => {
    setInterestList(prev => {
      const exists = prev.find(item => item.id === card.id);
      if (exists) {
        return prev.filter(item => item.id !== card.id);
      }
      return [...prev, card];
    });
  };

  const handleSendBatchWhatsApp = () => {
    if (!userWhatsapp) {
      alert("Este vendedor aún no ha vinculado su WhatsApp.");
      return;
    }
    if (interestList.length === 0) return;

    const cleanNumber = userWhatsapp.replace(/\D/g, '');
    const finalPhone = cleanNumber.startsWith('56') ? cleanNumber : `56${cleanNumber}`;
    
    const listadoCartas = interestList.map(c => `- ${c.name} (x${c.quantity || 1})`).join('\n');
    const total = interestList.reduce((acc, curr) => acc + (Number(curr.price) * (Number(curr.quantity) || 1)), 0);

    const mensaje = `¡Hola ${userName}! Vi tu álbum "${albumName || 'Principal'}" en PokeAlbum ⚡\n\nMe interesan estas cartas:\n${listadoCartas}\n\n*Total estimado: $${total.toLocaleString('es-CL')} CLP*\n\n¿Están disponibles?`;
      
    window.open(`https://wa.me/${finalPhone}?text=${encodeURIComponent(mensaje)}`, '_blank');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a192f] flex flex-col items-center justify-center text-white">
        <div className="relative">
            <div className="w-20 h-20 border-8 border-white/10 border-t-red-500 rounded-full animate-spin"></div>
            <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-4 h-4 bg-white rounded-full shadow-[0_0_15px_white]"></div>
            </div>
        </div>
        <p className="mt-6 text-[10px] font-black uppercase tracking-[0.5em] text-blue-400">Cargando Deck...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans pb-32 relative overflow-x-hidden">
      {/* HEADER ACTIONS */}
      <div className="fixed top-6 left-6 right-6 z-[100] flex justify-between items-center">
        <button onClick={() => navigate('/')} className="bg-black/60 backdrop-blur-xl border border-white/10 p-4 rounded-2xl hover:bg-yellow-500 hover:text-black transition-all shadow-2xl">
          <ArrowLeft size={24} />
        </button>
      </div>

      {/* FLOAT BAR DE COMPRA */}
      {interestList.length > 0 && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] w-[95%] max-w-lg bg-gradient-to-r from-blue-700 to-blue-500 border-t-4 border-blue-400 p-5 rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex items-center justify-between animate-in slide-in-from-bottom-10">
          <div className="flex flex-col">
            <span className="text-[10px] font-black uppercase text-blue-100 flex items-center gap-1">
                <Sparkles size={10}/> Carrito Pokémon
            </span>
            <span className="text-xl font-black italic text-white leading-none">{interestList.length} Cartas Lista</span>
          </div>
          <button onClick={handleSendBatchWhatsApp} className="bg-yellow-400 text-black px-8 py-4 rounded-2xl font-black flex items-center gap-3 shadow-xl hover:scale-105 active:scale-95 transition-all">
            <MessageCircle size={22} /> ENVIAR WHATSAPP
          </button>
        </div>
      )}

      {/* BACKGROUND & OVERLAY */}
      <div className="fixed inset-0 z-0 bg-cover bg-center opacity-30 scale-110" style={{ backgroundImage: `url(${backgroundUrl})` }} />
      <div className="fixed inset-0 z-0 bg-gradient-to-b from-[#020617]/60 via-[#0a192f]/90 to-[#020617]" />

      <header className="relative min-h-[400px] flex items-center justify-center z-10 pt-20">
        <div className="text-center space-y-6 px-4">
          <div className="inline-block relative">
             <div className="absolute inset-0 bg-yellow-500 blur-[80px] opacity-20 animate-pulse"></div>
             <h1 className="relative text-5xl sm:text-8xl font-black uppercase italic tracking-tighter leading-none">
                {userName} <span className="text-yellow-400 block drop-shadow-[0_5px_15px_rgba(234,179,8,0.4)]">{albumName || "TRAINER"}</span>
             </h1>
          </div>
          
          <div className="flex justify-center gap-3">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 px-5 py-2 rounded-2xl flex items-center gap-3 shadow-xl">
              <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-[0_0_10px_#22c55e]"></div>
              <span className="text-xs font-black uppercase tracking-widest text-slate-300">Colección Activa</span>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-[1400px] mx-auto px-6 relative z-10">
        <div className="flex items-center justify-between mb-12 border-b border-white/5 pb-6">
           <div>
            <h2 className="text-2xl font-black uppercase italic tracking-widest text-white flex items-center gap-3">
                <Layers className="text-yellow-400" /> Cartas en Stock
            </h2>
            <p className="text-slate-500 text-[10px] font-bold uppercase mt-1">Haz clic en las cartas para seleccionarlas</p>
           </div>
           
           {interestList.length > 0 && (
             <button onClick={() => setInterestList([])} className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-colors border border-red-500/20">
               <Trash2 size={14}/> Borrar Selección
             </button>
           )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-8">
          {cards.map((card) => {
            const isSelected = interestList.some(item => item.id === card.id);
            return (
              <div 
                key={card.id} 
                onClick={() => toggleInterest(card)}
                className={`group relative flex flex-col bg-slate-900/40 backdrop-blur-xl rounded-[2rem] border-2 transition-all duration-300 cursor-pointer overflow-hidden
                  ${isSelected ? 'border-yellow-400 -translate-y-4 shadow-[0_20px_40px_rgba(234,179,8,0.3)] bg-slate-800/60' : 'border-white/5 hover:border-white/20 hover:-translate-y-2'}`}
              >
                {/* CARD ART */}
                <div className="relative aspect-[2/3] p-2">
                  {/* EFECTO HOLO DINÁMICO */}
                  <div className={`absolute inset-0 z-20 pointer-events-none transition-opacity duration-500
                    ${isSelected ? 'opacity-100 holo-premium' : 'opacity-20 group-hover:opacity-60 holo-subtle'}`} 
                  />
                  
                  <img src={card.image} alt={card.name} className="w-full h-full object-contain relative z-10 drop-shadow-2xl" />
                  
                  {/* BADGE DE CANTIDAD MEJORADO (Estilo Energy/Sticker) */}
                  <div className="absolute top-3 left-3 z-40">
                      <div className="bg-black/80 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-1 shadow-lg ring-1 ring-white/10">
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">Stock</span>
                        <span className="text-xs font-black text-white">{card.quantity || 1}</span>
                      </div>
                  </div>

                  {/* INDICADOR SELECCIÓN */}
                  <div className={`absolute inset-0 z-30 flex items-center justify-center transition-all duration-300 ${isSelected ? 'bg-yellow-400/5' : 'bg-transparent'}`}>
                    {isSelected && (
                      <div className="bg-yellow-400 text-black p-3 rounded-full shadow-[0_0_25px_#eab308] scale-110">
                        <CheckCircle2 size={24} />
                      </div>
                    )}
                  </div>
                </div>

                {/* CARD INFO */}
                <div className="px-4 py-4 bg-gradient-to-t from-black/60 to-transparent relative z-30">
                  <h3 className="text-[9px] font-black uppercase truncate text-slate-400 mb-1 tracking-wider">{card.name}</h3>
                  <div className="flex items-end justify-between">
                    <div className="flex flex-col leading-none">
                        <span className="text-[8px] font-bold text-yellow-500/80 uppercase">Precio</span>
                        <span className="text-xl font-black italic text-yellow-400 tracking-tighter">
                            ${Number(card.price).toLocaleString('es-CL')}
                        </span>
                    </div>
                    <div className="text-[10px] bg-white/5 border border-white/10 px-2 py-1 rounded-lg font-black text-white/80 italic">
                        {card.status || 'NM'}
                    </div>
                  </div>
                  
                  {card.delivery && (
                    <div className="flex items-center gap-1.5 text-[8px] text-blue-300 font-bold uppercase mt-3 bg-blue-500/10 p-2 rounded-xl border border-blue-500/20">
                      <MapPin size={10} className="text-blue-400" /> {card.delivery}
                    </div>
                  )}
                </div>

                {/* GLOW DE SELECCIÓN TRASERO */}
                {isSelected && (
                    <div className="absolute -bottom-10 left-1/2 -translate-x-1/2 w-40 h-20 bg-yellow-400 blur-[60px] opacity-20 z-0"></div>
                )}
              </div>
            );
          })}
        </div>
      </main>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, button, span { font-family: 'Archivo Black', sans-serif; }
        
        /* Efecto Holo Premium (Arcoíris) */
        .holo-premium {
          background: linear-gradient(
            125deg,
            rgba(255, 0, 0, 0.2) 0%,
            rgba(255, 255, 0, 0.2) 20%,
            rgba(0, 255, 0, 0.2) 40%,
            rgba(0, 255, 255, 0.2) 60%,
            rgba(0, 0, 255, 0.2) 80%,
            rgba(255, 0, 255, 0.2) 100%
          );
          background-size: 300% 300%;
          mix-blend-mode: color-dodge;
          animation: holoMove 3s infinite alternate ease-in-out;
        }

        .holo-subtle {
          background: linear-gradient(110deg, transparent 25%, rgba(255,255,255,0.4) 50%, transparent 75%);
          background-size: 200% 100%;
          mix-blend-mode: overlay;
          animation: automaticHolo 5s infinite linear;
        }

        @keyframes holoMove {
          0% { background-position: 0% 50%; }
          100% { background-position: 100% 50%; }
        }

        @keyframes automaticHolo {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Scrollbar Personalizada */
        ::-webkit-scrollbar { width: 8px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #eab308; }
      `}</style>
    </div>
  );
}