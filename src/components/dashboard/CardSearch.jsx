import React from 'react';
import { Search, Loader2, Plus } from 'lucide-react';

export default function CardSearch({ searchQuery, setSearchQuery, isSearching, results, setSelectedCard, setIsEditing }) {
  return (
    <section className="space-y-6">
      <div className="relative max-w-2xl mx-auto">
        <input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} 
          className="w-full bg-slate-900 border-2 border-white/10 rounded-[2rem] py-5 px-14 font-bold outline-none focus:border-yellow-500 text-white" 
          placeholder="Buscar Pokémon para añadir..." />
        <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-600" size={24} />
        {isSearching && <Loader2 className="absolute right-5 top-1/2 -translate-y-1/2 animate-spin text-yellow-500" size={20} />}
      </div>

      {results.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3 p-4 bg-white/5 rounded-[2rem]">
          {results.map(card => (
            <div key={card.id} onClick={() => { setIsEditing(false); setSelectedCard(card); }} className="cursor-pointer hover:scale-105 transition-all relative group">
              <img src={`${card.image}/low.webp`} className="rounded-xl border-2 border-transparent group-hover:border-yellow-500" alt={card.name} />
              <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 bg-black/40 rounded-xl">
                <Plus className="text-white" size={32} />
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}