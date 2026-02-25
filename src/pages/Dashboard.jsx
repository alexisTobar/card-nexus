import React, { useState, useEffect } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Search, Plus, Trash2, Share2, Loader2, Sparkles, X, Copy, Check, ExternalLink, MapPin, AlertCircle, MessageCircle, Languages, Hash, Layers, Edit3, FolderPlus, BookOpen, AlertTriangle, Minus, ShieldAlert } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

export default function Dashboard() {
  const { uid: urlUid } = useParams(); // Capturamos el UID de la URL si existe
  const [myCards, setMyCards] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [profileUrl, setProfileUrl] = useState("");
  const navigate = useNavigate();

  // Esta variable define si estamos viendo nuestro perfil o el de alguien más (Admin Mode)
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

  // Suscripción a autenticación mejorada
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user) {
        loadAlbums(targetUid); 
        loadUserProfile(targetUid); 
      } else if (!urlUid) {
        // Si no hay usuario y no estamos viendo un perfil público, redirigir
        navigate('/');
      }
    });
    return () => unsubscribe();
  }, [navigate, targetUid, urlUid]);

  // Actualizar URL de perfil compartible
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
          image: selectedCard.image.includes('high.webp') ? selectedCard.image : `${selectedCard.image}/high.webp`,
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
    showToast("Link copiado al portapapeles");
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans bg-fixed bg-cover"
      style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.9), rgba(2, 6, 23, 0.98)), url('https://i.postimg.cc/DZ8X3nKw/pokemon-card-pictures-7g0mrmm3f22v4c2l.jpg')" }}>
      
      {/* INDICADOR DE MODO ADMIN */}
      {isAdminView && (
        <div className="bg-red-600 text-white text-[10px] font-black uppercase py-2 text-center sticky top-0 z-[100] flex items-center justify-center gap-2">
          <ShieldAlert size={14} /> Estás visualizando el perfil del usuario: {targetUid} (MODO LECTURA)
        </div>
      )}

      {toast.show && (
        <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] w-[90%] max-w-sm">
          <div className={`${toast.type === 'success' ? 'bg-yellow-500 text-black' : 'bg-red-600 text-white'} px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 shadow-2xl animate-in fade-in zoom-in duration-300`}>
            {toast.type === 'success' ? <Sparkles size={18} /> : <AlertCircle size={18} />}
            {toast.message}
          </div>
        </div>
      )}

      <header className={`p-4 md:p-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky ${isAdminView ? 'top-8' : 'top-0'} z-50 flex justify-between items-center`}>
        <h2 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>
          POKE<span className="text-yellow-400">ALBUM</span>
        </h2>
        <div className="flex gap-2">
            <button onClick={() => window.open(profileUrl, '_blank')} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors">
              <ExternalLink size={20} />
            </button>
        </div>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10">
        
        {/* WHATSAPP CONFIG (SOLO DUEÑO) */}
        {!isAdminView && (
          <section className="bg-blue-900/10 border border-blue-500/30 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1">
              <h4 className="font-black uppercase text-sm flex items-center gap-2 text-blue-400">
                <MessageCircle size={18}/> Contacto WhatsApp
              </h4>
              <p className="text-slate-400 text-[10px] uppercase tracking-widest mt-1">Tus compradores te escribirán directamente aquí</p>
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <input 
                  type="text" 
                  value={whatsapp} 
                  onChange={(e) => setWhatsapp(e.target.value)} 
                  placeholder="Ej: 56912345678" 
                  className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none focus:border-blue-500 min-w-[200px]" 
              />
              <button 
                  onClick={saveWhatsapp} 
                  disabled={isSavingPhone}
                  className="bg-blue-600 hover:bg-blue-500 px-6 py-3 rounded-xl font-black text-[10px] uppercase disabled:opacity-50 transition-all"
              >
                  {isSavingPhone ? <Loader2 className="animate-spin" size={16}/> : 'Vincular'}
              </button>
            </div>
          </section>
        )}

        {/* ALBUMS SELECTOR */}
        <section>
          <div className="flex items-center justify-between mb-6">
             <h3 className="text-xs font-black uppercase text-slate-400 flex items-center gap-2">
                <Layers size={16} className="text-yellow-500" /> Álbumes de este Usuario
             </h3>
             {!isAdminView && (
               <button onClick={() => setIsCreatingAlbum(true)} className="bg-yellow-500 hover:bg-yellow-400 text-black px-4 py-2 rounded-xl text-[10px] font-black uppercase flex items-center gap-2 transition-transform active:scale-95">
                 <Plus size={14} /> Nuevo Álbum
               </button>
             )}
          </div>
          
          <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide">
            {albums.length === 0 && !loading && (
                <div className="text-slate-600 text-[10px] uppercase font-bold p-4 border border-dashed border-white/10 rounded-2xl w-full text-center">
                    Este usuario no tiene álbumes creados.
                </div>
            )}
            {albums.map(album => (
              <button 
                key={album.id} 
                onClick={() => { setActiveAlbum(album); loadMyCollection(targetUid, album.id); }} 
                className={`flex-shrink-0 px-6 py-4 rounded-2xl border-2 font-black text-[11px] uppercase transition-all flex items-center gap-3 ${activeAlbum?.id === album.id ? "bg-yellow-500 border-yellow-400 text-black shadow-[0_0_20px_rgba(234,179,8,0.3)]" : "bg-slate-900 border-white/5 text-slate-500 hover:border-white/20"}`}
              >
                <BookOpen size={16} /> {album.name}
              </button>
            ))}
          </div>

          {isCreatingAlbum && (
            <div className="mt-4 flex gap-2 animate-in slide-in-from-top-2 duration-300">
              <input 
                autoFocus
                value={newAlbumName} 
                onChange={(e) => setNewAlbumName(e.target.value)} 
                placeholder="NOMBRE DEL ÁLBUM..." 
                className="bg-black/60 border border-yellow-500/50 rounded-xl px-4 py-2 text-xs font-bold flex-1 md:max-w-xs" 
              />
              <button onClick={createAlbum} className="bg-green-600 hover:bg-green-500 p-3 rounded-xl"><Check size={18}/></button>
              <button onClick={() => setIsCreatingAlbum(false)} className="bg-white/10 hover:bg-red-600 p-3 rounded-xl transition-colors"><X size={18}/></button>
            </div>
          )}
        </section>

        {/* SHARE PANEL */}
        {activeAlbum && (
            <section className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8 backdrop-blur-sm">
                <div className="bg-white p-3 rounded-3xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
                    {profileUrl && <QRCodeSVG value={profileUrl} size={100} level="H" />}
                </div>
                <div className="flex-1 text-center md:text-left space-y-4">
                    <div>
                        <span className="text-yellow-500 text-[10px] font-black uppercase tracking-[0.2em]">Link del Álbum</span>
                        <h3 className="text-2xl font-black uppercase mt-1">{activeAlbum?.name}</h3>
                    </div>
                    <div className="flex flex-wrap gap-3 justify-center md:justify-start">
                        <button onClick={copyToClipboard} className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase flex items-center gap-2 hover:bg-yellow-500 transition-colors">
                            {copied ? <Check size={14}/> : <Copy size={14}/>} {copied ? 'Copiado' : 'Copiar Link'}
                        </button>
                    </div>
                </div>
            </section>
        )}

        {/* SEARCH & ADD SECTION (SOLO DUEÑO) */}
        {!isAdminView && (
          <section className="space-y-6">
            <div className="relative max-w-2xl mx-auto group">
              <input 
                  disabled={!activeAlbum}
                  value={searchQuery} 
                  onChange={(e) => setSearchQuery(e.target.value)} 
                  className="w-full bg-slate-900/50 border-2 border-white/10 rounded-[2rem] py-5 pl-14 pr-14 font-bold outline-none focus:border-yellow-500 focus:bg-slate-900 transition-all disabled:opacity-50 text-sm md:text-base" 
                  placeholder={activeAlbum ? "Buscar Pokémon para añadir..." : "Crea un álbum primero para buscar"} 
              />
              <Search className={`absolute left-5 top-1/2 -translate-y-1/2 transition-colors ${searchQuery ? 'text-yellow-500' : 'text-slate-600'}`} size={24} />
              
              {searchQuery && (
                <button 
                  onClick={clearSearch}
                  className="absolute right-5 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 p-2 rounded-full transition-colors"
                >
                  <X size={18} className="text-slate-400" />
                </button>
              )}

              {isSearching && <Loader2 className="absolute right-14 top-1/2 -translate-y-1/2 animate-spin text-yellow-500" size={20} />}
            </div>

            {results.length > 0 && (
              <div className="space-y-4 animate-in fade-in duration-500">
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-white/5 rounded-[2rem] border border-white/5 shadow-inner">
                  {results.map(card => (
                    <div 
                        key={card.id} 
                        onClick={() => openAddModal(card)} 
                        className="relative cursor-pointer hover:scale-105 active:scale-95 transition-all group"
                    >
                      <img src={`${card.image}/low.webp`} className="rounded-xl border-2 border-transparent group-hover:border-yellow-500 shadow-lg" alt={card.name} />
                      <div className="absolute inset-0 bg-yellow-500/20 opacity-0 group-hover:opacity-100 rounded-xl flex items-center justify-center">
                        <Plus className="text-white drop-shadow-md" size={32} />
                      </div>
                    </div>
                  ))}
                </div>
                
                <div className="flex justify-center">
                   <button 
                    onClick={clearSearch}
                    className="bg-white/5 border border-white/10 px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600/20 hover:border-red-500/50 transition-all flex items-center gap-2 text-slate-400 hover:text-red-500"
                   >
                     <X size={14} /> Cerrar Resultados
                   </button>
                </div>
              </div>
            )}
          </section>
        )}

        {/* MY COLLECTION GRID */}
        <section className="pt-10 border-t border-white/5">
          <div className="flex items-end justify-between mb-8">
            <div>
                <h3 className="text-3xl font-black uppercase italic tracking-tighter">
                    {activeAlbum?.name || 'Colección'}
                </h3>
                <p className="text-slate-500 font-bold text-xs uppercase tracking-widest">{myCards.length} Cartas en este álbum</p>
            </div>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 text-slate-600">
                <Loader2 className="animate-spin mb-4" size={40} />
                <p className="font-black uppercase text-xs">Accediendo a la base de datos...</p>
            </div>
          ) : myCards.length > 0 ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
                {myCards.map(card => (
                <div key={card.id} className="bg-slate-900/40 border border-white/10 rounded-[1.5rem] overflow-hidden group hover:border-yellow-500/50 transition-all hover:shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
                    <div className="relative aspect-[2/3] p-2">
                    <img src={card.image} className="w-full h-full object-contain rounded-lg" alt={card.name} />
                    
                    <div className="absolute bottom-4 right-4 bg-yellow-500 text-black font-black px-3 py-1 rounded-xl text-[12px] shadow-2xl border border-black/10 z-10">
                        x{card.quantity || 1}
                    </div>

                    {!isAdminView && (
                      <div className="absolute top-4 right-4 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-2 group-hover:translate-x-0">
                          <button onClick={() => openEditModal(card)} className="bg-yellow-500 p-2.5 rounded-xl text-black shadow-xl hover:scale-110 transition-transform">
                              <Edit3 size={16} />
                          </button>
                          <button onClick={() => setDeleteConfirm({ show: true, id: card.id })} className="bg-red-600 p-2.5 rounded-xl text-white shadow-xl hover:scale-110 transition-transform">
                              <Trash2 size={16} />
                          </button>
                      </div>
                    )}
                    </div>
                    <div className="p-4 bg-slate-950/50">
                    <div className="text-xl font-black text-yellow-400 leading-none">${Number(card.price).toLocaleString('es-CL')}</div>
                    <div className="text-[9px] font-bold text-slate-500 uppercase mt-2 truncate">{card.name}</div>
                    <div className="flex gap-1 mt-1">
                        <span className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 uppercase font-bold">{card.status}</span>
                        <span className="text-[7px] bg-white/5 px-1.5 py-0.5 rounded border border-white/10 text-slate-400 uppercase font-bold">{card.language}</span>
                    </div>
                    </div>
                </div>
                ))}
            </div>
          ) : (
            <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
                <div className="bg-white/5 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <AlertTriangle className="text-slate-700" size={32} />
                </div>
                <h4 className="font-black uppercase text-slate-500">Álbum vacío</h4>
                <p className="text-slate-600 text-[10px] uppercase font-bold mt-1">Este usuario no tiene cartas en este álbum.</p>
            </div>
          )}
        </section>
      </main>

      {/* MODAL: ADD / EDIT CARD */}
      {selectedCard && !isAdminView && (
        <div className="fixed inset-0 z-[150] bg-black/90 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border-2 border-yellow-500 w-full max-w-md rounded-[2.5rem] p-8 space-y-6 shadow-[0_0_50px_rgba(234,179,8,0.2)] animate-in zoom-in duration-300">
            <div className="text-center">
                <h3 className="text-2xl font-black uppercase italic tracking-tighter">{isEditing ? 'Editar Carta' : 'Añadir Carta'}</h3>
                <p className="text-yellow-500 font-bold text-[10px] uppercase tracking-widest">{selectedCard.name}</p>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="col-span-2 bg-black/40 border border-white/10 rounded-2xl p-4">
                <label className="text-[10px] font-black uppercase text-slate-500 mb-2 block text-center">Cantidad de copias (Stock)</label>
                <div className="flex items-center justify-center gap-6">
                    <button onClick={() => setCardDetails(prev => ({...prev, quantity: Math.max(1, prev.quantity - 1)}))} className="bg-white/5 hover:bg-white/10 p-3 rounded-xl transition-colors"><Minus size={20} /></button>
                    <span className="text-3xl font-black text-white w-12 text-center">{cardDetails.quantity}</span>
                    <button onClick={() => setCardDetails(prev => ({...prev, quantity: prev.quantity + 1}))} className="bg-yellow-500 text-black p-3 rounded-xl hover:bg-yellow-400 transition-colors"><Plus size={20} /></button>
                </div>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Precio Unitario (CLP)</label>
                <input type="number" value={cardDetails.price} onChange={(e) => setCardDetails({...cardDetails, price: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 font-black text-yellow-400 text-xl outline-none focus:border-yellow-500" placeholder="0" />
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Estado</label>
                <select value={cardDetails.status} onChange={(e) => setCardDetails({...cardDetails, status: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none">
                  <option>Near Mint</option><option>Lightly Played</option><option>Played</option><option>Damaged</option>
                </select>
              </div>
              <div>
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Idioma</label>
                <select value={cardDetails.language} onChange={(e) => setCardDetails({...cardDetails, language: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none">
                  <option>Inglés</option><option>Español</option><option>Japonés</option>
                </select>
              </div>
              <div className="col-span-2">
                <label className="text-[10px] font-black uppercase text-slate-500 ml-2 mb-1 block">Método de entrega / Ciudad</label>
                <input type="text" value={cardDetails.delivery} onChange={(e) => setCardDetails({...cardDetails, delivery: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-xs font-bold outline-none" placeholder="Ej: Metro La Moneda / Envíos a todo Chile" />
              </div>
            </div>
            <div className="space-y-3 pt-2">
                <button onClick={saveCardToFirestore} className="w-full bg-yellow-500 hover:bg-yellow-400 text-black py-5 rounded-2xl font-black uppercase tracking-widest shadow-lg shadow-yellow-500/20 transition-all active:scale-95">
                    {isEditing ? 'Guardar Cambios' : 'Confirmar y Añadir'}
                </button>
                <button onClick={() => setSelectedCard(null)} className="w-full text-slate-500 hover:text-white font-bold text-[10px] uppercase tracking-widest transition-colors">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {/* DELETE MODAL */}
      {deleteConfirm.show && !isAdminView && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4 backdrop-blur-md">
          <div className="bg-slate-900 border border-red-500/50 p-10 rounded-[3rem] text-center max-w-xs w-full shadow-[0_0_50px_rgba(239,68,68,0.2)] animate-in slide-in-from-bottom-4">
            <div className="bg-red-500/10 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6">
                <Trash2 className="text-red-500" size={32} />
            </div>
            <h4 className="font-black uppercase mb-2">¿Eliminar carta?</h4>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({show:false, id:null})} className="flex-1 bg-white/5 hover:bg-white/10 py-4 rounded-2xl font-black text-[10px] uppercase transition-colors">No, volver</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 hover:bg-red-500 py-4 rounded-2xl font-black text-[10px] uppercase shadow-lg shadow-red-600/20 transition-colors">Sí, borrar</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        h1, h2, h3, h4, button, span.font-black { font-family: 'Archivo Black', sans-serif; }
        .scrollbar-hide::-webkit-scrollbar { display: none; }
        .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}