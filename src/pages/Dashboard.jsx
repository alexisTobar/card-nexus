import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Search, Plus, Trash2, Share2, Loader2, Sparkles, X, Copy, Check, ExternalLink, MapPin, AlertCircle, MessageCircle, Languages, Hash, Layers, Edit3, FolderPlus, BookOpen, AlertTriangle, Minus, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

// --- COMPONENTE DE IMAGEN OPTIMIZADA ---
const SafeImage = ({ src, alt, className }) => {
  const [loaded, setLoaded] = useState(false);
  const optimizedSrc = src?.includes('tcgdex') && !src.includes('.webp') 
    ? `${src}/low.webp` 
    : src?.replace('/high.webp', '/low.webp');

  return (
    <div className={`relative w-full h-full bg-slate-800/50 rounded-lg overflow-hidden ${!loaded ? 'animate-pulse' : ''}`}>
      <img
        src={optimizedSrc}
        alt={alt}
        loading="lazy"
        decoding="async"
        onLoad={() => setLoaded(true)}
        className={`${className} transition-opacity duration-500 ${loaded ? 'opacity-100' : 'opacity-0'}`}
      />
    </div>
  );
};

export default function Dashboard() {
  // --- TUS ESTADOS (MANTENIDOS EXACTAMENTE IGUAL) ---
  const { uid: urlUid } = useParams();
  const [myCards, setMyCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const navigate = useNavigate();
  const isAdminView = urlUid && auth.currentUser?.uid !== urlUid;
  const targetUid = urlUid || auth.currentUser?.uid;
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    price: "", status: "Near Mint", language: "Inglés", quantity: 1, delivery: "", description: ""
  });

  // --- TU LÓGICA (MANTENIDA EXACTAMENTE IGUAL) ---
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadAlbums(targetUid); 
        loadUserProfile(targetUid); 
      } else if (!urlUid) {
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, targetUid, urlUid]);

  useEffect(() => {
    if (targetUid && activeAlbum) {
      setProfileUrl(`${window.location.origin}/perfil/${targetUid}?album=${activeAlbum.id}`);
    }
  }, [activeAlbum, targetUid]);

  const loadAlbums = async (uid) => {
    if (!uid) return;
    setLoading(true);
    try {
      const q = query(collection(db, "albums"), where("uid", "==", uid));
      const snap = await getDocs(q);
      const albumList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setAlbums(albumList);
      if (albumList.length > 0) {
        setActiveAlbum(albumList[0]);
        loadMyCollection(uid, albumList[0].id);
      } else {
        setMyCards([]);
        setLoading(false);
      }
    } catch (err) { 
      console.error("Error cargando álbumes:", err);
      setLoading(false);
    }
  };

  const createAlbum = async () => {
    if (isAdminView) return;
    if (!newAlbumName.trim()) return;
    try {
      const nameUpper = newAlbumName.toUpperCase();
      const docRef = await addDoc(collection(db, "albums"), {
        uid: auth.currentUser.uid,
        name: nameUpper,
        createdAt: serverTimestamp()
      });
      const newAlbum = { id: docRef.id, name: nameUpper };
      setAlbums(prev => [...prev, newAlbum]);
      setActiveAlbum(newAlbum);
      setNewAlbumName("");
      setIsCreatingAlbum(false);
      showToast("¡Nuevo álbum creado!");
      setMyCards([]); 
    } catch (err) { showToast("Error al crear álbum", "error"); }
  };

  const loadUserProfile = async (uid) => {
    if (!uid) return;
    try {
      const userDoc = await getDoc(doc(db, "users", uid));
      if (userDoc.exists()) setWhatsapp(userDoc.data().whatsapp || "");
    } catch (err) { console.error(err); }
  };

  const saveWhatsapp = async () => {
    if (isAdminView) return;
    const cleanPhone = whatsapp.toString().replace(/\D/g, '');
    if (cleanPhone.length < 8) {
      showToast("Número inválido", "error");
      return;
    }
    setIsSavingPhone(true);
    try {
      await setDoc(doc(db, "users", auth.currentUser.uid), {
        whatsapp: cleanPhone,
        updatedAt: serverTimestamp(),
        displayName: auth.currentUser.displayName || "Entrenador",
        photoURL: auth.currentUser.photoURL || "",
        uid: auth.currentUser.uid
      }, { merge: true });
      showToast("¡WhatsApp vinculado!");
    } catch (err) { showToast("Error al vincular", "error"); }
    finally { setIsSavingPhone(false); }
  };

  const loadMyCollection = async (uid, albumId) => {
    setLoading(true);
    try {
      const q = query(
        collection(db, "userCollections"), 
        where("uid", "==", uid),
        where("albumId", "==", albumId)
      );
      const snap = await getDocs(q);
      setMyCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
    setLoading(false);
  };

  const searchOfficial = async () => {
    if (isAdminView) return; 
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    try {
      const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${encodeURIComponent(searchQuery)}`);
      const data = await res.json();
      const combined = Array.isArray(data) ? data : [];
      setResults(combined.filter(c => c.image).slice(0, 18));
    } catch (err) { 
        console.error(err);
        showToast("Error en la búsqueda", "error"); 
    }
    setIsSearching(false);
  };

  useEffect(() => {
    const timer = setTimeout(() => { 
        if (searchQuery.length >= 3) searchOfficial(); 
        else setResults([]);
    }, 800);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const clearSearch = () => {
    setSearchQuery("");
    setResults([]);
  };

  const openAddModal = (card) => {
    if (isAdminView) return;
    setIsEditing(false);
    setSelectedCard(card);
    setCardDetails({ price: "", status: "Near Mint", language: "Inglés", quantity: 1, delivery: "" });
  };

  const openEditModal = (card) => {
    if (isAdminView) return;
    setIsEditing(true);
    setSelectedCard(card);
    setCardDetails({
      price: card.price,
      status: card.status || "Near Mint",
      language: card.language || "Inglés",
      quantity: card.quantity || 1,
      delivery: card.delivery || ""
    });
  };

  const saveCardToFirestore = async () => {
    if (isAdminView) return;
    if (!activeAlbum) return showToast("Crea un álbum primero", "error");
    if (!cardDetails.price || cardDetails.price <= 0) return showToast("Ingresa un precio válido", "error");

    try {
      const cardPayload = {
        price: Number(cardDetails.price),
        status: cardDetails.status,
        language: cardDetails.language,
        quantity: Number(cardDetails.quantity) || 1,
        delivery: cardDetails.delivery,
        updatedAt: serverTimestamp()
      };

      if (isEditing) {
        await updateDoc(doc(db, "userCollections", selectedCard.id), cardPayload);
        showToast("¡Actualizada!");
      } else {
        await addDoc(collection(db, "userCollections"), {
          ...cardPayload,
          uid: auth.currentUser.uid,
          albumId: activeAlbum.id,
          userName: auth.currentUser.displayName || "Entrenador",
          name: selectedCard.name,
          image: selectedCard.image,
          currency: "CLP",
          createdAt: serverTimestamp()
        });
        showToast("¡Añadida al álbum!");
      }
      setSelectedCard(null);
      loadMyCollection(auth.currentUser.uid, activeAlbum.id);
    } catch (err) { 
        console.error(err);
        showToast("Error al guardar", "error"); 
    }
  };

  const executeDelete = async () => {
    if (isAdminView) return;
    try {
      await deleteDoc(doc(db, "userCollections", deleteConfirm.id));
      setDeleteConfirm({ show: false, id: null });
      loadMyCollection(targetUid, activeAlbum.id);
      showToast("Carta eliminada", "error");
    } catch (err) { showToast("Error al borrar", "error"); }
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(profileUrl);
    setCopied(true);
    showToast("Link copiado");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans bg-fixed bg-cover overflow-x-hidden"
      style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.94), rgba(2, 6, 23, 0.98)), url('https://i.postimg.cc/DZ8X3nKw/pokemon-card-pictures-7g0mrmm3f22v4c2l.jpg')" }}>
      
      {/* HEADER OPTIMIZADO: Sticky y compacto */}
      {isAdminView && (
        <div className="bg-red-600 text-white text-[9px] font-black uppercase py-1.5 text-center sticky top-0 z-[110] flex items-center justify-center gap-2 px-4 leading-tight">
          <ShieldAlert size={12} /> Modo Lectura: {targetUid.substring(0,8)}...
        </div>
      )}

      {/* TOAST ADAPTATIVO */}
      {toast.show && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[200] w-[92%] max-w-sm pointer-events-none">
          <div className={`${toast.type === 'success' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} px-4 py-3 rounded-2xl font-black uppercase text-[10px] flex items-center justify-center gap-3 shadow-2xl animate-in slide-in-from-top-4 duration-300`}>
            {toast.type === 'success' ? <Sparkles size={16} /> : <AlertCircle size={16} />}
            {toast.message}
          </div>
        </div>
      )}

      <header className={`p-4 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky ${isAdminView ? 'top-6' : 'top-0'} z-50 flex justify-between items-center transition-all`}>
        <h2 className="text-xl font-black italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          POKE<span className="text-yellow-400">ALBUM</span>
        </h2>
        <button onClick={() => window.open(profileUrl, '_blank')} className="bg-white/5 p-2.5 rounded-xl border border-white/10 text-yellow-400 active:scale-90 transition-all">
          <ExternalLink size={18} />
        </button>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-8">
        
        {/* WHATSAPP: Compacto en movil */}
        {!isAdminView && (
          <section className="bg-blue-900/10 border border-blue-500/20 rounded-3xl p-5 flex flex-col gap-4">
            <div>
              <h4 className="font-black uppercase text-xs flex items-center gap-2 text-blue-400">
                <MessageCircle size={16}/> Tu WhatsApp
              </h4>
              <p className="text-slate-500 text-[9px] uppercase tracking-wider mt-1">Para recibir ofertas de compradores</p>
            </div>
            <div className="flex gap-2">
              <input 
                  type="tel" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)} 
                  placeholder="Ej: 56912345678" 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 min-w-0" 
              />
              <button 
                  onClick={saveWhatsapp} 
                  disabled={isSavingPhone}
                  className="bg-blue-600 active:scale-95 px-5 py-3 rounded-xl font-black text-[10px] uppercase disabled:opacity-50 transition-all shrink-0"
              >
                  {isSavingPhone ? <Loader2 className="animate-spin" size={14}/> : 'OK'}
              </button>
            </div>
          </section>
        )}

        {/* ÁLBUMES: Scroll horizontal mejorado */}
        <section>
          <div className="flex items-center justify-between mb-4 px-1">
             <h3 className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-2">
                <Layers size={14} className="text-yellow-500" /> Mis Álbumes
             </h3>
             {!isAdminView && (
               <button onClick={() => setIsCreatingAlbum(true)} className="bg-yellow-500 text-black px-3 py-1.5 rounded-lg text-[9px] font-black uppercase flex items-center gap-1.5 active:scale-95">
                 <Plus size={12} /> Nuevo
               </button>
             )}
          </div>
          
          <div className="flex gap-2.5 overflow-x-auto pb-4 scrollbar-hide px-1 snap-x">
            {albums.map(album => (
              <button 
                key={album.id} 
                onClick={() => { setActiveAlbum(album); loadMyCollection(targetUid, album.id); }} 
                className={`flex-shrink-0 px-5 py-3.5 rounded-2xl border-2 font-black text-[10px] uppercase transition-all flex items-center gap-2 snap-start ${activeAlbum?.id === album.id ? "bg-yellow-500 border-yellow-400 text-black" : "bg-slate-900 border-white/5 text-slate-500"}`}
              >
                <BookOpen size={14} /> {album.name}
              </button>
            ))}
          </div>

          {isCreatingAlbum && (
            <div className="mt-2 flex gap-2 animate-in fade-in slide-in-from-top-2">
              <input 
                autoFocus
                value={newAlbumName} 
                onChange={(e) => setNewAlbumName(e.target.value)} 
                placeholder="NOMBRE..." 
                className="bg-black/60 border border-yellow-500/50 rounded-xl px-4 py-2 text-xs font-bold flex-1" 
              />
              <button onClick={createAlbum} className="bg-green-600 p-3 rounded-xl"><Check size={18}/></button>
              <button onClick={() => setIsCreatingAlbum(false)} className="bg-white/10 p-3 rounded-xl"><X size={18}/></button>
            </div>
          )}
        </section>

        {/* SHARE PANEL: QR responsivo */}
        {activeAlbum && (
            <section className="bg-slate-900/60 border border-white/10 rounded-[2rem] p-6 flex flex-row items-center gap-5 backdrop-blur-sm">
                <div className="bg-white p-2 rounded-2xl shrink-0">
                    {profileUrl && <QRCodeSVG value={profileUrl} size={60} level="H" />}
                </div>
                <div className="flex-1 space-y-2 min-w-0">
                    <div className="truncate">
                        <span className="text-yellow-500 text-[8px] font-black uppercase tracking-widest">Link Compartible</span>
                        <h3 className="text-lg font-black uppercase leading-none truncate">{activeAlbum?.name}</h3>
                    </div>
                    <button onClick={copyToClipboard} className="w-full bg-white text-black py-2.5 rounded-xl font-black text-[9px] uppercase flex items-center justify-center gap-2 active:bg-yellow-500 transition-colors">
                        {copied ? <Check size={12}/> : <Copy size={12}/>} {copied ? 'Copiado' : 'Copiar'}
                    </button>
                </div>
            </section>
        )}

        {/* BUSCADOR: Altura tactil y feedback */}
        {!isAdminView && (
          <section className="space-y-4">
            <div className="relative group">
              <input 
                  disabled={!activeAlbum}
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-slate-900/50 border-2 border-white/10 rounded-2xl py-4 pl-12 pr-12 font-bold outline-none focus:border-yellow-500 transition-all text-sm" 
                  placeholder={activeAlbum ? "Buscar carta..." : "Crea un álbum primero"} 
              />
              <Search className={`absolute left-4 top-1/2 -translate-y-1/2 ${searchQuery ? 'text-yellow-500' : 'text-slate-600'}`} size={20} />
              
              {searchQuery && (
                <button onClick={clearSearch} className="absolute right-4 top-1/2 -translate-y-1/2 bg-white/10 p-1.5 rounded-full">
                  <X size={14} className="text-slate-400" />
                </button>
              )}
            </div>

            {results.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 p-3 bg-white/5 rounded-2xl border border-white/5">
                  {results.map(card => (
                    <div key={card.id} onClick={() => openAddModal(card)} className="relative active:scale-95 transition-all aspect-[2/3]">
                      <SafeImage src={card.image} alt={card.name} className="rounded-lg shadow-md object-contain w-full h-full" />
                      <div className="absolute inset-0 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                        <Plus className="text-white drop-shadow-md" size={24} />
                      </div>
                    </div>
                  ))}
                </div>
                <button onClick={clearSearch} className="w-full py-3 text-[9px] font-black uppercase text-slate-500 border border-white/5 rounded-xl">Cerrar resultados</button>
              </div>
            )}
          </section>
        )}

        {/* MI COLECCIÓN: Grid de 2 columnas en movil */}
        <section className="pt-6 border-t border-white/5">
          <div className="mb-6 px-1">
            <h3 className="text-2xl font-black uppercase italic tracking-tighter leading-none">
              {activeAlbum?.name || 'Álbum'}
            </h3>
            <p className="text-slate-500 font-bold text-[9px] uppercase tracking-widest mt-1">{myCards.length} cartas guardadas</p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center py-20 text-slate-600">
                <Loader2 className="animate-spin mb-3" size={30} />
                <p className="font-black uppercase text-[9px]">Cargando...</p>
            </div>
          ) : myCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-6">
                {myCards.map(card => (
                <div key={card.id} className="bg-slate-900/40 border border-white/10 rounded-2xl overflow-hidden flex flex-col">
                    <div className="relative aspect-[2/3] p-1.5">
                      <SafeImage src={card.image} alt={card.name} className="w-full h-full object-contain rounded-lg" />
                      <div className="absolute bottom-3 right-3 bg-yellow-500 text-black font-black px-2 py-0.5 rounded-lg text-[10px] shadow-xl z-10 border border-black/10">
                          x{card.quantity || 1}
                      </div>

                      {!isAdminView && (
                        <div className="absolute top-3 right-3 flex flex-col gap-1.5">
                            <button onClick={() => openEditModal(card)} className="bg-yellow-500 p-2 rounded-lg text-black shadow-lg active:scale-90">
                                <Edit3 size={14} />
                            </button>
                            <button onClick={() => setDeleteConfirm({ show: true, id: card.id })} className="bg-red-600 p-2 rounded-lg text-white shadow-lg active:scale-90">
                                <Trash2 size={14} />
                            </button>
                        </div>
                      )}
                    </div>
                    <div className="p-3 bg-slate-950/50 flex-1 flex flex-col justify-between">
                      <div className="text-sm font-black text-yellow-400">${Number(card.price).toLocaleString('es-CL')}</div>
                      <div className="text-[8px] font-bold text-slate-500 uppercase mt-1 truncate">{card.name}</div>
                      <div className="flex gap-1 mt-1.5 overflow-hidden">
                          <span className="text-[6px] bg-white/5 px-1 py-0.5 rounded text-slate-400 uppercase font-black whitespace-nowrap">{card.status}</span>
                      </div>
                    </div>
                </div>
                ))}
            </div>
          ) : (
            <div className="py-16 text-center border-2 border-dashed border-white/5 rounded-[2rem] px-6">
                <AlertTriangle className="text-slate-800 mx-auto mb-3" size={30} />
                <h4 className="font-black uppercase text-slate-600 text-[10px]">Sin cartas aún</h4>
            </div>
          )}
        </section>
      </main>

      {/* MODAL EDICION: Scroll interno y botones grandes */}
      {selectedCard && !isAdminView && (
        <div className="fixed inset-0 z-[150] bg-black/95 flex items-end sm:items-center justify-center p-0 sm:p-4">
          <div className="bg-slate-900 border-t-2 sm:border-2 border-yellow-500 w-full max-w-md rounded-t-[2rem] sm:rounded-[2.5rem] p-6 space-y-5 shadow-2xl animate-in slide-in-from-bottom-10 duration-300 max-h-[90vh] overflow-y-auto">
            <div className="text-center sticky top-0 bg-slate-900 pb-2 z-10">
                <div className="w-12 h-1 bg-white/10 rounded-full mx-auto mb-4 sm:hidden" />
                <h3 className="text-xl font-black uppercase italic">{isEditing ? 'Editar Carta' : 'Añadir Carta'}</h3>
                <p className="text-yellow-500 font-bold text-[9px] uppercase tracking-widest">{selectedCard.name}</p>
            </div>
            
            <div className="space-y-4 pb-4">
              <div className="bg-black/40 border border-white/10 rounded-2xl p-4">
                <label className="text-[9px] font-black uppercase text-slate-500 mb-2 block text-center">Stock disponible</label>
                <div className="flex items-center justify-center gap-8">
                    <button onClick={() => setCardDetails(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))} className="bg-white/5 p-4 rounded-xl active:bg-white/10"><Minus size={20} /></button>
                    <span className="text-3xl font-black text-white w-10 text-center">{cardDetails.quantity}</span>
                    <button onClick={() => setCardDetails(prev => ({...prev, quantity: prev.quantity + 1}))} className="bg-yellow-500 text-black p-4 rounded-xl active:scale-95"><Plus size={20} /></button>
                </div>
              </div>

              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2 mb-1 block">Precio Unitario (CLP)</label>
                  <input type="number" inputMode="numeric" value={cardDetails.price} onChange={(e) => setCardDetails({...cardDetails, price: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 font-black text-yellow-400 text-xl outline-none" placeholder="0" />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2 mb-1 block">Estado</label>
                    <select value={cardDetails.status} onChange={(e) => setCardDetails({...cardDetails, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-[10px] font-bold outline-none appearance-none">
                      <option>Near Mint</option><option>Lightly Played</option><option>Played</option><option>Damaged</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[9px] font-black uppercase text-slate-500 ml-2 mb-1 block">Idioma</label>
                    <select value={cardDetails.language} onChange={(e) => setCardDetails({...cardDetails, language: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-3.5 text-[10px] font-bold outline-none appearance-none">
                      <option>Inglés</option><option>Español</option><option>Japonés</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[9px] font-black uppercase text-slate-500 ml-2 mb-1 block">Entrega / Ciudad</label>
                  <input type="text" value={cardDetails.delivery} onChange={(e) => setCardDetails({...cardDetails, delivery: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl p-4 text-xs font-bold outline-none" placeholder="Ej: Santiago / Metro" />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-2">
                <button onClick={saveCardToFirestore} className="w-full bg-yellow-500 text-black py-4.5 rounded-2xl font-black uppercase text-xs tracking-widest active:scale-95 transition-all">
                    {isEditing ? 'Guardar Cambios' : 'Confirmar'}
                </button>
                <button onClick={() => setSelectedCard(null)} className="w-full text-slate-500 py-2 font-black text-[9px] uppercase">Cerrar</button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMAR BORRADO: Minimalista movil */}
      {deleteConfirm.show && !isAdminView && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-6 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/30 p-8 rounded-[2rem] text-center w-full max-w-xs animate-in zoom-in">
            <Trash2 className="text-red-500 mx-auto mb-4" size={32} />
            <h4 className="font-black uppercase text-sm mb-6">¿Eliminar carta?</h4>
            <div className="flex flex-col gap-2">
              <button onClick={executeDelete} className="bg-red-600 py-4 rounded-xl font-black text-[10px] uppercase">Sí, borrar</button>
              <button onClick={() => setDeleteConfirm({show:false, id:null})} className="bg-white/5 py-3 rounded-xl font-black text-[10px] text-slate-500 uppercase">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, h4, button, span.font-black { font-family: 'Archivo Black', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
        input[type="number"]::-webkit-inner-spin-button, input[type="number"]::-webkit-outer-spin-button { -webkit-appearance: none; margin: 0; }
      `}</style>
    </div>
  );
}