"use client";

import { useEffect, useState } from "react";
import { json } from "stream/consumers";
import Home from "./page";
import Passenger from "./dashboards/clientDashboard/Map";
import { GetAPIToken } from "./hook/APIAcess";

import dynamic from "next/dynamic";

const FormClient = dynamic(() => import("@/app/components/FormClient"), {
  ssr: false,
});

const incidents = [
  { id: "1", latitude: -22.9068, longitude: -43.1729 }, // example to destact an area. This code will already be used
];

export default function SafeRideApp() {
  const [routeGeoData, setRouteGeoData] = useState(null);

  // function get both locations: origin and destination, make a matching with then by API,
  // end then, return a data of route
  async function handleRoute(origin: string, destination: string) {
    const [OriginCode, destinationCode] = await Promise.all([
      fetch(`/api/route?address=${origin}`).then((req) => req.json()),
      fetch(`/api/route?address=${destination}`).then((req) => req.json()),
    ]);

    const originCoords = OriginCode.features[0].center;
    const destinationCoords = destinationCode.features[0].center;

    //   search the direction with the cordenates
    const directions = await fetch("/api/matching", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: originCoords,
        destination: destinationCoords,
      }),
    }).then((r) => r.json());

    setRouteGeoData(directions);
  }

  GetAPIToken();
  return (
    <div
      className="relative flex justify-between flex-col lg:flex-row items-center lg:items-start h-full
      w-full pb-3 lg:pb-0"
    >
      <FormClient onSubmit={handleRoute} />
      {/* map square for the passanger */}
      <Passenger routeGeoData={routeGeoData} incidents={incidents} />
    </div>
  );
}
{
}
