import React from 'react';
import { X, ExternalLink, Sparkles } from 'lucide-react';
import { FactResponse } from '../types';

interface InfoModalProps {
  isOpen: boolean;
  onClose: () => void;
  data: FactResponse | null;
  isLoading: boolean;
}

export const InfoModal: React.FC<InfoModalProps> = ({ isOpen, onClose, data, isLoading }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity" 
        onClick={onClose}
      />
      
      {/* 
         Updates:
         1. max-w-2xl: Wider container for better text balance.
         2. max-h-[85vh]: Constrains height to 85% of viewport to prevent full-screen takeover.
         3. overflow-y-auto: Adds internal scrolling for long text.
         4. Removed 'animate-float': Static modal is better for reading long text.
      */}
      <div className="glass-panel relative w-full max-w-2xl max-h-[85vh] overflow-y-auto rounded-2xl p-6 md:p-8 shadow-2xl border-t border-white/20 transform transition-all flex flex-col">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-white/50 hover:text-white transition-colors z-10 bg-black/20 rounded-full"
        >
          <X size={24} />
        </button>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-12 space-y-4">
            <div className="w-12 h-12 border-4 border-cyan-400 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-cyan-300 font-display tracking-widest text-sm animate-pulse">ESTABLISHING LINK...</p>
          </div>
        ) : data ? (
          <div className="space-y-6">
            <h2 className="text-3xl md:text-4xl font-display font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-purple-400 pr-10">
              {data.title}
            </h2>
            
            {/* responsive text size: base on mobile, lg on desktop */}
            <div className="prose prose-invert prose-base md:prose-lg max-w-none">
              <p className="text-gray-200 leading-relaxed">
                {data.content}
              </p>
            </div>

            <div className="bg-indigo-900/30 border border-indigo-500/30 rounded-xl p-4 flex items-start space-x-3">
              <Sparkles className="text-yellow-400 flex-shrink-0 mt-1" size={20} />
              <div>
                <h4 className="text-yellow-400 font-bold uppercase text-xs tracking-wider mb-1">Mind-Blowing Fact</h4>
                <p className="text-indigo-100 text-sm italic">
                  "{data.funFact}"
                </p>
              </div>
            </div>

            {data.groundingUrls && data.groundingUrls.length > 0 && (
              <div className="pt-4 border-t border-white/10">
                <h4 className="text-xs uppercase text-gray-500 font-bold mb-3 tracking-wider">Verified Sources</h4>
                <div className="flex flex-wrap gap-2">
                  {data.groundingUrls.map((url, idx) => (
                    <a 
                      key={idx}
                      href={url.uri}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center space-x-1 px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-full text-xs text-cyan-300 transition-colors border border-white/5 hover:border-cyan-500/50"
                    >
                      <span className="truncate max-w-[200px]">{url.title}</span>
                      <ExternalLink size={10} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-400">
            No data available.
          </div>
        )}
      </div>
    </div>
  );
};