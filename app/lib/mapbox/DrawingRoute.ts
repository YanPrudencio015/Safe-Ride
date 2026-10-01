import mapboxgl from "mapbox-gl";

export default function DrawingRoute(
  map: mapboxgl.Map | null,
  geometry: GeoJSON.LineString,
) {
  // if (map === null) return;

  ["route", "origin-circle", "destination-circle"].forEach((id) => {
    if (map!.getLayer(id)) map!.removeLayer(id);
    if (map!.getSource(id)) map!.removeSource(id);
  });

  map!.addSource("route", {
    type: "geojson",
    data: { type: "Feature", properties: {}, geometry },
  });

  map!.addLayer({
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
    map!.addSource(id, {
      type: "geojson",
      data: {
        type: "Feature",
        properties: {},
        geometry: { type: "Point", coordinates: coords },
      },
    });
    map!.addLayer({
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

  return map!.fitBounds(bounds, { padding: 60, duration: 1000 });
}
