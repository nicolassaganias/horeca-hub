export interface TruckLog {
  id: number;
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
  rfidTags: string;
}

export interface LocationPayload {
  truckId: string;
  latitude: number;
  longitude: number;
  rfidTags?: string;
}

export interface LastPosition {
  truckId: string;
  latitude: number;
  longitude: number;
  timestamp: string;
}
