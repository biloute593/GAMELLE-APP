import React, { useState, useCallback } from 'react';
import { generateDishIdeas } from '../services/geminiService';
import { Dish, GeneratedIdea } from '../types';

interface SellDishModalProps {
  onClose: () => void;
  onAddDish: (dish: Omit<Dish, 'id' | 'rating' | 'reviews'>) => void;
}

const LoadingSpinner: React.FC = () => (
    <div className="flex justify-center items-center space-x-2">
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse [animation-delay:-0.3s]"></div>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse [animation-delay:-0.15s]"></div>
        <div className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
    </div>
);


export const SellDishModal: React.FC<SellDishModalProps> = ({ onClose, onAddDish }) => {
  const [ingredients, setIngredients] = useState('');
  const [cuisineType, setCuisineType] = useState('');
  const [generatedIdeas, setGeneratedIdeas] = useState<GeneratedIdea[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');

  const [dishName, setDishName] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [cookName, setCookName] = useState('');


  const handleGenerateIdeas = useCallback(async () => {
    if (!ingredients || !cuisineType) {
      setError('Veuillez renseigner les ingrédients principaux et le type de cuisine.');
      return;
    }
    setError('');
    setIsGenerating(true);
    setGeneratedIdeas([]);
    try {
      const ideas = await generateDishIdeas(ingredients, cuisineType);
      setGeneratedIdeas(ideas.suggestions);
    } catch (err) {
      setError('Une erreur est survenue lors de la génération des idées. Veuillez réessayer.');
      console.error(err);
    } finally {
      setIsGenerating(false);
    }
  }, [ingredients, cuisineType]);
  
  const handleSelectIdea = (idea: GeneratedIdea) => {
    setDishName(idea.nom_plat);
    setDescription(idea.description_plat);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!dishName || !description || !price || !cookName) {
        setError("Veuillez remplir tous les champs avant de publier.");
        return;
    }
    onAddDish({
        name: dishName,
        description,
        price: parseFloat(price),
        cuisine: cuisineType,
        cook: { name: cookName, avatarUrl: `https://i.pravatar.cc/150?u=${cookName.replace(/\s/g, '')}` },
        imageUrl: `https://source.unsplash.com/400x300/?${encodeURIComponent(dishName.split(' ').join(','))},food`
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
        <div className="p-8">
            <div className="flex justify-between items-start">
                 <h2 className="text-3xl font-bold text-slate-800 mb-2">Vendez votre création</h2>
                 <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
                    <i className="fa-solid fa-xmark text-2xl"></i>
                 </button>
            </div>
            <p className="text-gray-600 mb-8">Remplissez ce formulaire et laissez notre IA vous aider à trouver le nom parfait !</p>
            
            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                {/* Left Column: Idea Generation */}
                <div className="space-y-6 p-6 bg-stone-50 rounded-lg">
                     <div>
                        <label htmlFor="ingredients" className="block text-sm font-medium text-gray-700 mb-1">Ingrédients principaux</label>
                        <input type="text" id="ingredients" value={ingredients} onChange={e => setIngredients(e.target.value)} placeholder="Ex: poulet, crème, champignons" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                    <div>
                        <label htmlFor="cuisineType" className="block text-sm font-medium text-gray-700 mb-1">Type de cuisine</label>
                        <input type="text" id="cuisineType" value={cuisineType} onChange={e => setCuisineType(e.target.value)} placeholder="Ex: Française, Italienne" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                     <button type="button" onClick={handleGenerateIdeas} disabled={isGenerating} className="w-full bg-slate-800 hover:bg-slate-900 text-white font-semibold py-3 rounded-md shadow-sm transition-colors disabled:bg-slate-400 flex items-center justify-center">
                        {isGenerating ? <LoadingSpinner /> : <><i className="fa-solid fa-wand-magic-sparkles mr-2"></i> Générer des idées</> }
                     </button>
                     {error && <p className="text-red-500 text-sm">{error}</p>}

                     <div className="space-y-3 pt-4">
                        {generatedIdeas.map((idea, index) => (
                           <div key={index} onClick={() => handleSelectIdea(idea)} className="p-4 border border-gray-200 rounded-lg hover:border-orange-400 hover:bg-orange-50 cursor-pointer transition-all">
                                <h4 className="font-bold text-slate-800">{idea.nom_plat}</h4>
                                <p className="text-sm text-gray-600 mt-1">{idea.description_plat}</p>
                           </div>
                        ))}
                     </div>
                </div>

                {/* Right Column: Final Form */}
                <div className="space-y-6 p-6">
                    <h3 className="text-xl font-bold text-slate-700 border-b pb-2">Détails de votre plat</h3>
                    <div>
                        <label htmlFor="dishName" className="block text-sm font-medium text-gray-700 mb-1">Nom du plat</label>
                        <input type="text" id="dishName" value={dishName} onChange={e => setDishName(e.target.value)} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                    </div>
                     <div>
                        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                        <textarea id="description" value={description} onChange={e => setDescription(e.target.value)} rows={4} required className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500"></textarea>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="price" className="block text-sm font-medium text-gray-700 mb-1">Prix (€)</label>
                            <input type="number" id="price" value={price} onChange={e => setPrice(e.target.value)} required placeholder="15.00" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                        </div>
                        <div>
                            <label htmlFor="cookName" className="block text-sm font-medium text-gray-700 mb-1">Votre nom de Chef</label>
                            <input type="text" id="cookName" value={cookName} onChange={e => setCookName(e.target.value)} required placeholder="Chef Antoine" className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-orange-500 focus:border-orange-500" />
                        </div>
                    </div>
                    <button type="submit" className="w-full bg-orange-500 hover:bg-orange-600 text-white font-bold py-3 px-6 rounded-md shadow-lg transition-all transform hover:scale-105">
                        <i className="fa-solid fa-rocket mr-2"></i>
                        Publier mon plat
                    </button>
                </div>
            </form>
        </div>
      </div>
    </div>
  );
};