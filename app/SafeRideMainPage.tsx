"use client";

import { useEffect, useState, useRef } from "react";
import { json } from "stream/consumers";
import Home from "./page";
import { GetAPIToken } from "./server/APIAcess";
import { Incident } from "./hook/useRiskZones";
import dynamic from "next/dynamic";
import DangerousZone from "./lib/pipeline/neighborhoodsNews";
import NavigatioBar from "./components/NavigationBar/NavigationBar";
import InitialPage from "./pages/InitialPage";
import PassengerMAP from "./dashboards/clientDashboard/passangerMap";
import mapboxgl from "mapbox-gl";
const FormClient = dynamic(() => import("@/app/components/FormClient"), {
  ssr: false,
});

export default function SafeRideApp() {
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const occurrenceMarkersRef = useRef<mapboxgl.Marker[]>([]);
  const markRef = useRef<mapboxgl.Marker[]>([]);
  const pendingRouteRef = useRef<GeoJSON.LineString | null>(null);
  const [riskCoords, setRiskCoords] = useState<Incident[]>([]);
  const [routeGeoData, setRouteGeoData] = useState(null);

  GetAPIToken();

  return (
    <div
      className="relative flex justify-between flex-col lg:flex-row items-center lg:items-start h-full
      w-full pb-3 lg:pb-0"
    >
      {/* map to the passanger */}
      <PassengerMAP
        mapRef={mapRef}
        occurrenceMarkersRef={occurrenceMarkersRef}
        markRef={markRef}
        pendingRouteRef={pendingRouteRef}
      />

      <InitialPage 
        mapRef={mapRef}
        occurrenceMarkersRef={occurrenceMarkersRef}
        markRef={markRef}
        pendingRouteRef={pendingRouteRef}
      />

      <NavigatioBar/>
    </div>
  );
}
{
}
