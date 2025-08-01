
import React, { useState, useCallback } from 'react';
import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { DishList } from './components/DishList';
import { HowItWorks } from './components/HowItWorks';
import { Footer } from './components/Footer';
import { SellDishModal } from './components/SellDishModal';
import { Dish, GroundingChunk } from './types';
import { initialDishes } from './constants';
import { searchDishes } from './services/geminiService';

const GroundingReferences: React.FC<{ chunks: GroundingChunk[] }> = ({ chunks }) => {
    if (!chunks || chunks.length === 0) return null;

    return (
        <div className="bg-stone-100 border-b border-t border-stone-200">
            <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-3">
                <div className="text-sm text-slate-600">
                    <i className="fa-brands fa-google text-blue-600 mr-2"></i>
                    <span className="font-semibold">Informations de recherche fournies par Google.</span>
                    <span className="ml-2 text-slate-500">Sources:</span>
                    <span className="ml-2">
                        {chunks.map((chunk, index) => (
                            <a key={chunk.web.uri} href={chunk.web.uri} target="_blank" rel="noopener noreferrer" title={chunk.web.title} className="ml-1 text-blue-600 hover:text-orange-500 transition-colors">
                                <span className="underline">{`[${index + 1}]`}</span>
                            </a>
                        ))}
                    </span>
                </div>
            </div>
        </div>
    );
};


export default function App() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [dishes, setDishes] = useState<Dish[]>(initialDishes);
  
  // Search states
  const [isSearching, setIsSearching] = useState(false);
  const [filteredDishIds, setFilteredDishIds] = useState<number[] | null>(null);
  const [groundingChunks, setGroundingChunks] = useState<GroundingChunk[]>([]);
  const [searchError, setSearchError] = useState<string>('');

  const handleOpenModal = useCallback(() => {
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
  }, []);

  const handleAddDish = (newDish: Omit<Dish, 'id' | 'rating' | 'reviews'>) => {
    const dishToAdd: Dish = {
      id: dishes.length + 1,
      rating: (Math.random() * (5 - 4) + 4).toFixed(1),
      reviews: Math.floor(Math.random() * 50) + 1,
      ...newDish,
    };
    setDishes(prevDishes => [dishToAdd, ...prevDishes]);
    handleCloseModal();
  };

  const handleSearchSubmit = useCallback(async (query: string) => {
    if (!query) {
        setFilteredDishIds(null);
        setGroundingChunks([]);
        setSearchError('');
        return;
    }

    setIsSearching(true);
    setSearchError('');
    setGroundingChunks([]);

    try {
        const { matchedIds, groundingChunks } = await searchDishes(query, dishes);
        setFilteredDishIds(matchedIds);
        if (groundingChunks) {
            setGroundingChunks(groundingChunks);
        }
    } catch (error) {
        console.error(error);
        const errorMessage = error instanceof Error ? error.message : 'Une erreur inconnue est survenue.';
        setSearchError(`Erreur de recherche : ${errorMessage}`);
        setFilteredDishIds([]);
    } finally {
        setIsSearching(false);
    }
  }, [dishes]);


  const displayedDishes = filteredDishIds === null
    ? dishes
    : dishes.filter(dish => filteredDishIds.includes(dish.id));

  return (
    <div className="min-h-screen bg-stone-50 text-slate-800 font-sans">
      <Header onSellClick={handleOpenModal} />
      <main>
        <Hero onSearchSubmit={handleSearchSubmit} />
        <GroundingReferences chunks={groundingChunks} />
        {searchError && (
             <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center py-4">
                <p className="text-red-500">{searchError}</p>
             </div>
        )}
        <DishList dishes={displayedDishes} isSearching={isSearching} />
        <HowItWorks />
      </main>
      <Footer />
      {isModalOpen && (
        <SellDishModal onClose={handleCloseModal} onAddDish={handleAddDish} />
      )}
    </div>
  );
}