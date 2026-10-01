import mapboxgl from "mapbox-gl";
import type { Occurrence } from "@/app/hook/useRouteOccurrences";

type OccurrencesCirclesParams = {
  occurrences: Occurrence[];
  map: mapboxgl.Map;
};

export default function renderOccurrencesCircles({
  occurrences,
  map,
}: OccurrencesCirclesParams) {
  let animationFrameId: number | null = null;

  const geojson: GeoJSON.FeatureCollection = {
    type: "FeatureCollection",
    features: occurrences.map((occ) => ({
      type: "Feature",
      properties: { id: occ.id },
      geometry: {
        type: "Point",
        coordinates: [occ.longitude, occ.latitude],
      },
    })),
  };

  const animatePulse = () => {
    const duration = 1500;
    const startTime = performance.now();

    const step = (now: number) => {
      const elapsed = (now - startTime) % duration;
      const progress = elapsed / duration; // 0 → 1, reinicia

      // Outer ring: expands from 8 to 28 and fades OUT — never comes back
      const pulseRadius = 8 + progress * 20;
      const pulseOpacity = 0.6 * (1 - progress); // 0.6 → 0, then resets

      if (map.getLayer("circles-pulse-layer")) {
        map.setPaintProperty(
          "circles-pulse-layer",
          "circle-radius",
          pulseRadius,
        );
        map.setPaintProperty(
          "circles-pulse-layer",
          "circle-opacity",
          pulseOpacity,
        );
      }

      // Inner core stays solid — no changes here
      animationFrameId = requestAnimationFrame(step);
    };

    if (animationFrameId) cancelAnimationFrame(animationFrameId);
    animationFrameId = requestAnimationFrame(step);
  };

  const paint = () => {
    // Cancel the previous animation before all
    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId);
      animationFrameId = null;
    }

    // Remove previous layers and source if exist it
    if (map.getLayer("circles-pulse-layer"))
      map.removeLayer("circles-pulse-layer");
    if (map.getLayer("circles-layer")) map.removeLayer("circles-layer");
    if (map.getSource("circles-source")) map.removeSource("circles-source");

    // Recreate it
    map.addSource("circles-source", { type: "geojson", data: geojson });

    map.addLayer({
      id: "circles-pulse-layer",
      type: "circle",
      source: "circles-source",
      paint: {
        "circle-radius": 8,
        "circle-color": "#EF4444",
        "circle-opacity": 0.5,
        "circle-stroke-width": 0,
      },
    });

    map.addLayer({
      id: "circles-layer",
      type: "circle",
      source: "circles-source",
      paint: {
        "circle-radius": 8,
        "circle-color": "#EF4444",
        "circle-opacity": 0.9,
        "circle-stroke-width": 0,
      },
    });

    animatePulse();
  };

  if (map.isStyleLoaded()) paint();
  else map.once("load", paint);

  // Cleanup — cancels animation when component unmounts or occurrences change
  return () => {
    if (animationFrameId) cancelAnimationFrame(animationFrameId);
  };
}
