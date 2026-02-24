import React, { useEffect, useState } from 'react';
import TCGdex from '@tcgdex/sdk';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider, db } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { 
  Shield, Search, Sparkles, Layout, Loader2, LogOut, User, Zap, Star, 
  Bell, X, Share2, ShoppingBag, CheckCircle, Info, ArrowRight, 
  MousePointer2, Smartphone, MessageSquare, ExternalLink, ShieldCheck,
  Globe2, Users, Rocket, ZapIcon, Layers, Trophy, Target, Box
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
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] text-slate-100 font-sans selection:bg-[#ffcb05] selection:text-black overflow-x-hidden">
      
      {/* OVERLAY DE TEXTURA GRID */}
      <div className="fixed inset-0 z-0 pointer-events-none opacity-20" 
           style={{ backgroundImage: `radial-gradient(#3b82f6 0.5px, transparent 0.5px)`, backgroundSize: '24px 24px' }}></div>

      {/* FONDO PRINCIPAL */}
      <div className="fixed inset-0 z-[-1]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a0a0c] via-[#111827] to-[#020617]"></div>
        <div className="absolute top-[-10%] right-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-red-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-[300px] md:w-[500px] h-[300px] md:h-[500px] bg-blue-600/10 blur-[120px] rounded-full"></div>
      </div>

      {/* NAVBAR */}
      <nav className="p-3 md:px-8 border-b-2 border-[#ffcb05]/20 flex justify-between items-center bg-[#0a0a0c]/90 backdrop-blur-xl sticky top-0 z-[100]">
        <div className="flex items-center gap-2 md:gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="relative flex-shrink-0">
            <img src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" 
                 alt="Logo" className="w-8 h-8 md:w-10 md:h-10 object-contain relative z-10" />
          </div>
          <div className="flex flex-col min-w-0">
            <h1 className="font-black uppercase tracking-tighter text-lg md:text-3xl leading-none flex items-center">
              POKE<span className="text-[#ffcb05]">ALBUM</span>
              <span className="ml-2 text-[8px] md:text-[10px] bg-red-600 px-1 rounded text-white hidden xs:block">LIVE</span>
            </h1>
            <span className="text-[7px] md:text-[8px] font-bold tracking-[0.2em] text-blue-400 uppercase truncate">Chilean Trading Hub</span>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2">
              <button 
                onClick={() => navigate(`/dashboard/${user.uid}`)} 
                className="flex items-center gap-1 bg-[#ffcb05] text-black px-3 py-1.5 rounded-sm font-black text-[9px] md:text-[11px] uppercase hover:bg-white transition-all shadow-[3px_3px_0px_0px_rgba(255,203,5,0.3)]"
              >
                <Layout size={12} className="hidden xs:block" /> 
                <span>ÁLBUM</span>
              </button>
              <div className="flex items-center gap-1 bg-white/5 p-1 border-l border-red-500 pl-2">
                <img src={user.photoURL} alt="avatar" referrerPolicy="no-referrer" 
                    className="w-7 h-7 md:w-8 md:h-8 rounded-full border border-[#ffcb05]" />
                <button onClick={handleLogout} className="p-1 text-slate-400 hover:text-red-500 transition-all">
                  <LogOut size={14} />
                </button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-red-600 px-4 md:px-8 py-2 rounded-sm font-black text-[9px] md:text-[10px] text-white uppercase shadow-[3px_3px_0px_0px_rgba(220,38,38,0.3)] flex items-center gap-2">
              <User size={12} /> <span className="hidden xs:inline">ENTRENADOR</span><span className="xs:hidden">LOGIN</span>
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10">
        
        {/* HERO SECTION: REORGANIZADA PARA NO TAPAR TEXTO */}
        <header className="max-w-7xl mx-auto px-6 pt-12 pb-20 md:py-32 grid grid-cols-1 lg:grid-cols-12 gap-12 items-center">
          {/* TEXTO (Sube primero en móvil) */}
          <div className="lg:col-span-7 space-y-6 md:space-y-8 text-center lg:text-left order-2 lg:order-1">
            <div className="inline-flex items-center gap-3 bg-blue-600/10 border-l-4 border-blue-500 px-4 py-2">
              <ZapIcon size={14} className="text-[#ffcb05] fill-[#ffcb05]" /> 
              
            </div>
            
            <h2 className="text-5xl sm:text-6xl md:text-8xl lg:text-[8.5rem] font-black uppercase leading-[0.9] tracking-tighter text-white">
              DOMINA EL <br /> 
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#ffcb05] to-[#faca00] italic">MERCADO.</span>
            </h2>

            <p className="text-slate-400 text-sm md:text-lg max-w-xl mx-auto lg:mx-0 leading-relaxed font-medium">
              Convierte tu colección de <span className="text-white border-b border-red-500">Pokémon TCG</span> en una vitrina profesional. Conecta con entrenadores de todo Chile y cierra tratos vía WhatsApp al instante.
            </p>
            
          </div>

          {/* IMAGEN (Abajo en móvil, Derecha en PC) */}
          <div className="lg:col-span-5 order-1 lg:order-2 flex justify-center">
             <div className="relative w-full max-w-[320px] md:max-w-none">
                <div className="absolute inset-0 bg-blue-500/20 blur-[80px] animate-pulse"></div>
                <div className="relative border-2 border-white/10 bg-[#111827]/50 backdrop-blur-md p-4 md:p-6 rounded-2xl lg:rotate-3 hover:rotate-0 transition-transform duration-500 shadow-2xl">
                   <div className="flex items-center justify-between mb-4">
                      <div className="flex gap-1">
                         <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-red-500"></div>
                         <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-[#ffcb05]"></div>
                         <div className="w-2 md:w-3 h-2 md:h-3 rounded-full bg-green-500"></div>
                      </div>
                      <span className="text-[8px] md:text-[10px] font-mono text-slate-500 uppercase">STATUS: LIVE</span>
                   </div>
                   <img src="https://i.postimg.cc/W1qZy2jY/86c94468cdfbb6d48ec9e7677e458555.webp" className="w-full rounded-lg grayscale hover:grayscale-0 transition-all duration-700" alt="UI Preview" />
                </div>
             </div>
          </div>
        </header>

        {/* STATS: Responsivo */}
        <div className="max-w-7xl mx-auto px-6 pb-20 grid grid-cols-2 lg:grid-cols-4 gap-4">
           {[
             { label: "COLECCIONISTAS", val: "+2.5k", color: "text-red-500" },
             { label: "CARTAS", val: "+15k", color: "text-blue-500" },
             { label: "VENTAS/MES", val: "500+", color: "text-[#ffcb05]" },
             { label: "REGIÓN", val: "CHILE", color: "text-green-500" }
           ].map((stat, i) => (
             <div key={i} className="bg-[#0a0a0c] border border-white/5 p-4 md:p-6 rounded-sm relative overflow-hidden group">
               <div className="absolute top-0 left-0 w-1 h-full bg-current opacity-50 group-hover:w-full group-hover:opacity-5 transition-all"></div>
               <p className={`text-[8px] md:text-[10px] font-black uppercase tracking-widest mb-1 ${stat.color}`}>{stat.label}</p>
               <p className="text-xl md:text-3xl font-black text-white italic">{stat.val}</p>
             </div>
           ))}
        </div>

        {/* PASO A PASO */}
        <section className="bg-[#0f1115] py-20 border-y-4 border-black relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 mb-16 text-center relative z-10">
            <h3 className="text-3xl md:text-6xl font-black uppercase italic tracking-tighter mb-4">
              GUÍA DEL <span className="text-[#ffcb05]">ENTRENADOR</span>
            </h3>
            <div className="w-16 h-1 bg-red-600 mx-auto"></div>
          </div>
          
          <div className="max-w-7xl mx-auto px-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-8 relative z-10">
            {[
              { step: "INF", icon: User, t: "SINCRONIZA", d: "Conecta tu ID de Google. Es rápido y seguro." },
              { step: "COM", icon: MessageSquare, t: "WHATSAPP", d: "Vincula tu número para recibir ofertas." },
              { step: "INV", icon: Box, t: "CARGA STOCK", d: "Añade cartas con precios y estado." },
              { step: "PUB", icon: Globe2, t: "PUBLICAR", d: "Tu link profesional está listo para compartir." }
            ].map((item, idx) => (
              <div key={idx} className="bg-[#0a0a0c] border-2 border-white/5 p-6 md:p-8 relative group hover:border-[#ffcb05]/50 transition-all">
                <div className="absolute top-2 right-4 font-mono text-slate-800 text-3xl font-black group-hover:text-[#ffcb05]/10">
                  {item.step}
                </div>
                <item.icon size={24} className="text-[#ffcb05] mb-4" />
                <h4 className="font-black uppercase text-base mb-2 text-white">{item.t}</h4>
                <p className="text-slate-500 text-[10px] leading-relaxed font-bold uppercase">{item.d}</p>
              </div>
            ))}
          </div>
        </section>

        {/* CARROUSEL */}
        <section className="py-20 overflow-hidden relative">
          <div className="max-w-7xl mx-auto px-6 mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-white/10 pb-6 text-center md:text-left">
            <div className="space-y-1">
               <span className="text-[#ffcb05] font-black text-[9px] tracking-[0.4em] uppercase">Último Lanzamiento</span>
               <h3 className="font-black uppercase italic text-2xl md:text-5xl tracking-tighter truncate">{setName}</h3>
            </div>
            <button className="text-[9px] font-black uppercase tracking-widest text-slate-500 hover:text-white transition-colors border-2 border-slate-800 px-4 py-2 self-center md:self-end">Ver Todo</button>
          </div>

          <div className="flex w-max animate-marquee gap-4 md:gap-8 px-4">
            {loading ? (
                 <div className="w-screen flex justify-center py-10"><Loader2 className="animate-spin text-[#ffcb05]" size={32} /></div>
            ) : (
                [...rareHeroes, ...rareHeroes].map((card, idx) => (
                    <div key={`${card.id}-${idx}`} className="w-[160px] md:w-[260px] flex-shrink-0 group">
                        <div className="relative bg-[#111827] p-2 border border-white/5 group-hover:border-[#ffcb05] transition-all">
                            <img src={`${card.image}/high.webp`} className="w-full h-auto rounded" alt={card.name} />
                            <div className="mt-2 py-1 flex justify-between items-center px-1">
                                <span className="font-black uppercase text-[8px] truncate pr-1">{card.name}</span>
                                <span className="text-[7px] bg-white/10 px-1 text-slate-400">RARE</span>
                            </div>
                        </div>
                    </div>
                ))
            )}
          </div>
        </section>

        {/* MARKET GRID */}
        <main className="max-w-7xl mx-auto px-6 pb-24">
          <div className="bg-[#111827] border-l-4 md:border-l-8 border-red-600 p-6 md:p-8 mb-12 flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-black uppercase text-xl md:text-2xl text-white italic">Base de Datos Maestra</h3>
              <p className="text-slate-400 text-[9px] font-bold uppercase tracking-widest">Datos oficiales para tus publicaciones</p>
            </div>
            <button onClick={handleLogin} className="w-full md:w-auto bg-white text-black px-8 py-3 rounded-sm text-[10px] font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-xl">
                CREAR ANUNCIO
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
            {loading ? (
              <div className="col-span-full flex justify-center py-20"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="group bg-[#0a0a0c] border border-white/5 p-2 hover:bg-[#111827] transition-all">
                  <div className="relative aspect-[3/4] overflow-hidden bg-black mb-2">
                    <img src={`${card.image}/low.webp`} alt={card.name} className="w-full h-full object-contain group-hover:scale-105 transition-all duration-500" loading="lazy" />
                  </div>
                  <div className="px-1 space-y-0.5">
                    <p className="text-[7px] font-black text-blue-500 uppercase">{card.id.split('-')[0]}</p>
                    <p className="text-[9px] font-black uppercase text-slate-300 truncate">{card.name}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-black border-t-4 border-red-600 py-16 px-6 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row justify-between items-start gap-12">
              <div className="space-y-4 text-center lg:text-left w-full lg:w-auto">
                  <div className="flex items-center justify-center lg:justify-start gap-3">
                    <img src="https://i.postimg.cc/SsfCGDqp/toppng-com-okemon-pokeball-game-go-icon-free-pokemon-go-979x979.png" className="w-8 h-8 object-contain" alt="Logo" />
                    <h4 className="font-black italic text-xl md:text-2xl uppercase tracking-tighter">Poke<span className="text-[#ffcb05]">Album</span></h4>
                  </div>
                  <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest leading-loose mx-auto lg:mx-0 max-w-xs">
                      Gestión TCG optimizada para Chile. <br/>
                      <span className="text-white">Hecho para coleccionistas.</span>
                  </p>
              </div>

              <div className="flex flex-col items-center justify-center space-y-4 border-y lg:border-y-0 lg:border-x border-white/5 py-8 lg:py-0 w-full lg:w-1/3">
                <span className="text-[8px] uppercase font-black tracking-[0.4em] text-red-500">Authorized by</span>
                <img src="https://i.postimg.cc/Pq17zs7H/vikingo-sin-fondo-tex-blanco.png" className="h-16 md:h-20 object-contain brightness-75" alt="Juegos Vikingos" />
              </div>

              <div className="flex flex-col items-center lg:items-end gap-1 font-mono w-full lg:w-auto">
                  <p className="text-slate-700 text-[9px] font-black uppercase">v1.5.0_stable</p>
                  <p className="text-white font-black text-4xl md:text-5xl tracking-tighter italic leading-none">2026</p>
                  <p className="text-[#ffcb05] text-[9px] font-black uppercase tracking-widest">Santiago // Chile</p>
              </div>
          </div>
      </footer>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=JetBrains+Mono:wght@700&display=swap');
        
        body { background-color: #0a0a0c; font-family: 'Archivo Black', sans-serif; }
        h1, h2, h3, h4, button { font-family: 'Archivo Black', sans-serif; letter-spacing: -0.04em; }
        .font-mono { font-family: 'JetBrains Mono', monospace; }
        
        @keyframes marquee {
          0% { transform: translateX(0); }
          100% { transform: translateX(calc(-50% - 0.5rem)); }
        }
        
        .animate-marquee { animation: marquee 30s linear infinite; }
        @media (min-width: 768px) { .animate-marquee { animation-duration: 45s; } }

        ::-webkit-scrollbar { width: 6px; }
        ::-webkit-scrollbar-track { background: #0a0a0c; }
        ::-webkit-scrollbar-thumb { background: #1f2937; }
      `}</style>
    </div>
  );
}