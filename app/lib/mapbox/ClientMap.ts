import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";

type MapboxClientParams = {
  MapContainerRef: React.RefObject<HTMLDivElement | null>;
  mapRef: React.RefObject<mapboxgl.Map | null>;
  pendingRouteRef: React.RefObject<GeoJSON.LineString | null>;
  drawRoute: (map: mapboxgl.Map, geometry: GeoJSON.LineString) => void;
};

export default function MapboxClient({
  MapContainerRef,
  mapRef,
  pendingRouteRef,
  drawRoute,
}: MapboxClientParams) {
  if (!MapContainerRef.current) return;

  mapboxgl.accessToken = process.env.NEXT_PUBLIC_MAP_TOKEN;

  const map = new mapboxgl.Map({
    container: MapContainerRef.current,
    style: "mapbox://styles/yanpereira015/cmud74wcn008201s689hzdtzp",
    center: [-43.25296155409677, -22.87598557368733],
    zoom: 9,
  });
  mapRef.current = map;

  map.on("load", () => {
    if (pendingRouteRef.current) {
      drawRoute(map, pendingRouteRef.current);
      pendingRouteRef.current = null;
    }
  });

  return () => {
    map.remove();
    mapRef.current = null;
  };
}