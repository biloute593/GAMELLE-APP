import React from 'react';

interface HeaderProps {
  onSellClick: () => void;
}

const ForkSpoonIcon: React.FC<{ className?: string }> = ({ className }) => (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor">
        <path d="M16 2H8C4.691 2 2 4.691 2 8v13h2V8c0-2.206 1.794-4 4-4h8c2.206 0 4 1.794 4 4v13h2V8c0-3.309-2.691-6-6-6z"></path><path d="M12 21c-1.103 0-2-.897-2-2v-8c0-1.103.897-2 2-2s2 .897 2 2v8c0 1.103-.897 2-2 2z"></path>
    </svg>
);


export const Header: React.FC<HeaderProps> = ({ onSellClick }) => {
  return (
    <header className="bg-white/80 backdrop-blur-lg sticky top-0 z-40 shadow-sm">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          <div className="flex items-center space-x-3">
            <ForkSpoonIcon className="h-8 w-8 text-orange-500" />
            <a href="#" className="text-3xl font-bold text-slate-800 tracking-tighter">
              Gamelle
            </a>
          </div>
          <div className="flex items-center space-x-6">
            <nav className="hidden md:flex space-x-8">
              <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors duration-200">Découvrir</a>
              <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors duration-200">Comment ça marche ?</a>
              <a href="#" className="text-gray-600 hover:text-orange-500 transition-colors duration-200">Blog</a>
            </nav>
            <button
              onClick={onSellClick}
              className="bg-orange-500 hover:bg-orange-600 text-white font-semibold px-5 py-3 rounded-full shadow-md hover:shadow-lg transition-all duration-300 transform hover:-translate-y-0.5"
            >
              Vendre un plat
            </button>
          </div>
        </div>
      </div>
    </header>
  );
};