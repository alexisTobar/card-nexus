import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Search, Plus, Trash2, Layout, Share2, Loader2, Sparkles, X, Globe, Copy, Check, ExternalLink, MapPin, Info, AlertCircle, Bell, Camera, Languages } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import Scanner from '../components/Scanner';

export default function Dashboard() {
  const [myCards, setMyCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const [showScanner, setShowScanner] = useState(false);
  const navigate = useNavigate();

  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedCard, setSelectedCard] = useState(null);
  
  // ESTADO EXTENDIDO CON IDIOMA
  const [cardDetails, setCardDetails] = useState({
    price: "",
    status: "Near Mint",
    language: "Inglés", // Valor por defecto
    delivery: "",
    description: ""
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        setProfileUrl(`${window.location.origin}/perfil/${user.uid}`);
        loadMyCollection(user.uid);
      } else {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const loadMyCollection = async (uid) => {
    setLoading(true);
    try {
      const q = query(collection(db, "userCollections"), where("uid", "==", uid));
      const snap = await getDocs(q);
      setMyCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error("Error:", err); }
    setLoading(false);
  };

  const searchOfficial = async (manualQuery = null) => {
    const queryToSearch = manualQuery || searchQuery;
    if (!queryToSearch.trim()) return;
    
    setIsSearching(true);
    try {
      const [resEs, resEn] = await Promise.all([
        fetch(`https://api.tcgdex.net/v2/es/cards?name=${encodeURIComponent(queryToSearch)}`),
        fetch(`https://api.tcgdex.net/v2/en/cards?name=${encodeURIComponent(queryToSearch)}`)
      ]);
      const dataEs = await resEs.json();
      const dataEn = await resEn.json();
      const combined = [...(Array.isArray(dataEs) ? dataEs : []), ...(Array.isArray(dataEn) ? dataEn : [])];
      
      const uniqueCards = [];
      const map = new Map();
      for (const item of combined) {
        if (!map.has(item.id) && item.image) {
          map.set(item.id, true);
          uniqueCards.push(item);
        }
      }
      setResults(uniqueCards);
      if (uniqueCards.length === 0) showToast("No se encontraron cartas", "error");
    } catch (err) { showToast("Error de conexión", "error"); }
    setIsSearching(false);
  };

  const handleScannedName = (name) => {
    setSearchQuery(name);
    setShowScanner(false);
    searchOfficial(name); // Búsqueda inmediata con el nombre detectado
  };

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const saveCardToFirestore = async () => {
    if (!cardDetails.price) {
      showToast("Ingresa un precio válido", "error");
      return;
    }

    try {
      await addDoc(collection(db, "userCollections"), {
        uid: auth.currentUser.uid,
        userName: auth.currentUser.displayName,
        name: selectedCard.name,
        image: `${selectedCard.image}/high.webp`,
        price: Number(cardDetails.price),
        status: cardDetails.status,
        language: cardDetails.language, // Guardamos el idioma
        delivery: cardDetails.delivery,
        description: cardDetails.description,
        currency: "CLP", // Forzamos CLP
        cardId: selectedCard.id,
        createdAt: serverTimestamp()
      });
      
      setSelectedCard(null);
      setCardDetails({ price: "", status: "Near Mint", language: "Inglés", delivery: "", description: "" });
      loadMyCollection(auth.currentUser.uid);
      showToast("¡Carta añadida con éxito!");
    } catch (err) { showToast("Error al guardar", "error"); }
  };

  const confirmDelete = (id) => {
    setDeleteConfirm({ show: true, id });
  };

  const executeDelete = async () => {
    try {
      await deleteDoc(doc(db, "userCollections", deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
      loadMyCollection(auth.currentUser.uid);
      showToast("Carta eliminada", "error");
    } catch (err) { showToast("Error al eliminar", "error"); }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    showToast("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  if (!auth.currentUser && loading) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center">
        <Loader2 className="animate-spin text-yellow-400" size={40} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans overflow-x-hidden selection:bg-yellow-400 selection:text-black">
      
      {showScanner && (
        <Scanner onCardFound={handleScannedName} onClose={() => setShowScanner(false)} />
      )}

      {toast.show && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-sm animate-in zoom-in duration-300">
          <div className={`${toast.type === 'success' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} px-6 py-4 rounded-2xl shadow-[0_0_30px_rgba(234,179,8,0.3)] flex items-center gap-3 border-2 border-white/20 backdrop-blur-md`}>
            {toast.type === 'success' ? <Sparkles size={18}/> : <AlertCircle size={18}/>}
            <span className="text-xs font-black uppercase tracking-tighter">{toast.message}</span>
          </div>
        </div>
      )}

      <header className="p-4 md:p-6 border-b-2 border-white/5 bg-slate-950/80 backdrop-blur-2xl sticky top-0 z-50 flex justify-between items-center shadow-2xl">
        <div className="flex items-center gap-3 cursor-pointer group" onClick={() => navigate('/')}>
          <div className="bg-gradient-to-tr from-yellow-500 to-yellow-200 p-2 rounded-lg rotate-3 group-hover:rotate-12 transition-transform">
            <Layout size={18} className="text-black" />
          </div>
          <h2 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
            NEXUS<span className="text-yellow-400 drop-shadow-[0_0_8px_rgba(250,204,21,0.6)]">HUB</span>
          </h2>
        </div>
        <button 
          onClick={() => navigate(`/perfil/${auth.currentUser?.uid}`)}
          className="bg-white/5 hover:bg-white/10 p-3 rounded-2xl border border-white/10 transition-all active:scale-90"
        >
          <Share2 size={20} className="text-yellow-400" />
        </button>
      </header>

      <main className="max-w-[1400px] mx-auto p-4 md:p-8">
        
        <section className="relative overflow-hidden bg-slate-900 border-2 border-white/10 rounded-[2.5rem] p-6 mb-10 flex flex-col md:flex-row items-center gap-6 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-500/10 blur-[60px] rounded-full" />
          <div className="bg-white p-2 rounded-2xl shadow-xl rotate-[-2deg]">
            {profileUrl && <QRCodeSVG value={profileUrl} size={100} />}
          </div>
          <div className="flex-1 text-center md:text-left z-10">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter mb-1">Mi Inventario <span className="text-yellow-400">Master</span></h3>
            <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mb-4">Link de vitrina pública para compradores</p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
              <button onClick={copyToClipboard} className="bg-yellow-500 text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2 hover:bg-yellow-400">
                {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? "Copiado" : "Copiar Enlace"}
              </button>
              <button onClick={() => window.open(profileUrl, '_blank')} className="bg-slate-800 border border-white/10 px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-2">
                <ExternalLink size={14}/> Vista Previa
              </button>
            </div>
          </div>
        </section>

        <section className="mb-14">
          <div className="flex items-center gap-4 mb-6">
            <div className="h-[2px] flex-1 bg-gradient-to-r from-transparent to-white/10" />
            <h1 className="text-sm font-black uppercase tracking-[0.4em] text-slate-500">Añadir Nueva Carta</h1>
            <div className="h-[2px] flex-1 bg-gradient-to-l from-transparent to-white/10" />
          </div>

          <div className="relative max-w-2xl mx-auto flex items-center gap-3">
            <div className="relative flex-1">
              <div className="absolute -inset-1 bg-gradient-to-r from-yellow-500 to-blue-600 rounded-[2.2rem] blur opacity-20 group-focus-within:opacity-40 transition" />
              <div className="relative">
                <input 
                  className="w-full bg-slate-900 border-2 border-white/10 rounded-[2rem] py-6 pl-14 pr-16 outline-none focus:border-yellow-500 focus:ring-4 focus:ring-yellow-500/10 font-bold transition-all shadow-2xl text-base"
                  placeholder="Nombre del Pokémon (Ej: Mewtwo, Lugia...)"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && searchOfficial()}
                />
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 text-yellow-500" size={22} />
                
                {(searchQuery || results.length > 0) && (
                  <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 bg-red-500/20 hover:bg-red-500 text-red-500 hover:text-white p-2.5 rounded-xl transition-all">
                    <X size={20} strokeWidth={3} />
                  </button>
                )}
                
                {isSearching && <Loader2 className="absolute right-16 top-1/2 -translate-y-1/2 animate-spin text-yellow-500" size={20} />}
              </div>
            </div>

            <button onClick={() => setShowScanner(true)} className="bg-yellow-500 text-black p-5 rounded-[1.8rem] hover:bg-yellow-400 active:scale-90 transition-all shadow-[0_0_20px_rgba(234,179,8,0.3)] border-2 border-white/20">
                <Camera size={24} />
            </button>
          </div>

          {results.length > 0 && (
            <div className="mt-8 animate-in slide-in-from-top-10 duration-500">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                {results.map(card => (
                  <div key={card.id} onClick={() => setSelectedCard(card)} className="relative group cursor-pointer active:scale-95 transition-all">
                    <div className="absolute -inset-1 bg-yellow-500 rounded-2xl opacity-0 group-hover:opacity-30 blur transition" />
                    <img src={`${card.image}/high.webp`} className="relative w-full rounded-xl shadow-2xl border-2 border-white/5 group-hover:border-yellow-500/50 transition-all" alt={card.name} />
                    <div className="absolute bottom-2 right-2 bg-yellow-500 text-black p-2 rounded-lg shadow-lg opacity-0 group-hover:opacity-100 translate-y-2 group-hover:translate-y-0 transition-all">
                      <Plus size={16} strokeWidth={4}/>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </section>

        <section className="pt-10 border-t-2 border-white/5">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter flex items-center gap-3">
              <div className="w-2 h-8 bg-yellow-500" /> Mi Colección
            </h3>
            <span className="text-[10px] font-black bg-white/5 border border-white/10 text-slate-300 px-4 py-2 rounded-xl uppercase tracking-widest">
              {myCards.length} SLOTS OCUPADOS
            </span>
          </div>
          
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-5">
            {myCards.map(card => (
              <div key={card.id} className="bg-slate-900/40 rounded-[2rem] border-2 border-white/5 overflow-hidden flex flex-col group hover:border-yellow-500/30 transition-all shadow-lg">
                <div className="relative aspect-[3/4] overflow-hidden">
                  <img src={card.image} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={card.name} />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent opacity-60" />
                  <button onClick={() => confirmDelete(card.id)} className="absolute top-3 right-3 bg-red-600/20 hover:bg-red-600 text-red-500 hover:text-white p-3 rounded-2xl backdrop-blur-md active:scale-75 transition-all border border-red-500/20 shadow-xl">
                    <Trash2 size={16} strokeWidth={2.5} />
                  </button>
                </div>
                <div className="p-4 space-y-2 relative">
                  <p className="text-[9px] font-black uppercase text-slate-500 tracking-widest truncate">{card.name}</p>
                  <p className="text-xl font-black italic tracking-tighter text-yellow-400">
                    ${Number(card.price).toLocaleString('es-CL')} <span className="text-[10px] not-italic text-slate-400 ml-1">CLP</span>
                  </p>
                  <div className="flex flex-wrap gap-1">
                    <span className="text-[8px] font-black text-black uppercase tracking-widest bg-yellow-500 px-2 py-1 rounded">
                      {card.status}
                    </span>
                    <span className="text-[8px] font-black text-yellow-500 uppercase tracking-widest bg-white/10 px-2 py-1 rounded border border-yellow-500/20">
                      {card.language || "Inglés"}
                    </span>
                  </div>
                  {card.delivery && (
                    <div className="flex items-center gap-1.5 text-[9px] text-slate-400 font-bold uppercase truncate pt-1 border-t border-white/5">
                      <MapPin size={12} className="text-yellow-500" /> {card.delivery}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {myCards.length === 0 && !loading && (
            <div className="text-center py-24 bg-slate-900/20 rounded-[3rem] border-4 border-dashed border-white/5">
              <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                <Search className="text-slate-700" size={32} />
              </div>
              <p className="text-slate-500 font-black uppercase text-xs tracking-[0.3em]">Tu álbum está vacío. Busca una carta arriba.</p>
            </div>
          )}
        </section>
      </main>

      {selectedCard && (
        <div className="fixed inset-0 z-[150] flex items-end md:items-center justify-center p-0 md:p-4 bg-black/95 backdrop-blur-xl animate-in fade-in duration-300">
          <div className="bg-slate-900 border-t-4 border-yellow-500 md:border-2 md:border-yellow-500 w-full max-w-lg rounded-t-[3rem] md:rounded-[3rem] p-8 md:p-10 space-y-6 animate-in slide-in-from-bottom-full duration-500 shadow-[0_-20px_60px_rgba(234,179,8,0.2)] relative max-h-[90vh] overflow-y-auto">
            
            <button onClick={() => setSelectedCard(null)} className="absolute top-6 right-6 bg-white/5 p-3 rounded-full hover:bg-red-500 transition-all"><X size={24}/></button>

            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="absolute -inset-2 bg-yellow-500/20 blur-xl rounded-full" />
                <img src={`${selectedCard.image}/high.webp`} className="relative w-24 rounded-2xl shadow-2xl border-2 border-white/10 rotate-[-3deg]" alt="" />
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none mb-2">{selectedCard.name}</h3>
                <div className="inline-block bg-yellow-500/10 text-yellow-500 text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest border border-yellow-500/20">
                  Setup de Venta
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Precio (CLP)</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 font-black text-yellow-500">$</span>
                    <input type="number" placeholder="0" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-4 pl-8 pr-4 outline-none focus:border-yellow-500 font-black text-lg transition-all"
                      value={cardDetails.price} onChange={(e) => setCardDetails({...cardDetails, price: e.target.value})} />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Estado</label>
                  <select className="w-full bg-black/40 border-2 border-white/10 rounded-2xl p-4 outline-none font-black text-sm appearance-none cursor-pointer focus:border-yellow-500 text-yellow-400" 
                    value={cardDetails.status} onChange={(e) => setCardDetails({...cardDetails, status: e.target.value})}>
                    <option>Near Mint</option>
                    <option>Mint (10)</option>
                    <option>Lightly Played</option>
                    <option>Played</option>
                    <option>Damaged</option>
                  </select>
                </div>
              </div>

              {/* SELECT DE IDIOMA AÑADIDO */}
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest flex items-center gap-2">
                  <Languages size={12}/> Idioma de la Carta
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {['Inglés', 'Español', 'Portugués', 'Japonés'].map((lang) => (
                    <button
                      key={lang}
                      onClick={() => setCardDetails({...cardDetails, language: lang})}
                      className={`py-3 rounded-xl text-[10px] font-black uppercase tracking-widest border-2 transition-all ${
                        cardDetails.language === lang 
                        ? 'bg-yellow-500 border-yellow-500 text-black' 
                        : 'bg-black/20 border-white/5 text-slate-500 hover:border-white/20'
                      }`}
                    >
                      {lang}
                    </button>
                  ))}
                </div>
              </div>

              <div className="space-y-2 text-left">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-1 tracking-widest">Entrega / Ubicación</label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-yellow-500" size={18} />
                  <input type="text" placeholder="Ej: Metro Baquedano" className="w-full bg-black/40 border-2 border-white/10 rounded-2xl py-5 pl-12 pr-4 outline-none font-bold text-sm focus:border-yellow-500"
                    value={cardDetails.delivery} onChange={(e) => setCardDetails({...cardDetails, delivery: e.target.value})} />
                </div>
              </div>

              <button onClick={saveCardToFirestore} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-6 rounded-2xl font-black uppercase tracking-[0.2em] shadow-[0_10px_30px_rgba(234,179,8,0.3)] active:scale-95 transition-all text-sm italic">
                Añadir al Deck de Ventas
              </button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[160] flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm">
          <div className="bg-slate-900 border-2 border-red-500/50 w-full max-w-xs rounded-[2.5rem] p-8 text-center space-y-6 shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in zoom-in duration-200">
            <div className="bg-red-500/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-red-500 border-2 border-red-500/20">
              <Trash2 size={32} strokeWidth={3} />
            </div>
            <div>
              <h4 className="font-black uppercase italic tracking-tighter text-2xl mb-2">¿Descartar?</h4>
              <p className="text-slate-400 text-[10px] font-bold uppercase leading-relaxed tracking-widest px-4">Esta carta será removida de tu vitrina.</p>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={() => setDeleteConfirm({show: false, id: null})} className="flex-1 bg-white/5 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest border border-white/10">Cancelar</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all shadow-lg shadow-red-600/20">Confirmar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&family=Inter:wght@400;700;900&display=swap');
        
        body { font-family: 'Inter', sans-serif; background-color: #020617; }
        h1, h2, h3, h4, button { font-family: 'Archivo Black', sans-serif; }

        input[type="number"]::-webkit-inner-spin-button, 
        input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
        
        .animate-in { animation: animateIn 0.3s ease-out forwards; }
        @keyframes animateIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}