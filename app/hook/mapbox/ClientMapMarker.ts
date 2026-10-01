"use client";
import mapboxgl from "mapbox-gl";
import { useEffect, useState } from "react";

type ClientMapMarkerParams = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  onCoordChanges: (Coords: [number, number]) => void;
  markRef: React.RefObject<mapboxgl.Marker[]>;
};

export function useMapClickMarker({
  mapRef,
  onCoordChanges,
  markRef,
}: ClientMapMarkerParams) {
  const [moveEvent, setMoveEvent] = useState<mapboxgl.MapMouseEvent | null>(
    null,
  );

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const handler = (e: mapboxgl.MapMouseEvent) => setMoveEvent(e);
    map.on("click", handler);

    return () => {
      map.off("click", handler);
    };
  }, [mapRef]);

  // Create the marker and warn about the new coordinate
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !moveEvent) return;

    if (markRef.current.length >= 2) {
      markRef.current.forEach((marker) => marker.remove());
      markRef.current = [];
    }

    const mapMarkers = new mapboxgl.Marker()
      .setLngLat([moveEvent.lngLat.lng, moveEvent.lngLat.lat])
      .addTo(map);

    onCoordChanges([moveEvent.lngLat.lng, moveEvent.lngLat.lat]);

    markRef.current.push(mapMarkers);
  }, [moveEvent, mapRef, onCoordChanges]);
}
