import React, { useEffect, useState } from 'react';
import TCGdex from '@tcgdex/sdk';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Shield, Search, Sparkles, Layout, Loader2, LogOut, User, Zap, Star, Bell, X, Share2, ShoppingBag, CheckCircle, Info, ArrowRight, MousePointer2, Smartphone } from 'lucide-react';

const tcgdex = new TCGdex('es');

export default function App() {
  const [cards, setCards] = useState([]);
  const [rareHeroes, setRareHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);
  const [setName, setSetName] = useState("");
  const navigate = useNavigate();

  const showAlert = (msg, type = 'info') => {
    setAlert({ msg, type });
    setTimeout(() => setAlert(null), 4000);
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) showAlert(`¡Entrenador ${currentUser.displayName.split(' ')[0]} conectado!`, 'success');
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

        showAlert(`Sincronizado con: ${lastSet.name}`, 'success');
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
        <div className="absolute inset-0 bg-slate-950/85 backdrop-blur-[2px]"></div>
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-950/60 to-[#020617]"></div>
      </div>

      {/* ALERTAS RESPONSIVAS */}
      {alert && (
        <div className="fixed top-4 md:top-6 right-4 left-4 md:left-auto md:w-80 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between ${
                alert.type === 'success' ? 'bg-green-500/20 border-green-500/50' : 
                alert.type === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-blue-600/20 border-blue-500/50'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-full"><Bell size={16}/></div>
                    <p className="text-[10px] md:text-xs font-black uppercase tracking-tight">{alert.msg}</p>
                </div>
                <button onClick={() => setAlert(null)}><X size={16} className="opacity-50"/></button>
            </div>
        </div>
      )}

      {/* NAVBAR RESPONSIVA */}
      <nav className="p-4 md:px-12 border-b border-white/10 flex justify-between items-center bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-[100]">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-1.5 rounded-lg md:rounded-xl shadow-lg shadow-blue-500/20 group-hover:rotate-12 transition-transform">
            <img 
              src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" 
              alt="Logo" 
              className="w-6 h-6 md:w-8 md:h-8 object-contain"
            />
          </div>
          <h1 className="font-black italic uppercase tracking-tighter text-base md:text-2xl">POKE<span className="text-blue-500">ALBUM</span></h1>
        </div>
        
        <div className="flex items-center gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400">
            <span className="hidden sm:inline">by Juegos Vikingos</span>
            <div className="w-[1px] h-4 bg-white/20 mx-2 hidden sm:block"></div>
          {user ? (
            <div className="flex items-center gap-1 md:gap-2 bg-white/5 p-1 rounded-full border border-white/10">
              <img src={user.photoURL} alt="avatar" className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-blue-500" />
              <div className="flex gap-1 pr-1 md:pr-2">
                <button onClick={() => navigate(`/dashboard/${user.uid}`)} className="p-1.5 md:p-2 hover:bg-blue-500 rounded-full transition-all text-white"><Layout size={14} /></button>
                <button onClick={handleLogout} className="p-1.5 md:p-2 hover:bg-red-500 rounded-full transition-all text-white"><LogOut size={14} /></button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-500 px-4 md:px-6 py-2 md:py-2.5 rounded-full font-black text-[9px] md:text-[10px] text-white uppercase transition-all shadow-xl active:scale-95">
              Ingresar
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10">
        {/* HEADER RESPONSIVO */}
        <header className="max-w-5xl mx-auto px-6 py-12 md:py-24 text-center space-y-6 md:space-y-8">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 px-4 md:px-5 py-2 rounded-full text-blue-400 text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] animate-pulse">
            <Sparkles size={12} className="fill-blue-500" /> Nueva Era de Coleccionismo
          </div>
          <h2 className="text-4xl sm:text-6xl md:text-8xl font-black uppercase italic leading-[0.9] md:leading-[0.8] tracking-tighter drop-shadow-2xl">
            PUBLICA, VENDE Y <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 via-blue-500 to-indigo-600">COLECCIONA.</span>
          </h2>
          
          <div className="bg-slate-900/40 backdrop-blur-md border border-white/10 p-5 md:p-8 rounded-2xl md:rounded-[2.5rem] text-left max-w-3xl mx-auto">
            <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="bg-blue-600 p-3 rounded-xl md:rounded-2xl shrink-0"><Info className="text-white" size={20}/></div>
                <div>
                    <h3 className="font-black uppercase text-xs md:text-sm mb-2 text-blue-400 tracking-widest text-center sm:text-left">¿Qué es PokeAlbum?</h3>
                    <p className="text-slate-300 text-xs md:text-sm leading-relaxed font-medium">
                        Plataforma diseñada por <strong className="text-white">Juegos Vikingos</strong> para el TCG en Chile. 
                        Digitaliza tu mazo físico, asigna precios en CLP y comparte tu perfil como una tienda personal. 
                    </p>
                </div>
            </div>
          </div>
        </header>

        {/* PASOS RESPONSIVOS */}
        <section className="max-w-7xl mx-auto px-6 py-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { icon: MousePointer2, t: "Selecciona", d: "Elige tus cartas favoritas." },
                    { icon: Smartphone, t: "Digitaliza", d: "Sube tu mazo a la nube." },
                    { icon: ShoppingBag, t: "Valoriza", d: "Pon precios en CLP." },
                    { icon: Share2, t: "Comparte", d: "Envía tu link a clientes." }
                ].map((step, idx) => (
                    <div key={idx} className="bg-white/5 border border-white/10 p-5 rounded-2xl md:rounded-3xl backdrop-blur-sm hover:bg-blue-600/10 transition-colors group">
                        <div className="flex items-center gap-4 mb-3">
                            <div className="bg-blue-600/20 p-2 rounded-lg text-blue-500 group-hover:scale-110 transition-transform">
                                <step.icon size={18} />
                            </div>
                            <span className="text-[9px] font-black text-slate-500 uppercase">Paso 0{idx + 1}</span>
                        </div>
                        <h4 className="font-black uppercase text-[10px] md:text-xs mb-1 tracking-widest text-white">{step.t}</h4>
                        <p className="text-slate-400 text-[10px] md:text-[11px] leading-tight font-medium">{step.d}</p>
                    </div>
                ))}
            </div>
        </section>

        {/* MARQUESINA RESPONSIVA */}
        <section className="py-8 md:py-12 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 mb-6 md:mb-8 flex items-end justify-between">
            <div>
                <h3 className="font-black uppercase italic text-2xl md:text-3xl tracking-tighter">{setName}</h3>
                <p className="text-[8px] md:text-[10px] uppercase font-bold text-blue-500 tracking-[0.2em]">Destacados de la expansión</p>
            </div>
          </div>

          <div className="flex w-max animate-marquee gap-4 md:gap-6 px-4 md:px-6">
            {loading ? (
                 <div className="w-screen flex justify-center py-10 md:py-20"><Loader2 className="animate-spin text-blue-500" size={32} /></div>
            ) : (
                [...rareHeroes, ...rareHeroes].map((card, idx) => (
                    <div key={`${card.id}-${idx}`} className="w-[180px] md:w-[280px] flex-shrink-0 transition-transform duration-500 hover:scale-105 hover:z-20">
                        <div className="relative bg-slate-900/80 backdrop-blur-xl rounded-[1.8rem] md:rounded-[2.5rem] p-3 md:p-4 border border-white/10 shadow-2xl group overflow-hidden">
                            <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-[1.8rem] md:rounded-[2.5rem] blur opacity-10 group-hover:opacity-40 transition"></div>
                            <img 
                                src={`${card.image}/high.webp`} 
                                className="relative rounded-[1.2rem] md:rounded-[1.8rem] w-full shadow-2xl" 
                                alt={card.name} 
                            />
                            <div className="mt-3 md:mt-4 flex flex-col items-center gap-1">
                                <h5 className="font-black uppercase text-[9px] md:text-[11px] tracking-tighter truncate w-full text-center">{card.name}</h5>
                                <div className="flex items-center gap-1">
                                    <Star size={8} className="text-yellow-500 fill-yellow-500" />
                                    <span className="text-slate-500 text-[7px] md:text-[8px] font-black uppercase tracking-widest">Top Edition</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </section>

        {/* MERCADO RESPONSIVO */}
        <main className="max-w-7xl mx-auto px-6 pb-20 md:pb-32">
          <div className="flex items-center gap-4 mb-8 md:mb-10">
            <h3 className="font-black uppercase tracking-[0.3em] text-[9px] md:text-[11px] text-slate-500 flex-shrink-0">Explorar Mercado</h3>
            <div className="h-[1px] w-full bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-5">
            {loading ? (
              <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="group cursor-pointer active:scale-95 transition-all">
                  <div className="relative overflow-hidden rounded-xl md:rounded-2xl border border-white/5 bg-slate-900/80 aspect-[3/4] p-1 md:p-1.5 transition-all group-hover:border-blue-500/50">
                    <img 
                        src={`${card.image}/low.webp`} 
                        alt={card.name}
                        className="w-full h-full object-contain rounded-lg md:rounded-xl transition-transform duration-500 group-hover:scale-110"
                        loading="lazy"
                    />
                  </div>
                  <p className="mt-2 text-[8px] md:text-[10px] font-black uppercase text-slate-400 text-center truncate tracking-tighter px-1">{card.name}</p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* FOOTER RESPONSIVO */}
      <footer className="bg-slate-950 border-t border-white/10 py-12 md:py-16 px-6 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-10 md:gap-12 text-center md:text-left">
              <div className="order-2 md:order-1">
                <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
                  <img src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" className="w-8 h-8 md:w-10 md:h-10 object-contain" alt="Logo" />
                  <h4 className="font-black italic text-xl md:text-2xl uppercase tracking-tighter">Poke<span className="text-blue-500">Album</span></h4>
                </div>
                <p className="text-slate-500 text-[10px] md:text-xs max-w-xs font-medium uppercase leading-relaxed mx-auto md:mx-0">
                    Diseñado para la comunidad de Chile. Una herramienta de Juegos Vikingos.
                </p>
              </div>

              <div className="flex flex-col items-center order-1 md:order-2">
                <span className="text-[8px] md:text-[10px] uppercase font-black tracking-[0.3em] text-blue-500 mb-3 md:mb-4">Hecho por</span>
                <img src="https://i.postimg.cc/Pq17zs7H/vikingo-sin-fondo-tex-blanco.png" className="h-12 md:h-20 object-contain hover:scale-110 transition-transform" alt="Juegos Vikingos" />
              </div>

              <div className="flex gap-6 md:gap-10 order-3">
                  <div className="text-center md:text-right">
                      <p className="text-white font-black text-xl md:text-2xl tracking-tighter italic">V 1.0.2</p>
                      <p className="text-[8px] md:text-[9px] uppercase text-blue-500 font-bold tracking-widest">Estudio Vikingo</p>
                  </div>
                  <div className="w-[1px] h-10 md:h-12 bg-white/10"></div>
                  <div className="text-center md:text-right">
                      <p className="text-white font-black text-xl md:text-2xl tracking-tighter uppercase italic">2026</p>
                      <p className="text-[8px] md:text-[9px] uppercase text-slate-500 font-bold tracking-widest">Chile TCG</p>
                  </div>
              </div>
          </div>
          <div className="max-w-7xl mx-auto mt-12 md:mt-16 pt-6 md:pt-8 border-t border-white/5 text-center">
             <p className="text-slate-600 text-[8px] md:text-[9px] font-bold uppercase tracking-[0.4em]">© 2026 Juegos Vikingos Chile</p>
          </div>
      </footer>

      {/* ESTILOS DE ANIMACIÓN */}
      <style>{`
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50%)); }
        }
        .animate-marquee {
          animation: marquee 30s linear infinite; /* Un poco más rápido en móviles para fluidez */
        }
        @media (min-width: 768px) {
          .animate-marquee { animation-duration: 45s; }
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}