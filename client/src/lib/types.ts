export type FlightCategory = 'VFR' | 'IFR';

export interface Wind {
  direction: string; // "300" or "VRB"
  speed: number;
  gusts?: number;
  unit: 'KT' | 'MPS';
}

export interface Visibility {
  meters: number; // Normalized to meters for calculation
  raw: string; // "10SM" or "9999"
}

export interface CloudLayer {
  coverage: 'FEW' | 'SCT' | 'BKN' | 'OVC' | 'VV' | 'NSC' | 'SKC';
  altitude?: number; // Hundreds of feet, e.g., 030 = 3000ft
  type?: string; // CB, TCU
}

export interface WeatherCondition {
  code: string; // RA, TSRA, -SN
  description: string; // Light Rain, Thunderstorm Rain
}

export interface ForecastGroup {
  type: 'BASE' | 'FM' | 'BECMG' | 'TEMPO' | 'PROB30' | 'PROB40';
  startDay?: number;
  startHour?: number;
  startMinute?: number;
  endDay?: number;
  endHour?: number;
  endMinute?: number;
  probability?: number;
  wind?: Wind;
  visibility?: Visibility;
  clouds: CloudLayer[];
  weather: WeatherCondition[];
  rawText: string;
  flightCategory: FlightCategory;
  alternateRequired: boolean;
  impacts: string[]; // "Low Visibility", "Gusty Winds", "Thunderstorms"
}

export interface ParsedTaf {
  station: string;
  validity: {
    startDay: number;
    startHour: number;
    endDay: number;
    endHour: number;
    raw: string;
  };
  rawText: string;
  groups: ForecastGroup[];
  maxImpact: FlightCategory; // Worst category in the period
  alternateRequired: boolean;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
