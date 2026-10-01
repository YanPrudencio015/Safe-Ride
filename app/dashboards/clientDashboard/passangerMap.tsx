"use client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { UseRiskZones, Incident } from "@/app/hook/useRiskZones";
import { useRouteOccurrences } from "@/app/hook/useRouteOccurrences";
import MapboxClient from "@/app/lib/mapbox/ClientMap";
import { useMapClickMarker } from "@/app/hook/mapbox/ClientMapMarker";
import DangerousZone from "@/app/lib/pipeline/neighborhoodsNews";
import ClientMapRoute from "@/app/lib/mapbox/ClientMapRoute";
import renderOccurrencesCircles from "@/app/lib/mapbox/OccurrencesCicles";
import { useMapRiskZones } from "@/app/hook/dangerousNeighborhoods/useMapRiskZones";

type MapProps = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  occurrenceMarkersRef: React.RefObject<mapboxgl.Marker[]>;
  markRef: React.RefObject<mapboxgl.Marker[]>;
  pendingRouteRef: React.RefObject<GeoJSON.LineString | null>;
};

export default function PassengerMap({
  mapRef,
  occurrenceMarkersRef,
  markRef,
  pendingRouteRef,
}: MapProps) {
  const MapContainerRef = useRef<HTMLDivElement>(null);

  const [riskCoords, setRiskCoords] = useState<Incident[]>([]);
  const [coordinatesMatching, setcoordinatesMatching] =
    useState<GeoJSON.LineString | null>(null);
  const [moveEvent, setMoveEvent] = useState<mapboxgl.MapMouseEvent | null>(
    null,
  );
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [MarkCount, setMarkCount] = useState(0);

  const riskZones = UseRiskZones(riskCoords);

  const { occurrences, loading: occLoading } =
    useRouteOccurrences(coordinatesMatching);

  // Initializes the Mapbox map instance.
  // Returns a cleanup function that removes the map on unmount.
  useEffect(() => {
    return MapboxClient({
      MapContainerRef,
      mapRef,
      pendingRouteRef,
      drawRoute,
    });
  }, []);

  /*
   When input search results arrive, reset all marker-based state
   so the two modes don't conflict with each other.
   FIX: Previously had two separate useEffects doing the same thing,
   causing double setState calls and race conditions.
  
   Captures map click events and passes coordinates up via callback
  */
  const handleCoordsChange = useCallback((newCoord: [number, number]) => {
    setCoordinates((prev) => [...prev, newCoord]);
  }, []);

  useMapClickMarker({
    mapRef,
    onCoordChanges: handleCoordsChange,
    markRef,
  });

  // When two markers are placed, creates a route between them
  useEffect(() => {
    if (coordinates.length !== 2) return;

    async function adressResult() {
      const result = await ClientMapRoute({ coordinates, mapRef });

      setcoordinatesMatching(result);
    }
    setMarkCount(0);
    setCoordinates([]);
    setMoveEvent(null);
    adressResult();
  }, [coordinates]);

  // Runs the AI pipeline when a route is created via markers.
  useEffect(() => {
    if (!coordinatesMatching) return;

    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) {
      pendingRouteRef.current = coordinatesMatching;
      return;
    }

    drawRoute(map, coordinatesMatching);

    const run = async () => {
      setRiskCoords([]);
      const result = await DangerousZone({
        setRiskCoords,
        coordinatesMatching,
      });

      if (result?.incidents) {
        setRiskCoords(result.incidents);
      }

      if (result?.GeminiResponseText) {
        console.log("Gemini response:", result.GeminiResponseText);
      }
    };

    run();
  }, [coordinatesMatching]); // FIX: BoxSearchRiskCoords removed from deps — it was causing the pipeline to re-run on input changes

  // Cleans up occurrence markers when occurrences change
  useEffect(() => {
    const map = mapRef.current;
    if (!map && !markRef) return;
    occurrenceMarkersRef.current.forEach((m) => m.remove());
    occurrenceMarkersRef.current = [];
    markRef.current.forEach((m) => m.remove());
    if (!occurrences.length) return;
  }, [occurrences]);

  // Renders pulsing circles from Fogo Cruzado occurrences on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !occurrences.length) return;
    const cleanup = renderOccurrencesCircles({ occurrences, map });
    return cleanup;
  }, [occurrences]);

  // Highlights dangerous neighborhoods identified by Gemini
  useMapRiskZones({ mapRef, riskZones });

  // Draws the route line and origin/destination markers on the map
  function drawRoute(map: mapboxgl.Map, geometry: GeoJSON.LineString) {
    ["route", "origin-circle", "destination-circle"].forEach((id) => {
      if (map.getLayer(id)) map.removeLayer(id);
      if (map.getSource(id)) map.removeSource(id);
    });

    map.addSource("route", {
      type: "geojson",
      data: { type: "Feature", properties: {}, geometry },
    });

    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: { "line-cap": "round", "line-join": "round" },
      paint: { "line-color": "#19D3DA", "line-width": 5, "line-opacity": 0.9 },
    });

    const first = geometry.coordinates[0];
    const last = geometry.coordinates[geometry.coordinates.length - 1];

    [
      { id: "origin-circle", coords: first, color: "#19D3DA" },
      { id: "destination-circle", coords: last, color: "#BF1363" },
    ].forEach(({ id, coords, color }) => {
      map.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          properties: {},
          geometry: { type: "Point", coordinates: coords },
        },
      });
      map.addLayer({
        id,
        type: "circle",
        source: id,
        paint: { "circle-radius": 10, "circle-color": color },
      });
    });

    const bounds = geometry.coordinates.reduce(
      (acc, coord) => acc.extend(coord as [number, number]),
      new mapboxgl.LngLatBounds(
        geometry.coordinates[0] as [number, number],
        geometry.coordinates[0] as [number, number],
      ),
    );

    map.fitBounds(bounds, { padding: 60, duration: 1000 });
  }

  return (
    <section className="z-10 relative w-full md:w-[95%] h-screen md:h-[30em] rounded-[10px] bg-white overflow-hidden">
      <div ref={MapContainerRef} className="w-full h-full" />

      {/* Loading indicator — shown while Fogo Cruzado occurrences are being fetched */}
      {riskZones && occLoading && (
        <div className="absolute top-0 left-1/2 -translate-x-1/2 bg-black/85 text-white px-4 py-1.5 rounded-full text-xs font-sans backdrop-blur-sm flex items-center gap-2 z-10">
          <span className="w-2 h-2 rounded-full bg-red-500 inline-block animate-pulse" />
          Analizando rota...
        </div>
      )}

      {/* Alert banner — shown when occurrences are found near the route */}
      {!riskZones && !occLoading && occurrences.length > 0 && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-red-500/92 text-white px-4 py-2 rounded-full text-sm font-semibold backdrop-blur-sm shadow-lg shadow-red-500/40 z-10 whitespace-nowrap">
          ⚠ {occurrences.length} ocorrência{occurrences.length > 1 ? "s" : ""}{" "}
          nas últimas 2h na rota
        </div>
      )}

      <style>{`
        @keyframes pulse-ring {
          0%   { transform: scale(0.5); opacity: 0.8; }
          100% { transform: scale(2.2); opacity: 0; }
        }
        @keyframes pulse-core {
          0%, 100% { transform: scale(1); }
          50%       { transform: scale(1.15); }
        }
      `}</style>
    </section>
  );
}
