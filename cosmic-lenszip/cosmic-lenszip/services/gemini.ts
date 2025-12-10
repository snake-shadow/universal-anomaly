import { GoogleGenAI, Type } from "@google/genai";
import { FactResponse } from "../types";

// STORAGE KEY
const STORAGE_KEY = 'gemini_api_key_override';

// 1. Check Environment Variable (Build time)
// 2. Check Local Storage (Runtime override)
const getApiKey = (): string | null => {
  const envKey = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
  if (envKey && envKey !== "undefined" && envKey !== "") return envKey;
  
  const localKey = localStorage.getItem(STORAGE_KEY);
  if (localKey && localKey !== "undefined" && localKey !== "") return localKey;

  return null;
};

export const hasValidKey = (): boolean => {
    return !!getApiKey();
};

export const saveApiKey = (key: string) => {
    localStorage.setItem(STORAGE_KEY, key);
    window.location.reload(); // Reload to re-initialize services
};

export const clearApiKey = () => {
    localStorage.removeItem(STORAGE_KEY);
    window.location.reload();
};

const modelName = 'gemini-2.5-flash';

// --- DEMO / OFFLINE DATA ---
const DEMO_FACTS: Record<string, FactResponse> = {
    // STARS - Generic fallback
    'STAR': {
        title: "Distant Star (Database)",
        content: "A massive, luminous sphere of plasma held together by its own gravity. The ship's sensors are currently relying on pre-cached data rather than live spectral analysis.",
        funFact: "The light you see from some stars left them before civilizations existed on Earth."
    },
    // STARS - Unique entries
    'Distant Star': {
        title: "Distant Star (Database)",
        content: "A massive, luminous sphere of plasma held together by its own gravity. The ship's sensors are currently relying on pre-cached data rather than live spectral analysis.",
        funFact: "The light you see from some stars left them before civilizations existed on Earth."
    },
    'Betelgeuse': {
        title: "Betelgeuse (Database)",
        content: "A red supergiant star in the constellation Orion, one of the largest stars visible to the naked eye. It's so massive that if placed at the center of our solar system, its surface would extend past the orbit of Mars.",
        funFact: "Betelgeuse is expected to explode as a supernova within the next 100,000 years—astronomically speaking, that's any moment now."
    },
    'Sirius': {
        title: "Sirius (Database)",
        content: "The brightest star in Earth's night sky, located in the constellation Canis Major. It's actually a binary star system, with Sirius B being a faint white dwarf companion.",
        funFact: "Ancient Egyptians based their calendar on Sirius—its rising marked the annual flooding of the Nile."
    },
    'Proxima Centauri': {
        title: "Proxima Centauri (Database)",
        content: "The closest known star to the Sun at just 4.24 light-years away. It's a small, dim red dwarf that hosts at least one confirmed exoplanet in its habitable zone.",
        funFact: "Even at the speed of our fastest spacecraft, it would take over 73,000 years to reach Proxima Centauri."
    },
    'Vega': {
        title: "Vega (Database)",
        content: "A bright blue-white star in the constellation Lyra, only 25 light-years from Earth. It was the first star other than the Sun to be photographed and have its spectrum recorded.",
        funFact: "In about 12,000 years, Vega will become Earth's North Star due to axial precession."
    },
    'Polaris': {
        title: "Polaris (Database)",
        content: "The current North Star, located nearly in line with Earth's rotational axis. It's actually a triple star system, with Polaris A being a yellow supergiant.",
        funFact: "Polaris is about 2,500 times brighter than our Sun but appears dim because it's 433 light-years away."
    },
    'Rigel': {
        title: "Rigel (Database)",
        content: "A blue supergiant star in the constellation Orion, the seventh-brightest star in the night sky. It shines with the luminosity of approximately 120,000 Suns.",
        funFact: "Despite being much farther away than Betelgeuse, Rigel appears almost as bright because it's intrinsically far more luminous."
    },
    'Aldebaran': {
        title: "Aldebaran (Database)",
        content: "An orange giant star that forms the 'eye' of the constellation Taurus. It has exhausted its hydrogen fuel and expanded to about 44 times the Sun's diameter.",
        funFact: "The Pioneer 10 spacecraft is heading in Aldebaran's direction and will pass by in about 2 million years."
    },
    'Antares': {
        title: "Antares (Database)",
        content: "A red supergiant star and the brightest object in the constellation Scorpius. Its name means 'rival of Mars' because its reddish color resembles the planet.",
        funFact: "Antares is so large that if it replaced the Sun, its surface would extend beyond the orbit of Mars."
    },
    'Canopus': {
        title: "Canopus (Database)",
        content: "The second-brightest star in the night sky, a bright giant in the constellation Carina. It's used as a navigation reference point for many spacecraft.",
        funFact: "Canopus is about 10,000 times more luminous than the Sun and lies 310 light-years from Earth."
    },
    // PLANETS - Generic fallback
    'PLANET': {
        title: "Exoplanet (Database)",
        content: "A rocky or gaseous world orbiting a distant star. Without the live AI uplink, detailed atmospheric composition analysis is unavailable.",
        funFact: "There are likely more planets in the universe than grains of sand on all of Earth's beaches."
    },
    // PLANETS - Unique entries
    'Exoplanet': {
        title: "Exoplanet (Database)",
        content: "A rocky or gaseous world orbiting a distant star. Without the live AI uplink, detailed atmospheric composition analysis is unavailable.",
        funFact: "There are likely more planets in the universe than grains of sand on all of Earth's beaches."
    },
    'Kepler-22b': {
        title: "Kepler-22b (Database)",
        content: "The first exoplanet confirmed by NASA's Kepler mission to orbit within the habitable zone of a Sun-like star. It's about 2.4 times Earth's radius and could potentially have liquid water.",
        funFact: "Kepler-22b is 600 light-years away, meaning the light we see from it left during the Middle Ages."
    },
    'TRAPPIST-1e': {
        title: "TRAPPIST-1e (Database)",
        content: "One of seven Earth-sized planets orbiting the ultracool dwarf star TRAPPIST-1. It's the most likely candidate in the system to harbor liquid water on its surface.",
        funFact: "The TRAPPIST-1 planets are so close together that standing on one, you could see the others as clearly as we see the Moon."
    },
    'Gliese 581g': {
        title: "Gliese 581g (Database)",
        content: "A controversial exoplanet candidate orbiting in the habitable zone of red dwarf star Gliese 581. If it exists, it would be one of the most Earth-like planets discovered.",
        funFact: "Gliese 581g is tidally locked, meaning one side always faces its star in eternal day while the other is in permanent night."
    },
    'HD 209458 b': {
        title: "HD 209458 b - Osiris (Database)",
        content: "The first exoplanet observed transiting its parent star and the first to have its atmosphere detected. Nicknamed 'Osiris,' this hot Jupiter is being slowly stripped of its atmosphere.",
        funFact: "HD 209458 b has a tail of evaporating atmosphere trailing behind it, like a comet made of a planet."
    },
    'Proxima Centauri b': {
        title: "Proxima Centauri b (Database)",
        content: "An Earth-sized exoplanet orbiting in the habitable zone of Proxima Centauri, the closest star to the Sun. It receives about 70% of the light Earth gets from the Sun.",
        funFact: "This is the closest known exoplanet to Earth, and it's a prime target for future interstellar exploration missions."
    },
    'Kepler-452b': {
        title: "Kepler-452b (Database)",
        content: "Often called 'Earth's Cousin,' this super-Earth orbits a Sun-like star at a similar distance as Earth orbits the Sun. It's about 60% larger than Earth and could have active volcanoes.",
        funFact: "Kepler-452b has been in its star's habitable zone for 6 billion years—longer than Earth has existed."
    },
    'WASP-121b': {
        title: "WASP-121b (Database)",
        content: "An ultra-hot Jupiter that's being stretched into a football shape by its star's gravity. Its upper atmosphere reaches temperatures hot enough to vaporize iron and titanium.",
        funFact: "WASP-121b has glowing water vapor in its atmosphere and may rain liquid gems made of iron and corundum."
    },
    // NEBULAE - Generic fallback
    'NEBULA': {
        title: "Nebula Cloud (Database)",
        content: "A vast cloud of dust and gas. These are often stellar nurseries. In simulation mode, we display a generalized structure rather than specific chemical composition.",
        funFact: "Nebulae come in many shapes, leading to names like 'Horsehead', 'Crab', and 'Eye of God'."
    },
    // NEBULAE - Unique entries
    'Nebula Cloud': {
        title: "Nebula Cloud (Database)",
        content: "A vast cloud of dust and gas. These are often stellar nurseries. In simulation mode, we display a generalized structure rather than specific chemical composition.",
        funFact: "Nebulae come in many shapes, leading to names like 'Horsehead', 'Crab', and 'Eye of God'."
    },
    'Crab Nebula': {
        title: "Crab Nebula (Database)",
        content: "The remnant of a supernova explosion observed by Chinese astronomers in 1054 AD. At its center lies a pulsar spinning 30 times per second, shooting out jets of particles.",
        funFact: "The supernova that created the Crab Nebula was bright enough to be visible during the day for 23 days."
    },
    'Orion Nebula': {
        title: "Orion Nebula (Database)",
        content: "The closest large star-forming region to Earth, visible to the naked eye as a fuzzy patch in Orion's sword. It contains hundreds of young stars being born right now.",
        funFact: "The Orion Nebula is only about 2 million years old—a cosmic infant—and contains enough gas to create 2,000 more Suns."
    },
    'Helix Nebula': {
        title: "Helix Nebula (Database)",
        content: "A planetary nebula nicknamed the 'Eye of God' due to its striking appearance. It's one of the closest planetary nebulae to Earth at about 700 light-years away.",
        funFact: "The Helix Nebula was created when a dying Sun-like star shed its outer layers, previewing our own Sun's fate in 5 billion years."
    },
    'Ring Nebula': {
        title: "Ring Nebula (Database)",
        content: "A famous planetary nebula in the constellation Lyra, appearing as a colorful ring surrounding a dying white dwarf star. It's about one light-year in diameter.",
        funFact: "The Ring Nebula's distinctive shape is actually a barrel we happen to view from one end, not a true ring."
    },
    'Horsehead Nebula': {
        title: "Horsehead Nebula (Database)",
        content: "A dark nebula in Orion shaped remarkably like a horse's head, silhouetted against a glowing emission nebula. It's about 1,500 light-years from Earth.",
        funFact: "The Horsehead Nebula will be eroded away by ultraviolet radiation from nearby stars in about 5 million years."
    },
    // BLACK HOLES - Generic fallback
    'BLACK_HOLE': {
        title: "Singularity (Database)",
        content: "A region of spacetime where gravity is so strong that nothing can escape. The ship's computer is simulating the event horizon visuals based on general relativity models.",
        funFact: "If you fell into a black hole, you would be stretched out like spaghetti in a process called 'spaghettification'."
    },
    // BLACK HOLES - Unique entries
    'Singularity': {
        title: "Singularity (Database)",
        content: "A region of spacetime where gravity is so strong that nothing can escape. The ship's computer is simulating the event horizon visuals based on general relativity models.",
        funFact: "If you fell into a black hole, you would be stretched out like spaghetti in a process called 'spaghettification'."
    },
    'Sagittarius A*': {
        title: "Sagittarius A* (Database)",
        content: "The supermassive black hole at the center of our Milky Way galaxy, with a mass of about 4 million Suns. It was directly imaged by the Event Horizon Telescope in 2022.",
        funFact: "Despite its enormous mass, Sagittarius A* is quiet compared to other supermassive black holes because it's currently on a 'starvation diet.'"
    },
    'M87*': {
        title: "M87* (Database)",
        content: "The supermassive black hole at the center of galaxy Messier 87, famous for being the first black hole ever directly imaged in 2019. It has a mass of 6.5 billion Suns.",
        funFact: "M87* shoots out a jet of plasma traveling at nearly the speed of light that extends for 5,000 light-years."
    },
    'Cygnus X-1': {
        title: "Cygnus X-1 (Database)",
        content: "One of the first widely accepted black hole candidates, orbiting a blue supergiant star in a binary system. It's actively pulling material from its companion star.",
        funFact: "Stephen Hawking famously bet against Cygnus X-1 being a black hole in 1974—and happily lost that bet."
    },
    'V404 Cygni': {
        title: "V404 Cygni (Database)",
        content: "A black hole binary system that produces dramatic X-ray outbursts. In 2015, it underwent its first outburst in 26 years, becoming one of the brightest X-ray sources in the sky.",
        funFact: "V404 Cygni's black hole wobbles like a spinning top, causing its jets to spray in different directions over hours."
    },
    // ANOMALIES - Generic fallback
    'ANOMALY': {
        title: "Unidentified Anomaly",
        content: "The ship's sensors are picking up a high-energy signature in this sector. Due to limited uplink connectivity, the exact nature of this phenomenon—whether a wormhole or spatial rift—cannot be determined.",
        funFact: "Dark matter makes up about 27% of the universe, yet it remains invisible to direct detection."
    },
    // ANOMALIES - Unique entries
    'Cosmic Anomaly': {
        title: "Unidentified Anomaly",
        content: "The ship's sensors are picking up a high-energy signature in this sector. Due to limited uplink connectivity, the exact nature of this phenomenon—whether a wormhole or spatial rift—cannot be determined.",
        funFact: "Dark matter makes up about 27% of the universe, yet it remains invisible to direct detection."
    },
    "Tabby's Star": {
        title: "Tabby's Star - KIC 8462852 (Database)",
        content: "A star exhibiting irregular, unprecedented dimming that baffled astronomers. Various explanations have been proposed, from a swarm of comets to—controversially—alien megastructures.",
        funFact: "Tabby's Star once dimmed by 22% over just a few days—far more than any planet transit could explain."
    },
    'Fast Radio Burst': {
        title: "Fast Radio Burst (Database)",
        content: "Mysterious millisecond-long bursts of radio waves from deep space. Their origins remain one of the biggest mysteries in modern astrophysics, though magnetars are suspected.",
        funFact: "A single fast radio burst releases as much energy in a millisecond as the Sun produces in 80 years."
    },
    'Gamma-Ray Burst': {
        title: "Gamma-Ray Burst (Database)",
        content: "The most energetic explosions in the universe, typically associated with the collapse of massive stars or neutron star mergers. They can outshine entire galaxies for brief moments.",
        funFact: "A gamma-ray burst pointed at Earth from within our galaxy could cause a mass extinction event."
    },
    'Oumuamua': {
        title: "'Oumuamua (Database)",
        content: "The first known interstellar object detected passing through our solar system in 2017. Its unusual cigar shape and acceleration away from the Sun sparked wild speculation.",
        funFact: "'Oumuamua means 'scout' in Hawaiian, and some scientists genuinely considered whether it might be an alien probe."
    }
};

// Hardcoded data for the suggested search terms so the buttons work offline
const OFFLINE_SEARCH_RESULTS: Record<string, FactResponse> = {
  "boötes void": {
    title: "BOÖTES VOID (OFFLINE ARCHIVE)",
    content: "One of the largest known voids in the universe, often referred to as 'The Great Nothing'. Spanning approximately 330 million light-years in diameter, it contains very few galaxies. If our galaxy were in the center of the Boötes Void, we wouldn't have known other galaxies existed until the 1960s.",
    funFact: "It is estimated that if the void were a typical region of space, it should contain thousands of galaxies, but only about 60 have been found."
  },
  "encke gap": {
    title: "ENCKE GAP (OFFLINE ARCHIVE)",
    content: "A 325-kilometer-wide gap within the A Ring of Saturn. It is kept open by the presence of a small moonlet named Pan, which orbits within the gap and acts as a shepherd moon, clearing particles from its path.",
    funFact: "The moon Pan creates wake patterns in the ring particles that look like ripples."
  },
  "magnetar": {
    title: "MAGNETAR (OFFLINE ARCHIVE)",
    content: "A type of neutron star with an extraordinarily powerful magnetic field—about a quadrillion times stronger than Earth's. They are the most magnetic objects known in the universe, capable of erasing credit cards from halfway across the solar system.",
    funFact: "A magnetar's magnetic field is so intense that it would be lethal from 1,000 kilometers away, distorting the electron clouds in your atoms."
  },
  "oort cloud": {
    title: "OORT CLOUD (OFFLINE ARCHIVE)",
    content: "A theoretical spherical shell of icy objects that is believed to surround the Sun at a distance of up to 100,000 AU. It is thought to be the origin of long-period comets.",
    funFact: "No spacecraft has yet reached the Oort Cloud; Voyager 1 will take about 300 years to reach the inner edge."
  },
  "diamond planet": {
    title: "55 CANCRI E (OFFLINE ARCHIVE)",
    content: "An exoplanet that is twice the size of Earth but eight times its mass. Due to its pressure and carbon-rich composition, scientists believe a significant portion of its mass could be pure diamond.",
    funFact: "This 'diamond super-Earth' is so hot that its surface is likely covered in lava."
  },
  "pillars of creation": {
    title: "PILLARS OF CREATION (OFFLINE ARCHIVE)",
    content: "Elephant trunks of interstellar gas and dust in the Eagle Nebula. They are in the process of creating new stars, while simultaneously being eroded by the light from nearby massive stars.",
    funFact: "They were actually destroyed by a supernova 6000 years ago, but the light of the destruction won't reach Earth for another millennium."
  }
};

// Helper to get AI instance on demand
const getAI = (): GoogleGenAI | null => {
    const key = getApiKey();
    if (!key) return null;
    return new GoogleGenAI({ apiKey: key });
};

export const getObjectFact = async (objectType: string, objectName: string): Promise<FactResponse> => {
  const ai = getAI();

  // FALLBACK: If no key, return specific or generic simulation data immediately
  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 800)); // Fake network delay for realism
    // First try to find by exact name, then fall back to type
    const specificFact = DEMO_FACTS[objectName];
    if (specificFact) {
        return specificFact;
    }
    const defaultFact = DEMO_FACTS[objectType] || DEMO_FACTS['STAR'];
    return {
        ...defaultFact,
        title: `${objectName} (Simulation)`
    };
  }

  try {
    const prompt = `
      Tell me a fascinating, scientific, yet accessible fact about a generic ${objectName} (${objectType}) in space.
      Keep it short (max 2-3 sentences).
      Also provide a separate "Mind-Blowing Fun Fact".
      Return strictly JSON.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            content: { type: Type.STRING },
            funFact: { type: Type.STRING },
          },
          required: ["title", "content", "funFact"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response from Gemini");
    
    return JSON.parse(text) as FactResponse;
  } catch (error: any) {
    console.error("Gemini Error:", error);
    
    // If we HAVE a key but it failed, tell the user why (don't just silently show demo data)
    return {
        title: "Uplink Error",
        content: `Connection to the Galactic AI failed. Please check your API quota or network connection. Error: ${error.message || "Unknown Error"}`,
        funFact: "Even in the future, communication networks can go down."
    };
  }
};

export const searchPhenomena = async (query: string): Promise<FactResponse> => {
  const ai = getAI();

  if (!ai) {
    await new Promise(resolve => setTimeout(resolve, 800));
    
    const lowerQuery = query.toLowerCase();
    // Check for offline match in the hardcoded database
    if (OFFLINE_SEARCH_RESULTS[lowerQuery]) {
        return OFFLINE_SEARCH_RESULTS[lowerQuery];
    }

    return {
      title: "Offline Mode",
      content: `You searched for "${query}". The ship's long-range sensors (AI) are offline. Try clicking one of the suggested topics (like 'Boötes Void') to access cached data, or configure your API Key to enable full search.`,
      funFact: "The universe is waiting for you to connect."
    };
  }

  try {
    const prompt = `
      You are an expert astronomer. The user is searching for "${query}".
      Provide a concise explanation of this space phenomenon.
      If it's a specific object (like Encke Gap, Bootes Void), explain what makes it unusual.
      Include a "Mind-Blowing Fun Fact".
      Use the Google Search tool to ensure accuracy if it is a specific real-world entity.
    `;

    const response = await ai.models.generateContent({
      model: modelName,
      contents: prompt,
      config: {
        tools: [{ googleSearch: {} }],
      }
    });

    const text = response.text || "";
    
    // Extract grounding
    const groundingChunks = response.candidates?.[0]?.groundingMetadata?.groundingChunks || [];
    const groundingUrls = groundingChunks
      .map(c => c.web)
      .filter(w => w !== undefined && w !== null)
      .map(w => ({ title: w.title || "Source", uri: w.uri || "#" }));

    return {
      title: query.toUpperCase(),
      content: text,
      funFact: "Check the sources for more deep dives!", 
      groundingUrls
    };

  } catch (error: any) {
    console.error("Gemini Search Error:", error);
    return {
      title: "Search Failed",
      content: `We could not complete your search for "${query}" due to a transmission error: ${error.message || "Signal Lost"}`,
      funFact: "Try simplifying your query or checking the ship's settings.",
      groundingUrls: []
    };
  }
};
