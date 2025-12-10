import React, { useMemo } from 'react';
import { SpaceObjectData } from '../types';

interface SpaceObjectProps {
  data: SpaceObjectData;
  onClick: (data: SpaceObjectData) => void;
}

export const SpaceObject: React.FC<SpaceObjectProps> = ({ data, onClick }) => {
  
  // Memoize random values so they don't change on re-renders
  const seed = useMemo(() => Math.random(), []);
  
  // Deterministic visual variations based on seed
  const hasRing = data.type === 'PLANET' && seed > 0.7;
  const isGasGiant = data.type === 'PLANET' && seed > 0.4;
  const nebulaVariant = Math.floor(seed * 3); // 0, 1, or 2 for different cloud shapes
  const rotationDuration = 20 + (seed * 40); // Random rotation speed between 20s and 60s

  const getStyle = () => {
    return {
      left: `${data.x}%`,
      top: `${data.y}%`,
      position: 'absolute' as const,
      cursor: 'pointer',
      transform: 'translate(-50%, -50%)', // Center object on its coordinates
      zIndex: data.type === 'BLACK_HOLE' ? 20 : 10,
    };
  };

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onClick(data);
  };

  const renderVisual = () => {
    switch (data.type) {
      case 'STAR':
        // A glowing core with diffraction spikes (cross)
        const starSize = data.size * 2; 
        return (
          <div className="relative flex items-center justify-center group" style={{ width: starSize, height: starSize }}>
            {/* Outer Glow */}
            <div 
              className="absolute inset-[-150%] rounded-full opacity-40 blur-lg group-hover:opacity-70 transition-opacity"
              style={{ backgroundColor: data.color }}
            />
            {/* Diffraction Spikes */}
            <div className="absolute inset-0 flex items-center justify-center animate-twinkle" style={{ animationDuration: `${2 + seed}s` }}>
              <div className="w-[1px] h-[200%] bg-white/90 blur-[0.5px]" />
              <div className="h-[1px] w-[200%] bg-white/90 blur-[0.5px]" />
            </div>
            {/* Core */}
            <div className="absolute w-[50%] h-[50%] bg-white rounded-full shadow-[0_0_10px_white]" />
          </div>
        );

      case 'PLANET':
        const planetSize = data.size * 4;
        return (
          <div className="relative group flex items-center justify-center">
            {/* Planet Body */}
            <div 
              className="rounded-full relative overflow-hidden transition-transform duration-500 group-hover:scale-110"
              style={{
                width: planetSize,
                height: planetSize,
                backgroundColor: data.color,
                // Inner shadow for spherical 3D look + outer glow
                boxShadow: `inset -6px -6px 12px rgba(0,0,0,0.7), 0 0 5px ${data.color}40`,
                animation: `spin ${rotationDuration}s linear infinite`,
              }}
            >
              {/* Surface Texture */}
              {isGasGiant ? (
                // Gas Giant Bands
                <div 
                    className="absolute inset-[-50%] opacity-30"
                    style={{ 
                        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 5px, rgba(0,0,0,0.4) 5px, rgba(0,0,0,0.4) 10px)',
                        transform: 'rotate(-30deg)'
                    }} 
                />
              ) : (
                // Rocky Craters/Texture
                <div 
                    className="absolute inset-0 opacity-20"
                    style={{ 
                        backgroundImage: 'radial-gradient(circle at 30% 70%, black 10%, transparent 20%), radial-gradient(circle at 70% 30%, black 5%, transparent 15%)'
                    }}
                />
              )}
              
              {/* Atmospheric Shine */}
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-white/30 to-transparent pointer-events-none" />
            </div>

            {/* Rings (Conditional) */}
            {hasRing && (
              <div 
                className="absolute w-[180%] h-[40%] border-[3px] border-white/40 rounded-[50%] pointer-events-none top-1/2 left-1/2 blur-[0.5px]"
                style={{ 
                    borderTopColor: 'rgba(255,255,255,0.1)',
                    borderBottomColor: 'rgba(255,255,255,0.5)',
                    transform: 'translate(-50%, -50%) rotate(-15deg)',
                }}
              />
            )}
            
            {/* Interaction Halo */}
            <div className="absolute -inset-4 rounded-full border border-white/20 opacity-0 group-hover:opacity-100 transition-all scale-90 group-hover:scale-100" />
          </div>
        );

      case 'NEBULA':
        // Organic, cloud-like shapes using overlapping gradients and blobs
        const w = data.size * 10;
        const h = data.size * 8;
        return (
          <div 
             className="relative flex items-center justify-center opacity-70 group hover:opacity-100 transition-opacity duration-700"
             style={{ width: w, height: h }}
          >
             {/* Primary Cloud */}
             <div 
                className="absolute inset-0 blur-xl opacity-50 mix-blend-screen"
                style={{ 
                    backgroundColor: data.color,
                    borderRadius: nebulaVariant === 0 ? '60% 40% 30% 70% / 60% 30% 70% 40%' : '30% 70% 70% 30% / 30% 30% 70% 70%',
                    animation: `float 20s ease-in-out infinite alternate`
                }}
             />
             {/* Secondary Cloud Layer */}
             <div 
                className="absolute inset-2 bg-purple-500/30 blur-lg mix-blend-screen"
                style={{ 
                    borderRadius: '50%',
                    transform: 'translate(10%, -10%) scale(0.8)',
                    animation: `pulse 8s ease-in-out infinite`
                }}
             />
             {/* Embedded Stars in Nebula */}
             <div className="absolute top-1/2 left-1/2 w-1 h-1 bg-white shadow-[0_0_5px_white] rounded-full animate-twinkle" />
             <div className="absolute top-1/3 right-1/3 w-[2px] h-[2px] bg-white shadow-[0_0_2px_white] rounded-full animate-twinkle" style={{ animationDelay: '1s' }} />
          </div>
        );

      case 'BLACK_HOLE':
         const bhSize = data.size * 3;
         // Ensure disk has visibility even if data.color is black
         const diskColor = data.color === '#000' || data.color === '#000000' ? '#f97316' : data.color;
         return (
            <div className="relative flex items-center justify-center group hover:scale-110 transition-transform duration-1000">
               {/* Accretion Disk */}
               <div 
                  className="absolute inset-[-60%] rounded-full blur-sm opacity-90"
                  style={{
                      background: `conic-gradient(from 0deg, transparent 0%, ${diskColor} 25%, transparent 50%, ${diskColor} 75%, transparent 100%)`,
                      animation: 'spin 3s linear infinite'
                  }}
               />
               {/* Photon Ring */}
               <div className="absolute inset-[-5%] border border-white/50 rounded-full blur-[1px] shadow-[0_0_20px_white]" />
               {/* Event Horizon */}
               <div className="relative w-full h-full bg-black rounded-full z-10 shadow-[0_0_40px_rgba(0,0,0,1)]" style={{ width: bhSize, height: bhSize }} />
            </div>
         );

      case 'ANOMALY':
          const aSize = data.size * 3;
          return (
            <div className="relative flex items-center justify-center hover:scale-125 transition-transform duration-300">
                <div 
                    className="absolute border border-cyan-400/60 shadow-[0_0_10px_cyan]"
                    style={{ width: aSize, height: aSize, animation: 'spin 8s linear infinite' }} 
                />
                <div 
                    className="absolute border border-pink-500/60 shadow-[0_0_10px_magenta]"
                    style={{ width: aSize, height: aSize, animation: 'spin 6s linear infinite reverse', transform: 'rotate(45deg)' }} 
                />
                <div className="w-1.5 h-1.5 bg-white rounded-full animate-ping" />
                <div className="absolute -bottom-6 text-[10px] text-cyan-300 font-mono tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">ERROR</div>
            </div>
          );

      default:
        return null;
    }
  };

  return (
    <div style={getStyle()} onClick={handleClick} title={data.name}>
      {renderVisual()}
    </div>
  );
};