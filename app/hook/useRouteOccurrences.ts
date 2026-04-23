import { useEffect, useState } from "react";

export type Occurrence = {
  id: string;
  latitude: number;
  longitude: number;
  address?: string;
  date?: string;
};

type RouteOccurrences = {
  occurrences: Occurrence[];
  loading: boolean;
  error: string | null;
};

function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9\s]/g, "")
    .trim();
}

// Haversine distance in km between two coordinates
function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

// Check if a point is within RADIUS_KM of any coordinate in the route
function isNearRoute(
  occLat: number,
  occLng: number,
  routeCoords: number[][],
  radiusKm = 0.5,
): boolean {
  return routeCoords.some(
    ([lng, lat]) => distanceKm(lat, lng, occLat, occLng) <= radiusKm,
  );
}

async function resolveLocation(lng: number, lat: number) {
  // 1. Reverse geocode via Mapbox
  const geoRes = await fetch("/api/MAPBOX/localOcorrences", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ lng, lat }),
  });
  const geo = await geoRes.json();

  const features = geo.features?.[0];
  const allContexts = [features, ...(features?.context ?? [])];

  const cityName =
    allContexts.find((c: any) => c?.id?.startsWith("place."))?.text ??
    allContexts.find((c: any) => c?.id?.startsWith("district."))?.text ??
    null;

  if (!cityName) return null;

  // 2. Match city in FC
  const citiesRes = await fetch("/api/FOGO-CRUZADO/cities");
  const citiesData = await citiesRes.json();

  const match = citiesData.data?.find(
    (city: { id: string; name: string; state?: { id: string } }) =>
      normalize(city.name) === normalize(cityName),
  );

  if (!match) return null;

  // FC cities usually return { id, name, state: { id, name } }
  return {
    cityId: match.id,
    stateId: match.state?.id ?? null,
  };
}

export function useRouteOccurrences(
  routeGeoData: GeoJSON.LineString | null,
): RouteOccurrences {
  const [occurrences, setOccurrences] = useState<Occurrence[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!routeGeoData) {
      setOccurrences([]);
      return;
    }

    let cancelled = false;

    async function fetchOccurrences() {
      setLoading(true);
      setError(null);

      try {
        const coords = routeGeoData!.coordinates;
        const originCoord = coords[0];
        const destCoord = coords[coords.length - 1];

        // Resolve both endpoints in parallel
        const [originLoc, destLoc] = await Promise.all([
          resolveLocation(originCoord[0], originCoord[1]),
          resolveLocation(destCoord[0], destCoord[1]),
        ]);

        // Collect unique cityIds to query
        const locationSet = new Map<
          string,
          { cityId: string; stateId: string | null }
        >();
        if (originLoc?.cityId) locationSet.set(originLoc.cityId, originLoc);
        if (destLoc?.cityId) locationSet.set(destLoc.cityId, destLoc);

        if (locationSet.size === 0) {
          setOccurrences([]);
          return;
        }

        // 2 hours ago in ISO format
        const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)
          .toISOString()
          .slice(0, 19);

        // Fetch occurrences for each city
        const fetchPromises = Array.from(locationSet.values()).map(
          ({ cityId, stateId }) =>
            fetch("/api/FOGO-CRUZADO/occurrences", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                stateID: stateId,
                cityID: cityId,
                time: twoHoursAgo,
              }),
            }).then((r) => r.json()),
        );

        const results = await Promise.all(fetchPromises);

        // Flatten all occurrences from all cities
        const allOccurrences: Occurrence[] = results.flatMap((res) => {
          if (!res?.data) return [];
          return res.data
            .filter((occ: any) => occ.latitude != null && occ.longitude != null)
            .map((occ: any) => ({
              id: occ.id,
              latitude: parseFloat(occ.latitude),
              longitude: parseFloat(occ.longitude),
              address: occ.address ?? "",
              date: occ.date ?? "",
            }));
        });

        // Filter: only keep occurrences near the route (within 500m)
        const nearby = allOccurrences.filter((occ) =>
          isNearRoute(occ.latitude, occ.longitude, coords),
        );

        if (!cancelled) {
          setOccurrences(nearby);
        }
      } catch (err) {
        if (!cancelled) {
          setError("Erro ao buscar ocorrências da rota.");
          console.error(err);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    fetchOccurrences();
    return () => {
      cancelled = true;
    };
  }, [routeGeoData]);

  return { occurrences, loading, error };
}
