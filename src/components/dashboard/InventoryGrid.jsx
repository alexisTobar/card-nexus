import React from 'react';
import { Edit3, Trash2, AlertTriangle } from 'lucide-react';

export default function InventoryGrid({ myCards, activeAlbum, isAdminView, setIsEditing, setSelectedCard, setCardDetails, setDeleteConfirm }) {
  return (
    <section className="pt-10 border-t border-white/5">
      <h3 className="text-3xl font-black uppercase italic tracking-tighter mb-8 text-white">
        {activeAlbum?.name || 'Inventario'}
        <span className="block text-slate-500 text-xs not-italic font-bold tracking-widest mt-2">{myCards.length} Cartas encontradas</span>
      </h3>

      {myCards.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-6">
          {myCards.map(card => (
            <div key={card.id} className="bg-slate-900/60 border border-white/10 rounded-[1.5rem] overflow-hidden group hover:border-yellow-500 transition-all">
              <div className="relative aspect-[2/3] p-2">
                <img src={card.image} className="w-full h-full object-contain" alt={card.name} />
                <div className="absolute bottom-4 right-4 bg-yellow-500 text-black font-black px-2 py-1 rounded-lg text-[10px]">x{card.quantity}</div>
                
                {!isAdminView && (
                  <div className="absolute top-2 right-2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all">
                    <button onClick={() => { setIsEditing(true); setSelectedCard(card); setCardDetails(card); }} className="bg-yellow-500 p-2 rounded-lg text-black"><Edit3 size={14} /></button>
                    <button onClick={() => setDeleteConfirm({ show: true, id: card.id })} className="bg-red-600 p-2 rounded-lg text-white"><Trash2 size={14} /></button>
                  </div>
                )}
              </div>
              <div className="p-4 bg-black/40">
                <div className="text-lg font-black text-yellow-400">${Number(card.price).toLocaleString('es-CL')}</div>
                <div className="text-[8px] font-bold text-slate-500 uppercase mt-1 truncate">{card.name}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="py-20 text-center border-2 border-dashed border-white/5 rounded-[3rem]">
          <AlertTriangle className="text-slate-800 mx-auto mb-4" size={48} />
          <p className="font-black uppercase text-slate-600">No hay cartas en este álbum</p>
        </div>
      )}
    </section>
  );
}