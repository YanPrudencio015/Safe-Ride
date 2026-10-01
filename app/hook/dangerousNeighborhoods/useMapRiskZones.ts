import { useEffect, RefObject } from "react";

interface UseMapRiskZonesProps {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  riskZones: any;
}

export function useMapRiskZones({ mapRef, riskZones }: UseMapRiskZonesProps) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    const draw = () => {
      // clean old informations
      if (map.getLayer("risk-outline")) map.removeLayer("risk-outline");
      if (map.getLayer("risk-fill")) map.removeLayer("risk-fill");
      if (map.getSource("risk-zones")) map.removeSource("risk-zones");

      // if there aren't data, stop after the cleanning
      if (!riskZones || !riskZones.features?.length) return;

      // add new data
      map.addSource("risk-zones", { type: "geojson", data: riskZones });

      map.addLayer({
        id: "risk-fill",
        type: "fill",
        source: "risk-zones",
        paint: {
          "fill-color": "#C44545",
          "fill-opacity": 0.3,
        },
      });
      map.addLayer({
        id: "risk-outline",
        type: "line",
        source: "risk-zones",
        paint: {
          "line-color": "#C44545",
          "line-width": 2,
        },
      });
    };

    // Execute the design of the map
    if (map.isStyleLoaded()) {
      draw();
    } else {
      map.once("style.load", draw);
    }
  }, [riskZones, mapRef]);

  useEffect(() => {}, [riskZones]);
}
