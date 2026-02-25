import React from 'react';
import { Search, Loader2, Plus, LayoutGrid } from 'lucide-react';

export default function CardSearch({ searchQuery, setSearchQuery, isSearching, results, setSelectedCard, setIsEditing }) {
  return (
    <section className="space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <input 
          value={searchQuery} 
          onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full bg-slate-900 border-2 border-white/10 rounded-[2rem] py-5 px-14 font-bold outline-none focus:border-yellow-500 text-white transition-all focus:ring-4 focus:ring-yellow-500/20" 
          placeholder="Ej: Charizard, Pikachu, Mewtwo..." 
        />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={24} />
        
        {isSearching && (
          <div className="absolute right-5 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <span className="text-[10px] font-black text-yellow-500 animate-pulse">BUSCANDO...</span>
            <Loader2 className="animate-spin text-yellow-500" size={20} />
          </div>
        )}
      </div>

      {results.length > 0 ? (
        <div className="space-y-4">
          <div className="flex items-center gap-2 px-4">
            <LayoutGrid size={16} className="text-yellow-500" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">
              Se encontraron {results.length} versiones diferentes
            </span>
          </div>
          
          <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-4 p-6 bg-slate-900/50 rounded-[2.5rem] border border-white/5 backdrop-blur-sm">
            {results.map(card => (
              <div 
                key={card.id} 
                onClick={() => { setIsEditing(false); setSelectedCard(card); }} 
                className="cursor-pointer hover:scale-110 active:scale-95 transition-all relative group"
              >
                <div className="absolute -inset-1 bg-yellow-500 rounded-2xl blur opacity-0 group-hover:opacity-20 transition-opacity"></div>
                <img 
                  src={card.images?.small || card.image} 
                  className="relative rounded-xl border-2 border-transparent group-hover:border-yellow-500 shadow-lg" 
                  alt={card.name} 
                  loading="lazy"
                />
                <div className="absolute inset-0 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 bg-black/60 rounded-xl transition-opacity">
                  <Plus className="text-yellow-400 mb-1" size={28} />
                  <span className="text-[8px] font-black text-white uppercase">Añadir</span>
                </div>
                {/* Badge de Expansión (opcional) */}
                <div className="absolute bottom-1 right-1 bg-black/80 px-1.5 py-0.5 rounded text-[7px] font-bold text-slate-300 opacity-0 group-hover:opacity-100">
                  {card.set?.name || 'Promo'}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : searchQuery.length > 2 && !isSearching && (
        <div className="text-center py-10 bg-white/5 rounded-[2rem] border-2 border-dashed border-white/10">
          <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">No hay más cartas de "{searchQuery}"</p>
          <p className="text-[10px] text-slate-600 mt-2">Intenta con otro nombre o revisa la ortografía</p>
        </div>
      )}
    </section>
  );
}