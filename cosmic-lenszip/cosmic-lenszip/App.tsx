import React, { useState, useEffect, useCallback } from 'react';
import { SpaceObject } from './components/SpaceObject';
import { InfoModal } from './components/InfoModal';
import { SpaceObjectData, FactResponse } from './types';
import { getObjectFact, searchPhenomena, hasValidKey, saveApiKey, clearApiKey } from './services/gemini';
import { audio } from './services/audio';
import { Search, ZoomIn, ZoomOut, Volume2, VolumeX, Settings, Database, AlertTriangle, Key, Save, Trash2, ExternalLink, Zap } from 'lucide-react';

// Unique name pools for each object type
const STAR_NAMES = ['Distant Star', 'Betelgeuse', 'Sirius', 'Proxima Centauri', 'Vega', 'Polaris', 'Rigel', 'Aldebaran', 'Antares', 'Canopus'];
const PLANET_NAMES = ['Exoplanet', 'Kepler-22b', 'TRAPPIST-1e', 'Gliese 581g', 'HD 209458 b', 'Proxima Centauri b', 'Kepler-452b', 'WASP-121b'];
const NEBULA_NAMES = ['Nebula Cloud', 'Crab Nebula', 'Orion Nebula', 'Helix Nebula', 'Ring Nebula', 'Horsehead Nebula'];
const BLACK_HOLE_NAMES = ['Singularity', 'Sagittarius A*', 'M87*', 'Cygnus X-1', 'V404 Cygni'];
const ANOMALY_NAMES = ['Cosmic Anomaly', "Tabby's Star", 'Fast Radio Burst', 'Gamma-Ray Burst', 'Oumuamua'];

// Procedurally generate some space objects with even distribution
const generateSpaceObjects = (_count: number): SpaceObjectData[] => {
  const objects: SpaceObjectData[] = [];
  const types: SpaceObjectData['type'][] = ['STAR', 'PLANET', 'NEBULA', 'ANOMALY', 'BLACK_HOLE'];
  
  const cols = 8;
  const rows = 5;
  const cellWidth = 100 / cols;
  const cellHeight = 100 / rows;
  
  let idCounter = 0;
  
  // Track used names to avoid duplicates
  const usedNames: Record<string, number> = {
    STAR: 0,
    PLANET: 0,
    NEBULA: 0,
    BLACK_HOLE: 0,
    ANOMALY: 0
  };

  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (Math.random() > 0.9) continue;

      const type = types[Math.floor(Math.random() * types.length)];
      const paddingX = cellWidth * 0.15;
      const paddingY = cellHeight * 0.15;
      
      const x = (c * cellWidth) + paddingX + Math.random() * (cellWidth - 2 * paddingX);
      const y = (r * cellHeight) + paddingY + Math.random() * (cellHeight - 2 * paddingY);
      
      let size = 2;
      let color = '#fff';
      let name = 'Unknown';

      if (type === 'STAR') {
        size = 2 + Math.random() * 4;
        const colors = ['#fff', '#A5F2F3', '#FFEBAE', '#FFD1D1'];
        color = colors[Math.floor(Math.random() * colors.length)];
        const nameIndex = usedNames.STAR % STAR_NAMES.length;
        name = STAR_NAMES[nameIndex];
        usedNames.STAR++;
      } else if (type === 'PLANET') {
        size = 8 + Math.random() * 12;
        const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#D4A5A5'];
        color = colors[Math.floor(Math.random() * colors.length)];
        const nameIndex = usedNames.PLANET % PLANET_NAMES.length;
        name = PLANET_NAMES[nameIndex];
        usedNames.PLANET++;
      } else if (type === 'NEBULA') {
        size = 20 + Math.random() * 30;
        const colors = ['#FF00FF', '#00FFFF', '#7B68EE'];
        color = colors[Math.floor(Math.random() * colors.length)];
        const nameIndex = usedNames.NEBULA % NEBULA_NAMES.length;
        name = NEBULA_NAMES[nameIndex];
        usedNames.NEBULA++;
      } else if (type === 'BLACK_HOLE') {
        size = 15;
        color = '#000';
        const nameIndex = usedNames.BLACK_HOLE % BLACK_HOLE_NAMES.length;
        name = BLACK_HOLE_NAMES[nameIndex];
        usedNames.BLACK_HOLE++;
      } else {
        size = 10;
        color = '#00FF00';
        const nameIndex = usedNames.ANOMALY % ANOMALY_NAMES.length;
        name = ANOMALY_NAMES[nameIndex];
        usedNames.ANOMALY++;
      }

      objects.push({
        id: `obj-${idCounter++}`,
        type,
        x,
        y,
        size,
        color,
        name
      });
    }
  }
  return objects;
};

const SUGGESTIONS = [
  "Boötes Void",
  "Encke Gap",
  "Magnetar",
  "Oort Cloud",
  "Diamond Planet",
  "Pillars of Creation"
];

const App: React.FC = () => {
  const [objects, setObjects] = useState<SpaceObjectData[]>([]);
  const [selectedFact, setSelectedFact] = useState<FactResponse | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoomLevel, setZoomLevel] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [audioInitialized, setAudioInitialized] = useState(false);
  const [inputKey, setInputKey] = useState('');
  
  // Use a state for key validity so UI updates immediately upon interaction
  const [keyValid, setKeyValid] = useState(hasValidKey());

  const MIN_ZOOM = 0.5;
  const MAX_ZOOM = 4;

  useEffect(() => {
    setObjects(generateSpaceObjects(40));
    // If no key is detected on startup, open settings automatically to guide the user
    if (!hasValidKey()) {
      setTimeout(() => setIsSettingsOpen(true), 1000);
    }
  }, []);

  const handleInteraction = useCallback(() => {
    if (!audioInitialized) {
      audio.init();
      setAudioInitialized(true);
    }
  }, [audioInitialized]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 20;
    const y = (e.clientY / window.innerHeight - 0.5) * 20;
    setViewOffset({ x, y });
  }, []);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    if (isModalOpen || isSettingsOpen) return;
    handleInteraction();
    
    setZoomLevel(prev => {
      const delta = -e.deltaY * 0.001;
      const newZoom = Math.min(Math.max(prev + delta, MIN_ZOOM), MAX_ZOOM);
      if (Math.abs(newZoom - prev) > 0.01) {
          audio.playZoom();
      }
      return newZoom;
    });
  }, [isModalOpen, isSettingsOpen, handleInteraction]);

  const adjustZoom = (amount: number) => {
    handleInteraction();
    setZoomLevel(prev => {
        const next = Math.min(Math.max(prev + amount, MIN_ZOOM), MAX_ZOOM);
        if (next !== prev) audio.playZoom();
        return next;
    });
  };

  const toggleMute = (e: React.MouseEvent) => {
      e.stopPropagation();
      handleInteraction();
      const muted = audio.toggleMute();
      setIsMuted(muted);
  };

  const handleObjectClick = async (obj: SpaceObjectData) => {
    handleInteraction();
    audio.playClick();
    setIsModalOpen(true);
    setIsLoading(true);
    setSelectedFact(null);

    const fact = await getObjectFact(obj.type, obj.name);
    setSelectedFact(fact);
    setIsLoading(false);
  };

  const handleSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!searchQuery.trim()) return;
    
    handleInteraction();
    audio.playSearch();

    setIsModalOpen(true);
    setIsLoading(true);
    setSelectedFact(null);

    const result = await searchPhenomena(searchQuery);
    setSelectedFact(result);
    setIsLoading(false);
    setSearchQuery('');
  };

  const handleSaveKey = () => {
      if (inputKey.trim().length > 10) {
          saveApiKey(inputKey.trim());
          setKeyValid(true);
          setInputKey('');
      }
  };

  const handleClearKey = () => {
      clearApiKey();
      setKeyValid(false);
  };

  return (
    <div 
      className="relative w-full h-screen bg-slate-950 overflow-hidden"
      onMouseMove={handleMouseMove}
      onWheel={handleWheel}
      onClick={handleInteraction}
    >
      <style>{`
        @keyframes galaxy-spin {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to { transform: translate(-50%, -50%) rotate(360deg); }
        }
        @keyframes nebula-drift {
          0%, 100% { transform: translate(0, 0) scale(1); opacity: 0.15; }
          50% { transform: translate(-30px, -50px) scale(1.1); opacity: 0.25; }
        }
      `}</style>

      {/* --- BACKGROUND LAYERS --- */}
      
      {/* 1. Deep Void Base */}
      <div className="absolute inset-0 z-0 pointer-events-none bg-[#020204]" />

      {/* 2. Rotating Galactic Spiral (Conic Gradient) */}
      <div 
        className="absolute top-1/2 left-1/2 w-[180vw] h-[180vw] z-0 pointer-events-none opacity-20"
        style={{
            background: 'conic-gradient(from 0deg, transparent 0deg, #1e1b4b 60deg, transparent 120deg, #312e81 240deg, transparent 360deg)',
            animation: 'galaxy-spin 240s linear infinite',
            filter: 'blur(80px)',
        }}
      />

      {/* 3. Drifting Nebula Clouds */}
      <div className="absolute inset-0 z-0 pointer-events-none mix-blend-screen overflow-hidden">
          {/* Purple Cloud */}
          <div 
            className="absolute top-[20%] left-[20%] w-[50vw] h-[50vw] rounded-full bg-purple-900/30 blur-[120px]"
            style={{ animation: 'nebula-drift 40s ease-in-out infinite alternate' }} 
          />
          {/* Blue Cloud */}
          <div 
            className="absolute bottom-[20%] right-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-900/20 blur-[120px]"
            style={{ animation: 'nebula-drift 55s ease-in-out infinite alternate-reverse' }} 
          />
          {/* Cyan Highlight */}
          <div 
             className="absolute top-[60%] left-[40%] w-[30vw] h-[30vw] rounded-full bg-cyan-900/10 blur-[80px]"
             style={{ animation: 'nebula-drift 30s ease-in-out infinite alternate' }}
          />
      </div>
      
      {/* 4. Distant Starfield */}
      <div className="absolute inset-0 z-0 opacity-60" style={{ backgroundImage: 'radial-gradient(white 1px, transparent 1px)', backgroundSize: '70px 70px' }}></div>
      <div className="absolute inset-0 z-0 opacity-30" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.7) 1.5px, transparent 1.5px)', backgroundSize: '180px 180px', backgroundPosition: '20px 20px' }}></div>

      {/* Interactive Objects Layer */}
      <div 
        className="absolute inset-0 z-10 transition-transform duration-300 ease-out origin-center"
        style={{ transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoomLevel})` }}
      >
        {objects.map(obj => (
          <SpaceObject key={obj.id} data={obj} onClick={handleObjectClick} />
        ))}
      </div>

      {/* UI Overlay */}
      <div className="absolute top-0 left-0 right-0 z-40 p-6 flex flex-col md:flex-row justify-between items-start md:items-center pointer-events-none">
        
        {/* Header */}
        <div className="pointer-events-auto mb-4 md:mb-0 flex items-center space-x-4">
            <div>
                <h1 className="font-display text-4xl md:text-5xl font-black text-white tracking-tighter drop-shadow-[0_0_10px_rgba(255,255,255,0.5)]">
                    COSMIC<span className="text-cyan-400">LENS</span>
                </h1>
                <div className="flex items-center gap-2">
                    <p className="text-blue-200/60 text-sm tracking-widest uppercase font-semibold mt-1">
                        Interactive Anomaly Explorer
                    </p>
                    {!keyValid && (
                         <span className="bg-amber-500/20 text-amber-400 text-[10px] px-2 py-0.5 rounded border border-amber-500/50 uppercase tracking-wider font-bold animate-pulse">
                            Setup Required
                         </span>
                    )}
                </div>
            </div>
            
            <button 
                onClick={toggleMute}
                className="p-2 rounded-full bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white transition-colors border border-white/5 backdrop-blur-md"
                title={isMuted ? "Unmute Sound" : "Mute Sound"}
            >
                {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
            </button>
            
            <button 
                onClick={() => setIsSettingsOpen(true)}
                className={`p-2 rounded-full transition-all border backdrop-blur-md ${
                    keyValid 
                    ? 'bg-cyan-500/20 text-cyan-400 border-cyan-500/50 hover:bg-cyan-500/30' 
                    : 'bg-amber-500/10 text-amber-400 border-amber-500/50 animate-pulse hover:bg-amber-500/20 shadow-[0_0_15px_rgba(245,158,11,0.5)]'
                }`}
                title={keyValid ? "Settings" : "Configuration Required"}
            >
                <Settings size={20} />
            </button>
        </div>

        {/* Search */}
        <div className="pointer-events-auto w-full md:w-auto flex flex-col items-end space-y-2">
            <form onSubmit={handleSearch} className="relative group w-full md:w-80">
                <input 
                    type="text" 
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder={keyValid ? "Search phenomena..." : "Setup API Key to Search"}
                    disabled={!keyValid}
                    className="w-full bg-white/5 border border-white/10 backdrop-blur-md rounded-full py-3 pl-5 pr-12 text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:bg-black/40 transition-all font-sans disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <button 
                    type="submit"
                    disabled={!keyValid}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-gray-400 hover:text-white transition-colors disabled:opacity-30"
                >
                    <Search size={18} />
                </button>
            </form>
            
            <div className="flex gap-2 overflow-x-auto max-w-full md:max-w-md pb-2 scrollbar-hide">
                {SUGGESTIONS.map(s => (
                    <button
                        key={s}
                        onClick={() => { 
                            setSearchQuery(s); 
                            setTimeout(() => {
                                handleInteraction();
                                audio.playSearch();
                                setIsModalOpen(true);
                                setIsLoading(true);
                                setSelectedFact(null);
                                searchPhenomena(s).then(result => {
                                    setSelectedFact(result);
                                    setIsLoading(false);
                                });
                                setSearchQuery('');
                            }, 0);
                        }} 
                        className="whitespace-nowrap px-3 py-1 bg-white/5 hover:bg-cyan-500/20 border border-white/5 hover:border-cyan-500/50 rounded-full text-xs text-gray-300 hover:text-cyan-300 transition-all"
                    >
                        {s}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="absolute bottom-24 right-6 md:bottom-8 md:right-8 z-40 flex flex-col gap-3 pointer-events-auto">
          <button 
             onClick={() => adjustZoom(0.5)}
             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
             title="Zoom In"
          >
             <ZoomIn size={24} />
          </button>
          <button 
             onClick={() => adjustZoom(-0.5)}
             className="p-3 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-white transition-all hover:scale-110 active:scale-95 shadow-[0_0_15px_rgba(0,255,255,0.2)]"
             title="Zoom Out"
          >
             <ZoomOut size={24} />
          </button>
      </div>

      {/* Footer Instructions */}
      <div className="absolute bottom-8 left-0 right-0 z-30 text-center pointer-events-none px-4">
          <p className="text-white/30 text-sm font-light tracking-widest uppercase animate-pulse">
            Scroll or use controls to Zoom • Click objects to analyze
          </p>
      </div>

      {/* Info Modal */}
      <InfoModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        data={selectedFact}
        isLoading={isLoading}
      />

      {/* Settings Modal - Redesigned for First-Time Setup */}
      {isSettingsOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div 
                className="absolute inset-0 bg-black/80 backdrop-blur-sm" 
                onClick={() => setIsSettingsOpen(false)}
            />
            <div className="relative bg-[#0a0b1e] border border-cyan-500/30 rounded-2xl p-8 w-full max-w-md shadow-2xl animate-float">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-3 bg-cyan-500/20 rounded-full text-cyan-400">
                        {keyValid ? <Database size={24} /> : <Zap size={24} />}
                    </div>
                    <div>
                        <h2 className="text-2xl font-display font-bold text-white">
                            {keyValid ? "System Status" : "Welcome Pilot"}
                        </h2>
                        <p className="text-gray-400 text-sm">
                            {keyValid ? "Connection established" : "Initialize AI Uplink"}
                        </p>
                    </div>
                </div>

                <div className="space-y-6">
                    {/* Status Indicator */}
                    <div>
                        <div className={`p-4 rounded-xl border flex items-center justify-between ${keyValid ? 'bg-green-500/10 border-green-500/50 text-green-400' : 'bg-amber-500/10 border-amber-500/50 text-amber-400'}`}>
                            <span className="font-bold tracking-wider text-sm">STATUS</span>
                            {keyValid ? (
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <span className="relative flex h-2 w-2">
                                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                      <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                                    </span>
                                    ONLINE
                                </div>
                            ) : (
                                <div className="flex items-center gap-2 text-sm font-bold">
                                    <AlertTriangle size={16} />
                                    OFFLINE
                                </div>
                            )}
                        </div>
                    </div>

                    <div className="pt-2">
                         {!keyValid && (
                            <div className="mb-4 text-sm text-gray-300 leading-relaxed bg-white/5 p-3 rounded-lg border border-white/10">
                                <p>To generate real-time facts about the cosmos, this ship requires a <strong>Google Gemini API Key</strong>.</p>
                            </div>
                        )}

                        <label className="block text-gray-500 text-xs uppercase tracking-widest mb-2 flex items-center gap-2">
                            <Key size={12} />
                            API Key Configuration
                        </label>
                        
                        {!keyValid ? (
                            <div className="space-y-3">
                                <div className="flex gap-2">
                                    <input 
                                        type="password" 
                                        value={inputKey}
                                        onChange={(e) => setInputKey(e.target.value)}
                                        placeholder="Paste your API Key here..."
                                        className="flex-1 bg-black/50 border border-white/20 rounded-lg px-4 py-3 text-white text-sm focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none transition-all placeholder-gray-600"
                                    />
                                </div>
                                <div className="flex gap-2">
                                    <a 
                                        href="https://aistudio.google.com/app/apikey" 
                                        target="_blank" 
                                        rel="noopener noreferrer"
                                        className="flex-1 py-2 text-center text-xs text-cyan-400 hover:text-cyan-300 hover:underline flex items-center justify-center gap-1 bg-cyan-900/10 rounded border border-transparent hover:border-cyan-500/30 transition-all"
                                    >
                                        Get Free Key <ExternalLink size={10} />
                                    </a>
                                    <button 
                                        onClick={handleSaveKey}
                                        disabled={inputKey.length < 10}
                                        className="flex-[2] bg-cyan-600 hover:bg-cyan-500 text-white font-bold py-2 rounded-lg flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-900/20"
                                    >
                                        <Save size={16} /> Connect
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center justify-between bg-white/5 rounded-lg px-4 py-3 border border-white/10">
                                <span className="text-sm text-gray-300 font-mono">••••••••••••••••••••</span>
                                <button 
                                    onClick={handleClearKey}
                                    className="text-red-400 hover:text-red-300 p-2 hover:bg-red-500/10 rounded-md transition-colors flex items-center gap-2 text-xs uppercase font-bold tracking-wider"
                                    title="Clear saved key"
                                >
                                    <Trash2 size={14} /> Disconnect
                                </button>
                            </div>
                        )}
                    </div>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 flex justify-between items-center">
                    <span className="text-xs text-gray-600 font-mono tracking-widest">SYSTEM v2.0</span>
                    <button 
                        onClick={() => setIsSettingsOpen(false)}
                        className="px-6 py-2 bg-white/5 hover:bg-white/10 rounded-full text-gray-300 text-sm transition-colors border border-white/5"
                    >
                        {keyValid ? "Close" : "Use Offline Mode"}
                    </button>
                </div>
            </div>
          </div>
      )}
    </div>
  );
};

export default App;