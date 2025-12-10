# Cosmic Lens - Interactive Space Explorer

## Overview

Cosmic Lens is an interactive web-based space exploration experience that allows users to discover and learn about celestial objects. The application generates a procedural starfield with various space phenomena (stars, planets, nebulae, black holes, and anomalies) and uses Google's Gemini AI to provide detailed, educational information about selected objects or searched phenomena.

Users can click on objects to learn more, search for specific celestial phenomena, zoom in/out, and toggle ambient audio. The application features a glassmorphic UI design with animations and supports both online (AI-powered) and offline (cached) modes.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture

**Framework**: React 19 with TypeScript, using functional components and hooks (useState, useEffect, useCallback, useMemo).

**Build System**: Vite for fast development and optimized production builds. Vite handles TypeScript compilation, React JSX transformation, and bundling. The build outputs to a `dist/` directory for static deployment.

**Styling**: Tailwind CSS (via CDN) for utility-first styling combined with custom CSS for animations and glassmorphic effects. Custom fonts (Orbitron, Rajdhani) from Google Fonts provide a futuristic aesthetic.

**State Management**: Local component state using React hooks. No global state management library is used - state is lifted to the App component and passed down as props.

**UI Components**:
- `SpaceObject`: Renders individual celestial objects with distinct visuals per type (stars with diffraction spikes, planets with optional rings, nebulae with cloud formations, black holes with accretion disks)
- `InfoModal`: Displays detailed information about objects with loading states, scrollable content, and external links
- Main App component manages viewport state (EXPLORING, SEARCHING, VIEWING_DETAILS)

**Rendering Strategy**: Absolute positioning based on percentage coordinates (0-100% of viewport) allows responsive scaling. Objects are procedurally generated in a grid pattern with randomized placement within cells to ensure even distribution.

**Icons**: Lucide React for consistent iconography throughout the UI.

### Backend Architecture

**No Traditional Backend**: This is a static single-page application (SPA) with no server-side code. All logic runs client-side in the browser.

**API Integration**: Direct client-side calls to Google Gemini API for AI-generated content. API key can be provided via:
1. Environment variable (build-time via `process.env.API_KEY`)
2. Runtime override stored in localStorage (allows users to input their own key)

**Offline Fallback**: Pre-cached facts stored in `DEMO_FACTS` object provide information when API key is unavailable or API calls fail. This ensures the application remains functional without external dependencies.

### Audio System

**Web Audio API**: Custom `AudioService` class manages ambient soundscapes and interaction sounds using the Web Audio API.

**Features**:
- Master gain node for volume control
- Mute/unmute with smooth fade transitions
- Procedural ambient tones and interaction beeps
- Context state management (handles browser autoplay policies)

**Design Decision**: Audio is optional and user-controlled rather than auto-playing to respect user preferences and browser policies.

### Data Flow

1. **Object Generation**: Procedural generation creates SpaceObjectData objects with unique names from predefined pools to avoid duplicates
2. **User Interaction**: Click events trigger state changes (VIEWING_DETAILS) and API calls
3. **Search Flow**: Search input triggers `searchPhenomena()` which calls Gemini API with grounding enabled
4. **Fact Retrieval**: `getObjectFact()` calls Gemini with structured output schema or returns cached facts
5. **Response Handling**: Gemini responses are parsed and displayed in InfoModal with loading states

### Type Safety

**TypeScript**: Strict mode enabled with comprehensive type definitions in `types.ts`:
- `SpaceObjectData`: Defines celestial object structure
- `FactResponse`: Defines AI response schema with optional grounding URLs
- `ViewState`: Enum for application state management

## External Dependencies

### AI Service

**Google Gemini API** (`@google/genai` v1.30.0):
- **Model**: gemini-2.5-flash
- **Purpose**: Generate educational content about celestial phenomena
- **Features Used**:
  - Structured output with schema validation
  - Grounding for search queries (provides source URLs)
  - Text generation for object facts
- **API Key Management**: Multi-source strategy (env var → localStorage) with runtime override capability
- **Error Handling**: Graceful degradation to cached facts when API unavailable

### UI Libraries

**React Ecosystem**:
- `react` v19.0.0: Core framework
- `react-dom` v19.0.0: DOM rendering
- `lucide-react` v0.555.0: Icon library

**Styling**:
- Tailwind CSS (CDN): Utility-first CSS framework
- Google Fonts: Orbitron (display) and Rajdhani (body) typefaces

### Development Tools

**TypeScript** v5.2.2: Static type checking with strict compiler options

**Vite** v5.2.0: Build tool providing:
- Fast HMR (Hot Module Replacement) for development
- Optimized production builds
- Environment variable injection
- React plugin for JSX transformation

**gh-pages** v6.1.1: Deployment to GitHub Pages (static hosting)

### Deployment

**GitHub Pages**: Static site hosting with GitHub Actions workflow for automated builds. The `base: './'` configuration in Vite ensures relative paths work correctly in subdirectory deployments.

**No Database**: All data is either procedurally generated at runtime or cached in-memory. No persistent storage beyond localStorage for API key.