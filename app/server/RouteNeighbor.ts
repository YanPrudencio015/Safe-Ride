import * as turf from "@turf/turf";

// Simplify the route and return only the most representative points
function simplifyRoute(coordinates: number[][]): number[][] {
  const line = turf.lineString(coordinates);

  // tolerance: making precision on the zone by the size
  const simplified = turf.simplify(line, {
    tolerance: 0.01,
    highQuality: true,
  });

  return simplified.geometry.coordinates;
}

// Faz reverse geocoding from a point by Mapbox
async function getNeighborhoodFromPoint(
  lng: number,
  lat: number,
  mapboxToken: string,
): Promise<string | null> {
  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?types=neighborhood,locality&language=pt&access_token=${mapboxToken}`;

  const res = await fetch(url);
  const data = await res.json();

  const feature = data.features?.[0];
  return feature?.text ?? null;
}

type NeigborhoodRouteResults = {
  neighborhoods: string[];
  simplified: number[][];
};
// Main function - simplify the route and then search the neighborhoods
export async function getNeighborhoodsFromRoute(
  coordinates: number[][],
  mapboxToken: string,
): Promise<NeigborhoodRouteResults> {
  const simplified = simplifyRoute(coordinates);

  // search all simplify ponts
  const results = await Promise.all(
    simplified.map(([lng, lat]) =>
      getNeighborhoodFromPoint(lng, lat, mapboxToken),
    ),
  );

  // Remove nulls and duplicates
  const neighborhoods = [
    ...new Set(results.filter((name): name is string => name !== null)),
  ];

  // return[ unique,simplified];
  return { neighborhoods, simplified };
}
