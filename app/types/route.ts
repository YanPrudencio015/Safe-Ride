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
