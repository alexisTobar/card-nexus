import React, { useEffect, useState } from 'react';
import TCGdex from '@tcgdex/sdk';
import { useNavigate } from 'react-router-dom';
import { auth, googleProvider } from './lib/firebase';
import { signInWithPopup, onAuthStateChanged, signOut } from 'firebase/auth';
import { Shield, Search, Sparkles, Layout, Loader2, LogOut, User, Zap, Star, Bell, X } from 'lucide-react';

const tcgdex = new TCGdex('es');

export default function App() {
  const [cards, setCards] = useState([]);
  const [rareHeroes, setRareHeroes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);
  const [alert, setAlert] = useState(null);
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
        
        // 1. CARGA DE CARTAS ÉPICAS (Usamos IDs que existen sí o sí para no fallar)
        const res = await fetch('https://api.tcgdex.net/v2/es/cards?hp=120'); 
        const allData = await res.json();
        
        // Mezclamos todos los resultados para que siempre sea random
        const shuffled = allData.sort(() => 0.5 - Math.random());
        
        // Las primeras 4 van a la sección "Elite" (con imagen de alta calidad)
        setRareHeroes(shuffled.slice(0, 4));
        
        // Las siguientes 12 van al feed general
        setCards(shuffled.slice(4, 16));

      } catch (err) {
        console.error("Error cargando home:", err);
        showAlert("Error al sincronizar con TCGdex", "error");
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
      
      {/* FONDO GRENINJA / POKEMON */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none">
        <img 
          src="https://images.alphacoders.com/134/1341053.png" 
          className="w-full h-full object-cover scale-110 blur-[2px]" 
          alt="Background"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-slate-950/80 to-slate-950"></div>
      </div>

      {/* ALERTAS MÓVIL */}
      {alert && (
        <div className="fixed top-6 right-4 left-4 md:left-auto md:w-80 z-[200] animate-in fade-in slide-in-from-top-4 duration-300">
            <div className={`p-4 rounded-2xl border backdrop-blur-xl shadow-2xl flex items-center justify-between ${
                alert.type === 'success' ? 'bg-green-500/20 border-green-500/50' : 
                alert.type === 'error' ? 'bg-red-500/20 border-red-500/50' : 'bg-blue-600/20 border-blue-500/50'
            }`}>
                <div className="flex items-center gap-3">
                    <div className="bg-white/10 p-2 rounded-full"><Bell size={16}/></div>
                    <p className="text-xs font-black uppercase tracking-tight">{alert.msg}</p>
                </div>
                <button onClick={() => setAlert(null)}><X size={16} className="opacity-50"/></button>
            </div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="p-4 md:px-12 border-b border-white/10 flex justify-between items-center bg-slate-950/60 backdrop-blur-2xl sticky top-0 z-[100]">
        <div className="flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
          <div className="bg-blue-600 p-2 rounded-xl shadow-lg shadow-blue-500/40">
            <Shield size={18} className="text-white" />
          </div>
          <h1 className="font-black italic uppercase tracking-tighter text-lg md:text-xl">Heroes<span className="text-blue-500">Nexus</span></h1>
        </div>
        
        <div className="flex items-center gap-2">
          {user ? (
            <div className="flex items-center gap-2 bg-white/5 p-1 rounded-full border border-white/10">
              <img src={user.photoURL} alt="avatar" className="w-8 h-8 rounded-full border border-blue-500" />
              <div className="flex gap-1 pr-2">
                <button onClick={() => navigate(`/dashboard/${user.uid}`)} className="p-2 hover:bg-blue-500 rounded-full transition-all"><Layout size={16} /></button>
                <button onClick={handleLogout} className="p-2 hover:bg-red-500 rounded-full transition-all"><LogOut size={16} /></button>
              </div>
            </div>
          ) : (
            <button onClick={handleLogin} className="bg-blue-600 hover:bg-blue-500 px-6 py-2.5 rounded-full font-black text-[10px] uppercase transition-all shadow-lg">
              Conectar
            </button>
          )}
        </div>
      </nav>

      <div className="relative z-10">
        {/* HEADER */}
        <header className="max-w-7xl mx-auto px-6 py-12 md:py-20 text-center space-y-6">
          <div className="inline-flex items-center gap-2 bg-blue-500/20 border border-blue-500/30 px-4 py-1.5 rounded-full text-blue-400 text-[9px] font-black uppercase tracking-widest">
            <Zap size={12} className="fill-blue-500" /> Sincronizado con Poké-Red
          </div>
          <h2 className="text-5xl md:text-8xl font-black uppercase italic leading-[0.85] tracking-tighter">
            TU ÁLBUM, <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-blue-700">TUS REGLAS.</span>
          </h2>
          
          <div className="max-w-3xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 pt-8">
             {[
               { icon: Search, title: "Busca", desc: "Acceso total a TCGdex." },
               { icon: Star, title: "Valora", desc: "Precios en Pesos Chilenos." },
               { icon: Zap, title: "Comparte", desc: "Tu perfil es tu tienda." }
             ].map((item, i) => (
                <div key={i} className="bg-slate-900/40 p-5 rounded-3xl border border-white/5 backdrop-blur-md flex items-center gap-4 md:flex-col md:text-center">
                   <item.icon className="text-blue-500" />
                   <div>
                      <h4 className="font-black uppercase text-[10px] mb-1">{item.title}</h4>
                      <p className="text-slate-400 text-[10px]">{item.desc}</p>
                   </div>
                </div>
             ))}
          </div>
        </header>

        {/* SECCIÓN ÉPICA (CARDS GRANDES) */}
        <section className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-3">
                <div className="h-6 w-1 bg-blue-600"></div>
                <h3 className="font-black uppercase italic text-xl">Elite Rares</h3>
              </div>
              <Sparkles className="text-blue-500 animate-pulse" size={24} />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {loading ? (
                  <div className="col-span-full flex justify-center"><Loader2 className="animate-spin text-blue-500" /></div>
              ) : (
                  rareHeroes.map((card) => (
                      <div key={card.id} className="relative group active:scale-95 transition-transform duration-300">
                          <div className="absolute -inset-1 bg-gradient-to-r from-blue-600 to-indigo-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition"></div>
                          <div className="relative bg-slate-900 rounded-2xl p-2 border border-white/10 shadow-2xl">
                              <img src={`${card.image}/high.webp`} className="rounded-xl w-full" alt={card.name} />
                              <div className="p-3 text-center">
                                  <span className="bg-blue-600/20 text-blue-400 text-[8px] px-2 py-1 rounded font-black uppercase tracking-tighter">Legendary Art</span>
                                  <h5 className="font-black uppercase text-xs mt-1 truncate">{card.name}</h5>
                              </div>
                          </div>
                      </div>
                  ))
              )}
          </div>
        </section>

        {/* FEED GENERAL */}
        <main className="max-w-7xl mx-auto px-6 pb-24">
          <div className="flex items-center gap-4 mb-8">
            <h3 className="font-black uppercase tracking-[0.2em] text-[10px] text-slate-500">Global Feed</h3>
            <div className="h-[1px] flex-1 bg-gradient-to-r from-white/10 to-transparent"></div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {loading ? (
              <div className="col-span-full flex justify-center py-10"><Loader2 className="animate-spin text-blue-500" /></div>
            ) : (
              cards.map((card) => (
                <div key={card.id} className="group cursor-pointer active:scale-90 transition-transform">
                  <div className="relative overflow-hidden rounded-xl border border-white/5 bg-slate-900/50 aspect-[3/4]">
                    <img 
                        src={`${card.image}/low.webp`} 
                        alt={card.name}
                        className="w-full h-full object-cover"
                        loading="lazy"
                    />
                    <div className="absolute inset-0 bg-blue-600/20 opacity-0 group-hover:opacity-100 transition-opacity"></div>
                  </div>
                  <p className="mt-2 text-[9px] font-black uppercase text-slate-400 text-center truncate">{card.name}</p>
                </div>
              ))
            )}
          </div>
        </main>
      </div>

      {/* FOOTER */}
      <footer className="bg-slate-950 border-t border-white/10 py-12 px-6 relative z-10">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
              <div className="text-center md:text-left">
                <h4 className="font-black italic text-xl uppercase tracking-tighter">Heroes<span className="text-blue-500">Nexus</span></h4>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mt-1">Marketplace Chile</p>
              </div>
              <div className="flex gap-4">
                  <div className="text-center">
                      <p className="text-blue-500 font-black text-xl">CLP</p>
                      <p className="text-[8px] uppercase text-slate-500">Currency</p>
                  </div>
                  <div className="w-[1px] h-10 bg-white/10"></div>
                  <div className="text-center">
                      <p className="text-white font-black text-xl">V2</p>
                      <p className="text-[8px] uppercase text-slate-500">Engine</p>
                  </div>
              </div>
          </div>
      </footer>
    </div>
  );
}