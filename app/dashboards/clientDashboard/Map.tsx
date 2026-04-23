"use client";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import { useEffect, useRef, useState } from "react";

import { UseRiskZones } from "@/app/hook/useRiskZones";
import {
  useRouteOccurrences,
  type Occurrence,
} from "@/app/hook/useRouteOccurrences";

// types
type MapProps = {
  routeGeoData: GeoJSON.LineString | null;
  incidents: { id: string; latitude: number; longitude: number }[];
};
const SOURCE_ID = "risk-zones";
const OCCURRENCE_LAYER_ID = "route-occurrences";

export default function Passenger({ routeGeoData, incidents }: MapProps) {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const MapContainerRef = useRef<HTMLDivElement>(null);
  const pendingRouteRef = useRef<GeoJSON.LineString | null>(null);
  const occurrenceMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const riskZones = UseRiskZones(incidents);
  const markRef = useRef<mapboxgl.Marker[]>([]);
  const [coordinatesMatching, setcoordinatesMatching] =
    useState<GeoJSON.LineString | null>(null);
  const [moveEvent, setMoveEvent] = useState<mapboxgl.MapMouseEvent | null>(
    null,
  );
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [MarkCount, setMarkCount] = useState(0);

  // Fetch occurrences near the current route
  const { occurrences, loading: occLoading } = useRouteOccurrences(
    routeGeoData || coordinatesMatching,
  );

  // --- before all, start the map from MAPBOX ---------------
  // this form avoid errors that needs the map loaded
  useEffect(() => {
    if (!MapContainerRef.current) return;

    mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAP_TOKEN!;
    mapRef.current = new mapboxgl.Map({
      // Map Creation
      container: MapContainerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [-43.25296155409677, -22.87598557368733],
      zoom: 9,
    });

    // Here, I check if has a data for route before load the map. If yes, I can't call DrawRoute, Then, I
    // save the data inside pendingRouteRef, once it works, when The map loads,
    //  there will not reason to keep the data, then clear it
    mapRef.current.on("load", () => {
      if (pendingRouteRef.current) {
        drawRoute(mapRef.current!, pendingRouteRef.current);
        pendingRouteRef.current = null;
      }
    });

    return () => mapRef.current?.remove();
  }, []);

  // --- Capture click on map -------------------------------------------------

  // On this case, check if map loaded.
  // Then check where the user click on the map, save the data on setMoveEvent
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: mapboxgl.MapMouseEvent) => setMoveEvent(e);
    map.on("click", handler);
    return () => {
      map.off("click", handler);
    };
  }, []);

  // create a Mark by the coordinates an then add it on the map
  useEffect(() => {
    if (!mapRef.current || !moveEvent) return;

    const newMark = new mapboxgl.Marker()
      .setLngLat([moveEvent.lngLat.lng, moveEvent.lngLat.lat])
      .addTo(mapRef.current);

    // add the Mark on map
    markRef.current?.push(newMark);
    setMarkCount((prev) => prev + 1);
  }, [moveEvent]);

  // --- create the second Mark
  useEffect(() => {
    if (!moveEvent) return;
    setCoordinates((prev) => [
      ...prev,
      [moveEvent.lngLat.lng, moveEvent.lngLat.lat],
    ]);
  }, [moveEvent]);

  // --- Create route when has two marks added on the map -------------------------------------
  useEffect(() => {
    if (coordinates.length !== 2) return;

    const coords = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";");

    async function newRoute() {
      const newRoute = await fetch(
        `api/coordinates?coordinates=${coords}`,
      ).then((data) => data.json());

      const direction = await fetch("/api/matching", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          origin: newRoute.waypoints[0].location,
          destination: newRoute.waypoints[1].location,
        }),
      }).then((r) => r.json());

      setcoordinatesMatching(direction);
      markRef.current.forEach((m) => m.remove());
      markRef.current = [];
      setMarkCount(0);
      setCoordinates([]);
      setMoveEvent(null);
    }

    // console.log("coordinates: ", coordinates);
    newRoute();
  }, [coordinates]);

  // --- React to new externals route data -----------------------------------

  useEffect(() => {
    // check if the map isn't disponible and if is posible to check the map style

    // prevest the execution, if doesn't have any route data
    if (!routeGeoData) return;

    const map = mapRef.current;

    // if the map and styles doens't loaded, then, save the route data
    // avoiding erro when draw in a layout that doesn't not exist.
    if (!map || !map.isStyleLoaded()) {
      pendingRouteRef.current = routeGeoData;
      return;
    }

    drawRoute(map, routeGeoData);
  }, [routeGeoData]);

  useEffect(() => {
    // Prevent execution if there is no match with the coordinates
    if (!coordinatesMatching) return;

    const map = mapRef.current;

    // if the map and styles doens't loaded, then, save the matching coordinates data
    if (!map || !map.isStyleLoaded()) {
      pendingRouteRef.current = coordinatesMatching;
      return;
    }

    drawRoute(map, coordinatesMatching);

    console.log("coordinatesMatching: ", coordinatesMatching);
  }, [coordinatesMatching]);

  // Clear from the map old occurrences circles
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Remove previous occurrence markers
    occurrenceMarkersRef.current.forEach((m) => m.remove());
    occurrenceMarkersRef.current = [];

    if (!occurrences.length) return;
  }, [occurrences]);

  // draw the route on the map
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

  //  update dangerous zones
  //  Create or update the occurrences circles
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !occurrences.length) return;

    // make a FeatureCollection with all the occurrences
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

    console.log("geojson : ", geojson);

    const paint = () => {
      // if the source aready exist, only update teh datas
      if (map.getSource("circles-source")) {
        (map.getSource("circles-source") as mapboxgl.GeoJSONSource).setData(
          geojson,
        );
        return;
      }

      // First time: create source + layer
      map.addSource("circles-source", { type: "geojson", data: geojson });

      map.addLayer({
        id: "circles-layer",
        type: "circle",
        source: "circles-source",
        paint: {
          "circle-radius": 50,
          "circle-color": "#EF4444",
          "circle-opacity": 0.6,
          "circle-stroke-width": 2,
          "circle-stroke-color": "#FFFFFF",
        },
      });
    };

    if (map.isStyleLoaded()) paint();
    else map.once("load", paint);
  }, [occurrences]);
  return (
    <section
      className="relative w-[95%] md:w-[95%] h-[20em] md:h-[30em] 
    rounded-[10px] bg-white overflow-hidden"
    >
      <div ref={MapContainerRef} className="w-full h-full" />

      {/* Loading indicator while fetching occurrences */}
      {occLoading && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(20,20,20,0.85)",
            color: "#fff",
            padding: "6px 16px",
            borderRadius: 20,
            fontSize: 12,
            fontFamily: "sans-serif",
            backdropFilter: "blur(8px)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            zIndex: 10,
          }}
        >
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: "50%",
              background: "#FF3B3B",
              display: "inline-block",
              animation: "pulse-dot 1s infinite",
            }}
          />
          Verificando ocorrências na rota…
        </div>
      )}

      {/* Alert banner when occurrences found */}
      {!occLoading && occurrences.length > 0 && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(255,59,59,0.92)",
            color: "#fff",
            padding: "8px 18px",
            borderRadius: 20,
            fontSize: 13,
            fontFamily: "sans-serif",
            fontWeight: 600,
            backdropFilter: "blur(8px)",
            boxShadow: "0 4px 20px rgba(255,59,59,0.4)",
            zIndex: 10,
            whiteSpace: "nowrap",
          }}
        >
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
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }
      `}</style>
    </section>
  );
}
