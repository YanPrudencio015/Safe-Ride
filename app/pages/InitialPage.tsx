"use client";
import dynamic from 'next/dynamic';
import { Michroma, Chathura, Homenaje } from "next/font/google";

// components
import SwiperCarServices from "../components/InitialPageComponents/SwiperCarServices";
import { useEffect, useState } from 'react';
const InitialFormNoSSR = dynamic(
  () => import('../components/InitialPageComponents/InitialForm'),
  { ssr: false }
);

// import type
import { CarsService, MapProps } from '../types/route';
import { Incident } from '../hook/useRiskZones';
import { UseRiskZones } from '../hook/useRiskZones';

// hooks and libs
import ClientMapRoute from '../lib/mapbox/ClientMapRoute';
import DrawingRoute from '../lib/mapbox/DrawingRoute';
import { useRouteOccurrences } from '../hook/useRouteOccurrences';
import renderOccurrencesCircles from '../lib/mapbox/OccurrencesCicles';
import DangerousZone from '../lib/pipeline/neighborhoodsNews';
import { useMapRiskZones } from '../hook/dangerousNeighborhoods/useMapRiskZones';

const michroma = Michroma({
  weight: "400",
  subsets: ["latin"],
});
const didactGothic = Chathura({
  weight: "400",
  subsets: ["latin"],
});
const homenaje = Homenaje({
  weight: "400",
  subsets: ["latin"],
});

export default function InitialPage({
  mapRef,
  occurrenceMarkersRef,
  markRef,
  pendingRouteRef,
}: MapProps) {
  const [coordinates, setCoordinates] = useState<[number, number][]>([[0,0]]);
  const [serviceCar, setServiceCar] = useState<CarsService | null>(null);
  const [hideInitial, setHidInitial] = useState(false);
  const [coordinatesMatching, setcoordinatesMatching] =
    useState<GeoJSON.LineString | null>(null);
  const [riskCoords, setRiskCoords] = useState<Incident[]>([]);
  const riskZones = UseRiskZones(riskCoords);
  const { occurrences, loading: occLoading } =
    useRouteOccurrences(coordinatesMatching);
const [condition, setCondition] = useState(false);

const[changetoMap, setChangetoMap] = useState(false); // button to open map


useEffect(()=>{
    const allright = coordinates.every(([first, second])=> first !== 0 && second !== 0);

    if(allright && serviceCar){
      setCondition(true);
      setHidInitial(true);
    }
},[coordinates,serviceCar])


  // create an route on map when two coordinates was been difined.
  useEffect(() => {
    async function test() {
      if (!mapRef) return;
      if (coordinates.length !== 2) return;

      const waitForMap = () =>
        new Promise<void>((resolve) => {
          if (mapRef.current?.isStyleLoaded()) {
            resolve();
          } else {
            mapRef.current?.once("style.load", () => resolve());
          }
        });

      await waitForMap();
      const result = await ClientMapRoute({ coordinates, mapRef });
      setcoordinatesMatching(result);
      if (!result) return;

      DrawingRoute(mapRef.current, result);
    }

    test();
  }, [condition]);

  // clean the occurences marks when the route changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map && !markRef) return;
    occurrenceMarkersRef.current.forEach((m) => m.remove());
    occurrenceMarkersRef.current = [];
    markRef.current.forEach((m) => m.remove());
    if (!occurrences.length) return;
  }, [occurrences]);

  // Render pulsating occurences circles from FOGO CRUZADO API on map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !occurrences.length) return;
    const cleanup = renderOccurrencesCircles({ occurrences, map });
    return cleanup;
  }, [condition]);

  // Runs the risk zones pipeline
  useEffect(() => {
    if (!coordinatesMatching) return;

    const map = mapRef.current;

    if (!map || !map.isStyleLoaded()) {
      pendingRouteRef.current = coordinatesMatching;

      DrawingRoute(map, coordinatesMatching);

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
    }
  }, [coordinatesMatching]);

  // Distact the neighborhoods checked by Gemini
  useMapRiskZones({ mapRef, riskZones });

  return (
    <div
      className={`z-20 px-5 absolute w-full h-[40em] bg-[#091413] 
        text-2xl flex justify-start items-center
        flex-col gap-10 left-0 ${hideInitial ? `left-[50em]` : `left-0`}`}
    >
      <h1 className={`${michroma.className} text-[1.5em] md:text-[2.5em] md:w-full text-white w-90
        md:flex md:items-center md:justify-center md:p-2`}>
        Where can we take you today?
      </h1>

      <InitialFormNoSSR setCoordinates={setCoordinates} />

      <SwiperCarServices setServiceCar={setServiceCar} />
          <button className={`${michroma.className} relative w-90 h-[2em] rounded-[3em] flex justify-center 
          items-center  bg-[#092328] border border-white scale-100 active:scale-95 active:border-0 `}
          
          onClick={()=>{setHidInitial(true)}}> Mark on map</button>
    </div>
  );
}