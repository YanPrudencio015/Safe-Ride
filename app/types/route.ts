export type NewsItem = {
  date: string | null;
  fullContent: string;
  link: string;
  neighborhood: string;
  title: string;
};

export type RouteAnalyticsPayload = {
  neighborhoodNames: string[];
  neighborhoodCoordinates: number[][];
  neighborhoodNews: NewsItem[];
  prompt: string;
};


export type CarsService =  {
  service: string,
  description: string,
  price: string,
  seats: number,
  badge: string,
  timer:number
}

export type MapProps = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  occurrenceMarkersRef: React.RefObject<mapboxgl.Marker[]>;
  markRef: React.RefObject<mapboxgl.Marker[]>;
  pendingRouteRef: React.RefObject<GeoJSON.LineString | null>;
};

