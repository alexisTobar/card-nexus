import React, { useState, useEffect, useCallback } from 'react';
import { db, auth } from '../lib/firebase';
import { collection, addDoc, query, where, getDocs, deleteDoc, doc, serverTimestamp, updateDoc, getDoc, setDoc } from 'firebase/firestore';
import { Loader2, Sparkles, AlertCircle, MessageCircle, ExternalLink, ShieldAlert, Trash2 } from 'lucide-react';
import { useNavigate, useParams } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';

// IMPORTACIÓN DE COMPONENTES SEPARADOS
import AlbumTabs from '../components/dashboard/AlbumTabs';
import CardSearch from '../components/dashboard/CardSearch';
import InventoryGrid from '../components/dashboard/InventoryGrid';
import CardModal from '../components/dashboard/CardModal';

export default function Dashboard() {
  const { uid: urlUid } = useParams();
  const navigate = useNavigate();

  // ESTADOS PRINCIPALES
  const [myCards, setMyCards] = useState([]);
  const [albums, setAlbums] = useState([]);
  const [activeAlbum, setActiveAlbum] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profileUrl, setProfileUrl] = useState("");
  
  // ESTADOS DE BUSQUEDA Y UI
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState([]);
  const [isSearching, setIsSearching] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isCreatingAlbum, setIsCreatingAlbum] = useState(false);
  const [newAlbumName, setNewAlbumName] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [isSavingPhone, setIsSavingPhone] = useState(false);
  const [toast, setToast] = useState({ show: false, message: "", type: "success" });
  const [deleteConfirm, setDeleteConfirm] = useState({ show: false, id: null });
  const [selectedCard, setSelectedCard] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [cardDetails, setCardDetails] = useState({
    price: "", status: "Near Mint", language: "Inglés", quantity: 1, delivery: ""
  });

  const targetUid = urlUid || auth.currentUser?.uid;
  const isAdminView = urlUid && auth.currentUser?.uid !== urlUid;

  // 1. GESTIÓN DE AUTENTICACIÓN
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user && !urlUid) navigate('/');
    });
    return () => unsubscribe();
  }, [navigate, urlUid]);

  // 2. CARGAR COLECCIÓN
  const loadMyCollection = useCallback(async (uid, albumId) => {
    if (!uid || !albumId) return;
    setLoading(true);
    try {
      const q = query(collection(db, "userCollections"), where("uid", "==", uid), where("albumId", "==", albumId));
      const snap = await getDocs(q);
      setMyCards(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  // 3. CARGA INICIAL
  useEffect(() => {
    const initLoad = async () => {
      if (!targetUid) return;
      try {
        setLoading(true);
        const userDoc = await getDoc(doc(db, "users", targetUid));
        if (userDoc.exists()) setWhatsapp(userDoc.data().whatsapp || "");

        const q = query(collection(db, "albums"), where("uid", "==", targetUid));
        const snap = await getDocs(q);
        const albumList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setAlbums(albumList);

        if (albumList.length > 0) {
          setActiveAlbum(albumList[0]);
          loadMyCollection(targetUid, albumList[0].id);
        } else { setLoading(false); }
      } catch (err) { setLoading(false); }
    };
    initLoad();
  }, [targetUid, loadMyCollection]);

  // 4. URL COMPARTIBLE
  useEffect(() => {
    if (targetUid && activeAlbum) {
      setProfileUrl(`${window.location.origin}/perfil/${targetUid}?album=${activeAlbum.id}`);
    }
  }, [activeAlbum, targetUid]);

  // BUSQUEDA TCG
  useEffect(() => {
    const searchOfficial = async () => {
      if (isAdminView || searchQuery.length < 3) return;
      setIsSearching(true);
      try {
        const res = await fetch(`https://api.tcgdex.net/v2/es/cards?name=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        setResults(Array.isArray(data) ? data.filter(c => c.image).slice(0, 12) : []);
      } catch (err) { console.error(err); }
      setIsSearching(false);
    };
    const timer = setTimeout(searchOfficial, 600);
    return () => clearTimeout(timer);
  }, [searchQuery, isAdminView]);

  // ACCIONES
  const createAlbum = async () => {
    if (isAdminView || !newAlbumName.trim()) return;
    const docRef = await addDoc(collection(db, "albums"), {
      uid: auth.currentUser.uid, name: newAlbumName.toUpperCase(), createdAt: serverTimestamp()
    });
    const newAlbum = { id: docRef.id, name: newAlbumName.toUpperCase() };
    setAlbums([...albums, newAlbum]);
    setActiveAlbum(newAlbum);
    setIsCreatingAlbum(false);
    setNewAlbumName("");
    showToast("¡Álbum creado!");
  };

  const saveWhatsapp = async () => {
    setIsSavingPhone(true);
    await setDoc(doc(db, "users", auth.currentUser.uid), { whatsapp, uid: auth.currentUser.uid }, { merge: true });
    setIsSavingPhone(false);
    showToast("WhatsApp Guardado");
  };

  const saveCardToFirestore = async () => {
    const payload = { ...cardDetails, price: Number(cardDetails.price), updatedAt: serverTimestamp() };
    if (isEditing) {
      await updateDoc(doc(db, "userCollections", selectedCard.id), payload);
    } else {
      await addDoc(collection(db, "userCollections"), {
        ...payload, uid: auth.currentUser.uid, albumId: activeAlbum.id, name: selectedCard.name,
        image: selectedCard.image.includes('high') ? selectedCard.image : `${selectedCard.image}/high.webp`
      });
    }
    setSelectedCard(null);
    loadMyCollection(targetUid, activeAlbum.id);
    showToast("¡Guardado!");
  };

  const executeDelete = async () => {
    await deleteDoc(doc(db, "userCollections", deleteConfirm.id));
    setDeleteConfirm({ show: false, id: null });
    loadMyCollection(targetUid, activeAlbum.id);
    showToast("Eliminado", "error");
  };

  const showToast = (message, type = "success") => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: "", type: "success" }), 3000);
  };

  if (loading && !activeAlbum) return <div className="min-h-screen bg-[#020617] flex items-center justify-center"><Loader2 className="animate-spin text-yellow-500" size={48} /></div>;

  return (
    <div className="min-h-screen bg-[#020617] text-white font-sans" style={{ backgroundImage: "linear-gradient(to bottom, rgba(2, 6, 23, 0.92), rgba(2, 6, 23, 0.98)), url('https://i.postimg.cc/DZ8X3nKw/pokemon-card-pictures-7g0mrmm3f22v4c2l.jpg')", backgroundAttachment: 'fixed', backgroundSize: 'cover' }}>
      
      {isAdminView && <div className="bg-red-600 text-[10px] font-black uppercase py-2 text-center sticky top-0 z-[100] flex items-center justify-center gap-2"><ShieldAlert size={14} /> Modo Lectura</div>}

      {toast.show && <div className="fixed top-24 left-1/2 -translate-x-1/2 z-[200] bg-yellow-500 text-black px-6 py-4 rounded-2xl font-black uppercase text-xs flex items-center gap-3 shadow-2xl animate-in zoom-in">{toast.message}</div>}

      <header className="p-6 border-b border-white/5 bg-slate-950/80 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center">
        <h2 className="text-2xl font-black italic tracking-tighter cursor-pointer" onClick={() => navigate('/')}>POKE<span className="text-yellow-400">ALBUM</span></h2>
        <button onClick={() => window.open(profileUrl, '_blank')} className="bg-white/5 p-3 rounded-2xl border border-white/10 text-yellow-400 hover:bg-yellow-500 hover:text-black transition-colors"><ExternalLink size={20} /></button>
      </header>

      <main className="max-w-[1200px] mx-auto p-4 md:p-8 space-y-10">
        {!isAdminView && (
          <section className="bg-blue-900/10 border border-blue-500/30 rounded-[2rem] p-6 flex flex-col md:flex-row items-center gap-4">
            <div className="flex-1"><h4 className="font-black uppercase text-sm text-blue-400">WhatsApp de Ventas</h4></div>
            <div className="flex w-full md:w-auto gap-2">
              <input value={whatsapp} onChange={(e) => setWhatsapp(e.target.value)} className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-sm font-bold outline-none" placeholder="569..." />
              <button onClick={saveWhatsapp} className="bg-blue-600 px-6 py-3 rounded-xl font-black text-[10px] uppercase">Guardar</button>
            </div>
          </section>
        )}

        <AlbumTabs 
          albums={albums} activeAlbum={activeAlbum} setActiveAlbum={setActiveAlbum} 
          loadMyCollection={loadMyCollection} isAdminView={isAdminView} 
          setIsCreatingAlbum={setIsCreatingAlbum} isCreatingAlbum={isCreatingAlbum}
          newAlbumName={newAlbumName} setNewAlbumName={setNewAlbumName} createAlbum={createAlbum} targetUid={targetUid}
        />

        {activeAlbum && (
            <section className="bg-slate-900/80 border border-white/10 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-8">
                <div className="bg-white p-3 rounded-3xl">{profileUrl && <QRCodeSVG value={profileUrl} size={100} />}</div>
                <div className="flex-1 text-center md:text-left">
                    <span className="text-yellow-500 text-[10px] font-black uppercase">Compartir Álbum</span>
                    <h3 className="text-2xl font-black uppercase mb-4">{activeAlbum?.name}</h3>
                    <button onClick={() => { navigator.clipboard.writeText(profileUrl); showToast("Link Copiado"); }} className="bg-white text-black px-6 py-3 rounded-xl font-black text-[10px] uppercase">Copiar Link de Cliente</button>
                </div>
            </section>
        )}

        {!isAdminView && activeAlbum && (
          <CardSearch 
            searchQuery={searchQuery} setSearchQuery={setSearchQuery} 
            isSearching={isSearching} results={results} 
            setSelectedCard={setSelectedCard} setIsEditing={setIsEditing} 
          />
        )}

        <InventoryGrid 
          myCards={myCards} activeAlbum={activeAlbum} isAdminView={isAdminView} 
          setIsEditing={setIsEditing} setSelectedCard={setSelectedCard} 
          setCardDetails={setCardDetails} setDeleteConfirm={setDeleteConfirm} 
        />
      </main>

      {selectedCard && !isAdminView && (
        <CardModal 
          selectedCard={selectedCard} isEditing={isEditing} 
          cardDetails={cardDetails} setCardDetails={setCardDetails} 
          saveCardToFirestore={saveCardToFirestore} setSelectedCard={setSelectedCard} 
        />
      )}

      {deleteConfirm.show && (
        <div className="fixed inset-0 z-[200] bg-black/95 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-red-500/50 p-10 rounded-[3rem] text-center max-w-xs w-full">
            <Trash2 className="text-red-500 mx-auto mb-6" size={48} />
            <h4 className="font-black uppercase mb-6">¿Borrar carta?</h4>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm({show:false})} className="flex-1 bg-white/5 py-4 rounded-2xl font-black text-[10px]">NO</button>
              <button onClick={executeDelete} className="flex-1 bg-red-600 py-4 rounded-2xl font-black text-[10px]">SÍ, BORRAR</button>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Archivo+Black&display=swap');
        * { font-family: 'Archivo Black', sans-serif; }
      `}</style>
    </div>
  );
}