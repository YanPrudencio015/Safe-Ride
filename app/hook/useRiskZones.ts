import { useEffect, useState } from "react";
import { booleanPointInPolygon, point } from "@turf/turf";
import type { Feature, Polygon, MultiPolygon, Geometry } from "geojson";

type Incident = {
  id: string;
  latitude: number;
  longitude: number;
};

//  -------------- to close the ring --------------------------

function closeRings(geometry: Geometry): Geometry {
  if (geometry.type === "Polygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((ring) => {
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first[0] !== last[0] || first[1] !== last[1]) {
          return [...ring, first];
        }
        return ring;
      }),
    };
  }

  if (geometry.type === "MultiPolygon") {
    return {
      ...geometry,
      coordinates: geometry.coordinates.map((polygon) =>
        polygon.map((ring) => {
          const first = ring[0];
          const last = ring[ring.length - 1];
          if (first[0] !== last[0] || first[1] !== last[1]) {
            return [...ring, first];
          }
          return ring;
        }),
      ),
    };
  }

  return geometry;
}

export function UseRiskZones(incidents: Incident[]) {
  const [riskZones, setRiskZones] = useState<GeoJSON.FeatureCollection>({
    type: "FeatureCollection",
    features: [],
  });

  useEffect(() => {
    if (!incidents.length) return;

    async function calculate() {
      const res = await fetch("/geodata/rio.json");
      const neighborhoods: GeoJSON.FeatureCollection = await res.json();

      // Check all the polygons before use
      const fixed = neighborhoods.features.map((f) => ({
        //
        ...f,
        geometry: closeRings(f.geometry),
      }));

      const affected = fixed.filter((neighborhood) => {
        if (
          neighborhood.geometry.type !== "Polygon" &&
          neighborhood.geometry.type !== "MultiPolygon"
        ) {
          return false;
        }

        return incidents.some((incident) => {
          const pt = point([incident.longitude, incident.latitude]);
          return booleanPointInPolygon(
            pt,
            neighborhood as Feature<Polygon | MultiPolygon>,
          );
        });
      });
      setRiskZones({
        type: "FeatureCollection",
        features: affected,
      });
    }

    calculate();
  }, [incidents]);

  return riskZones;
}
