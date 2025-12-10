export interface SpaceObjectData {
  id: string;
  type: 'STAR' | 'PLANET' | 'NEBULA' | 'ANOMALY' | 'BLACK_HOLE';
  x: number; // Percentage 0-100
  y: number; // Percentage 0-100
  size: number;
  color: string;
  name: string;
  description?: string;
}

export interface FactResponse {
  title: string;
  content: string;
  funFact: string;
  groundingUrls?: Array<{
    title: string;
    uri: string;
  }>;
}

export enum ViewState {
  EXPLORING,
  SEARCHING,
  VIEWING_DETAILS
}
