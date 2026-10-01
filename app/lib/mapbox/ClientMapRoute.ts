"use client";
import mapboxgl from "mapbox-gl";
import { useEffect, useRef } from "react";

type ClientMapRouteParams = {
  coordinates: [number, number][] | [string, string];
  mapRef: React.RefObject<mapboxgl.Map | null>;
};

export default async function ClientMapRoute({
  coordinates,
  mapRef,
  // setcoordinatesMatching,
}: ClientMapRouteParams) {
  if (
    coordinates.map((test) => typeof test[0] === "number") &&
    coordinates.length !== 2
  )
    return;

  let direction: any = null;
  const coords = coordinates.map(([lng, lat]) => `${lng},${lat}`).join(";");
  direction = await fetch(`api/route?param=${coords}`).then((res) =>
    res.json(),
  );
  const map = mapRef.current;

  if (map) {
    // Remove all layer associets from old one
    if (map.getLayer("circles-layer")) map.removeLayer("circles-layer");
    if (map.getLayer("circles-pulse-layer"))
      map.removeLayer("circles-pulse-layer");

    if (map.getSource("circles-source")) map.removeSource("circles-source");
  }

  return direction;
}
