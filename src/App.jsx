import React, { useEffect, useState } from 'react';
import TCGdex from '@tcgdex/sdk';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Shield, Search, Sparkles, Layout, Loader2, LogOut, User, Zap, Star, 
  Bell, X, Share2, ShoppingBag, CheckCircle, Info, ArrowRight, 
  MousePointer2, Smartphone, MessageSquare, ExternalLink, ShieldCheck
} from 'lucide-react';

const tcgdex = new TCGdex('es');

export default function App() {
  const [cards, setCards] = useState([]);
  const [rareHeroes, setRareHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [userPhone, setUserPhone] = useState(null); 
  const [alert, setAlert] = useState(null);
  const [setName, setSetName] = useState("");
  const navigate = useNavigate();

  const showAlert = (msg, type = 'info') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        // Pequeño log para depuración de la foto si persiste el error
        console.log("Foto detectada:", currentUser.photoURL);
        
        showAlert(`¡Entrenador ${currentUser.displayName.split(' ')[0]} conectado!`, 'success');
        
        try {
          const userDoc = await getDoc(doc(db, "users", currentUser.uid));
          if (userDoc.exists()) {
            setUserPhone(userDoc.data().whatsapp);
          }
        } catch (e) {
          console.error("Error obteniendo perfil:", e);
        }
      } else {
        setUser(null);
      }
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const loadHomeContent = async () => {
      try {
        setLoading(true);
        const resSets = await fetch('https://api.tcgdex.net/v2/es/sets');
        const sets = await resSets.json();
        const lastSet = sets[sets.length - 1]; 
        setSetName(lastSet.name);

        const resHeroes = await fetch(`https://api.tcgdex.net/v2/es/sets/${lastSet.id}`);
        const heroesData = await resHeroes.json();
        const heroesList = heroesData.cards || [];

        const shuffled = [...heroesList].sort(() => 0.5 - Math.random());
        setRareHeroes(shuffled.slice(0, 20)); 
        setCards(shuffled.slice(0, 24));
      } catch (err) {
        console.error("Error:", err);
        showAlert("Error de conexión con TCGdex", "error");
      } finally {
        setLoading(false);
      }
    };
    loadHomeContent();
  }, []);

  const handleLogin = async () => {
    try {
      const res = await signInWithPopup(auth, googleProvider);
      navigate(`/dashboard/${res.user.uid}`);
    } catch (err) { 
      showAlert("Fallo en la conexión Google", "error");
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setUser(null);
    setUserPhone(null);
    showAlert("Sesión finalizada", "info");
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans selection:bg-blue-500 overflow-x-hidden">
      
      {/* FONDO PROFESIONAL */}
      <div className="fixed inset-0 z-0">
        <img 
          src="https://i.postimg.cc/W1qZy2jY/86c94468cdfbb6d48ec9e7677e458555.webp" 
          className="w-full h-full object-cover" 
          alt="Background"
        />
        <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-[#020617]"></div>
      </div>

      {/* ALERTAS */}
      {alert && (
        <div className="fixed top-20 right-4 left-4 md:left-auto md:w-80 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between ${
                alert.type === 'success' ? 'bg-green-500/20 border-green-500/50 text-green-400' : 
                alert.type === 'error' ? 'bg-red-500/20 border-red-500/50 text-red-400' : 'bg-blue-600/20 border-blue-500/50 text-blue-400'
            }`}>
                <div className="flex items-center gap-3">
                    <Bell size={16}/>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-widest">{alert.msg}</p>
                </div>
                <button onClick={() => setAlert(null)}><X size={16} className="opacity-50"/></button>
            </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-4 md:px-12 border-b border-white/10 flex justify-between items-center bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-[100]">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-1.5 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/40 group-hover:rotate-12 transition-transform">
            <img 
              src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" 
              alt="Logo" 
              className="w-6 h-6 md:w-8 md:h-8 object-contain"
            />
          </div>
          <h1 className="font-black italic uppercase tracking-tighter text-base md:text-2xl">POKE<span className="text-blue-500">ALBUM</span></h1>
        </div>
        
        <div className="flex items-center gap-4">
          {user ? (
            <div className="flex items-center gap-2 md:gap-4">
              <button 
                onClick={() => navigate(`/dashboard/${user.uid}`)}
                className="hidden sm:flex items-center gap-2 bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl transition-all font-black text-[10px] uppercase tracking-widest shadow-lg shadow-blue-600/20 active:scale-95"
              >
                <Layout size={14} />
                Gestionar Mi Album
              </button>

              <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10 backdrop-blur-md">
                {/* SOLUCIÓN FOTO: Se añade referrerPolicy para evitar bloqueos de Google */}
                <img 
                  src={user.photoURL || `https://ui-avatars.com/api/?name=${user.displayName}&background=3b82f6&color=fff`} 
                  alt="avatar" 
                  referrerPolicy="no-referrer"
                  className="w-8 h-8 rounded-full border border-blue-500 cursor-pointer hover:opacity-80 transition-opacity object-cover" 
                  onClick={() => navigate(`/dashboard/${user.uid}`)}
                />
                <button 
                  onClick={handleLogout} 
                  className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-500 rounded-full transition-all"
                >
                  <LogOut size={16} />
                </button>
              </div>
            </div>
          ) : (
            <button 
              onClick={handleLogin} 
              className="bg-blue-600 hover:bg-blue-500 px-5 md:px-8 py-2.5 rounded-full font-black text-[10px] text-white uppercase transition-all shadow-xl shadow-blue-600/20 active:scale-95 flex items-center gap-2"
            >
              <User size={14} />
              Ingresar
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10">
        {/* SECCIÓN DE BIENVENIDA / WHATSAPP CHECK */}
        {user && (
          <div className="max-w-7xl mx-auto px-6 pt-8">
            <div className={`p-4 rounded-2xl border flex flex-col md:flex-row items-center justify-between gap-4 transition-all ${
              userPhone ? 'bg-green-500/5 border-green-500/20' : 'bg-yellow-500/5 border-yellow-500/20 animate-pulse'
            }`}>
              <div className="flex items-center gap-4 text-center md:text-left">
                <div className={`p-3 rounded-xl ${userPhone ? 'bg-green-500 text-white' : 'bg-yellow-500 text-black'}`}>
                  {userPhone ? <ShieldCheck size={20}/> : <MessageSquare size={20}/>}
                </div>
                <div>
                  <h4 className="font-black uppercase text-[11px] tracking-widest">
                    {userPhone ? 'Tienda Verificada' : 'WhatsApp no vinculado'}
                  </h4>
                  <p className="text-slate-400 text-[10px] font-medium">
                    {userPhone ? `Tu número +${userPhone} está activo para recibir ofertas.` : '¡Configura tu número para que puedan comprarte cartas!'}
                  </p>
                </div>
              </div>
              <button 
                onClick={() => navigate(`/dashboard/${user.uid}`)}
                className={`w-full md:w-auto px-6 py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  userPhone ? 'bg-white/5 hover:bg-white/10 text-white' : 'bg-yellow-500 hover:bg-yellow-400 text-black shadow-xl shadow-yellow-500/20'
                }`}
              >
                {userPhone ? 'Editar Perfil' : 'Vincular Ahora'} <ArrowRight size={14}/>
              </button>
            </div>
          </div>
        )}

        <header className="max-w-5xl mx-auto px-6 py-12 md:py-20 text-center space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-5 py-2 rounded-full text-blue-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em]">
            <Sparkles size={12} className="fill-blue-500" /> Mercado TCG Chile
          </div>
          <h2 className="text-5xl sm:text-7xl md:text-9xl font-black uppercase italic leading-[0.8] tracking-tighter">
            PUBLICA Y <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-blue-500 to-indigo-600">VENDE.</span>
          </h2>
          <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-[0.2em] max-w-xl mx-auto leading-relaxed">
            La primera red social de intercambio Pokémon en Chile impulsada por <span className="text-white">Juegos Vikingos</span>.
          </p>
        </header>

        {!user && (
          <div className="flex justify-center px-6 pb-12">
            <button onClick={handleLogin} className="w-full max-w-xs bg-white text-black font-black uppercase py-4 rounded-2xl flex items-center justify-center gap-3 shadow-2xl hover:bg-blue-500 hover:text-white transition-all group">
               Empezar Mi Colección <Layout size={18} className="group-hover:rotate-12 transition-transform"/>
            </button>
          </div>
        )}

        <section className="py-12 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 mb-8 flex items-center gap-4">
            <h3 className="font-black uppercase italic text-2xl md:text-4xl tracking-tighter">{setName}</h3>
            <div className="h-[2px] flex-1 bg-gradient-to-r from-blue-500 to-transparent"></div>
          </div>

          <div className="flex w-max animate-marquee gap-6">
            {loading ? (
                 <div className="w-screen flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" size={40} /></div>
            ) : (
                [...rareHeroes, ...rareHeroes].map((card, idx) => (
                    <div key={`${card.id}-${idx}`} className="w-[200px] md:w-[300px] flex-shrink-0 group">
                        <div className="relative bg-slate-900/40 backdrop-blur-md rounded-[2.5rem] p-4 border border-white/5 transition-all duration-500 group-hover:border-blue-500/50 group-hover:-translate-y-2">
                            <img 
                                src={`${card.image}/high.webp`} 
                                className="rounded-[1.8rem] w-full shadow-2xl transition-transform duration-500 group-hover:scale-105" 
                                alt={card.name} 
                            />
                            <div className="mt-4 flex flex-col items-center">
                                <h5 className="font-black uppercase text-[10px] tracking-tighter truncate w-full text-center">{card.name}</h5>
                                <div className="flex items-center gap-1 mt-1 opacity-50">
                                    <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-[7px] font-black uppercase">Expansion Top</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </section>

        <section className="max-w-7xl mx-auto px-6 py-20">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {[
                    { icon: MousePointer2, t: "Busca", d: "Encuentra cualquier carta oficial." },
                    { icon: Shield, t: "Publica", d: "Sube tu stock con un clic." },
                    { icon: ShoppingBag, t: "Vende", d: "Recibe pagos directos." },
                    { icon: Share2, t: "Link", d: "Tu perfil es tu tienda." }
                ].map((step, idx) => (
                    <div key={idx} className="relative group">
                        <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-3xl blur opacity-0 group-hover:opacity-20 transition duration-500"></div>
                        <div className="relative bg-slate-900/50 border border-white/10 p-8 rounded-3xl backdrop-blur-sm flex flex-col items-center text-center">
                            <div className="bg-blue-600/20 p-4 rounded-2xl text-blue-500 mb-4 group-hover:scale-110 transition-transform">
                                <step.icon size={24} />
                            </div>
                            <h4 className="font-black uppercase text-xs mb-2 tracking-widest">{step.t}</h4>
                            <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase">{step.d}</p>
                        </div>
                    </div>
                ))}
            </div>
        </section>

        <main className="max-w-7xl mx-auto px-6 pb-32">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-12">
            <div>
              <h3 className="font-black uppercase tracking-[0.4em] text-xs text-blue-500 mb-1">Mercado Global</h3>
              <p className="text-slate-500 text-[10px] font-black uppercase">Cartas disponibles en la comunidad</p>
            </div>
            <div className="h-[1px] flex-1 bg-white/5 mx-8 hidden md:block"></div>
            <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-white transition-colors">
                Ver todo <ExternalLink size={14}/>
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="group cursor-pointer">
                  <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-slate-900/40 aspect-[3/4] p-2 transition-all group-hover:border-blue-500 group-hover:shadow-[0_0_30px_rgba(59,130,246,0.2)]">
                    <img 
                        src={`${card.image}/low.webp`} 
                        alt={card.name}
                        className="w-full h-full object-contain rounded-xl transition-transform duration-700 group-hover:scale-110"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-4">
                        <span className="text-[8px] font-black text-white uppercase tracking-widest">Ver Detalles</span>
                    </div>
                  </div>
                  <p className="mt-3 text-[9px] font-black uppercase text-slate-400 text-center truncate tracking-widest group-hover:text-blue-400 transition-colors">{card.name}</p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      <footer className="bg-slate-950 border-t border-white/5 py-20 px-6 relative z-10">
          <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-12 items-center">
              <div className="flex flex-col items-center md:items-start space-y-4">
                  <div className="flex items-center gap-3">
                    <img src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" className="w-10 h-10 object-contain" alt="Logo" />
                    <h4 className="font-black italic text-2xl uppercase tracking-tighter">Poke<span className="text-blue-500">Album</span></h4>
                  </div>
                  <p className="text-slate-500 text-[10px] font-bold uppercase tracking-widest leading-loose text-center md:text-left">
                      Impulsando el coleccionismo en Chile. Una herramienta gratuita de Juegos Vikingos.
                  </p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4">
                <span className="text-[9px] uppercase font-black tracking-[0.4em] text-blue-500">Engineered by</span>
                <img src="https://i.postimg.cc/Pq17zs7H/vikingo-sin-fondo-tex-blanco.png" className="h-20 object-contain hover:scale-110 transition-transform duration-500 shadow-2xl" alt="Juegos Vikingos" />
              </div>

              <div className="flex justify-center md:justify-end gap-12">
                  <div className="text-right">
                      <p className="text-white font-black text-3xl tracking-tighter italic leading-none">V1.0</p>
                      <p className="text-[8px] uppercase text-blue-500 font-black tracking-widest">Estudio Vikingo</p>
                  </div>
                  <div className="text-right border-l border-white/10 pl-12">
                      <p className="text-white font-black text-3xl tracking-tighter italic leading-none uppercase">2026</p>
                      <p className="text-[8px] uppercase text-slate-500 font-black tracking-widest">Chile TCG</p>
                  </div>
              </div>
          </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, h4, h5, button { font-family: 'Archivo Black', sans-serif; }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50%)); }
        }
        .animate-marquee {
          animation: marquee 40s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        body { background-color: #020617; }
        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #020617; }
        ::-webkit-scrollbar-thumb { background: #1e293b; border-radius: 10px; }
        ::-webkit-scrollbar-thumb:hover { background: #3b82f6; }
      `}</style>
    </div>
  );
}