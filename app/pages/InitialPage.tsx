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

import NavigatioBar from '../components/NavigationBar/NavigationBar';

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


  // get when Any car Service doesn't chosed but the inputs Are full, then show the message.

  // when click to close de background and both fields are full, show the message
  const [formBGToggle, setFormBGToggle] = useState(false);
  const [showMessage, setShowMessage] = useState(false);
  
  useEffect(()=>{
    const allright = coordinates.every(([first, second])=> first !== 0 && second !== 0);
    
    if(allright && !formBGToggle && serviceCar == null){
      setShowMessage(true);
    }
  },[formBGToggle,coordinates,serviceCar])


  return(
    <div className={`absolute min-h-screen pb-[5em] w-full bg-slate-950 flex items-center 
      justify-center z-20  
      ${hideInitial ? `left-[50em]` : `left-0`} flex flex-col justify-around items-center duration-200
       transition-all gap-4`}>
      <div className={`absolute inset-0 
        bg-[repeating-linear-gradient(45deg,#1e293b_0,#1e293b_1px,transparent_0,transparent_50%)] 
        bg-size-[16px_16px] opacity-40 -z-10`}></div>
        
      <h1 className={`${michroma.className} text-[4vh] md:w-[80%] lg:w-1/2 text-white
      w-90 flex  md:items-center lg:items-start md:justify-center lg:justify-start p-2 md:p-2 
      text-center lg:rounded-[20em]`}>
        Where can we take you today?
      </h1>
       <InitialFormNoSSR setCoordinates={setCoordinates} setFormBGToggle={setFormBGToggle}/>
<div
  className={`w-full h-[5vh] flex items-center p-2 relative overflow-hidden
    before:absolute before:bottom-0 before:left-1 before:h-[1px] before:bg-white
    before:transition-all before:ease-in-out
    ${showMessage
      ? "before:w-[60%] before:duration-300 before:delay-0"
      : "before:w-0 before:duration-75"}
  `}
>
  <h1
    className={`${michroma.className} text-[2vh] text-white transition-all ease-in-out
      ${showMessage
        ? "duration-1000 delay-300 translate-y-0 opacity-100"
        : "duration-75 delay-0 translate-y-96 opacity-0"}
    `}
  >
    Choose a ride type
  </h1>
</div>
        <SwiperCarServices setServiceCar={setServiceCar} />
        <button className={`${michroma.className} relative w-90 h-[2em] rounded-[3em] flex justify-center 
          items-center  bg-[#2373F4] border border-white scale-100 active:scale-95 active:border-0 
          focus:scale-100 focus:scale-90`}  
          onClick={()=>{setHidInitial(true)}}> Mark on map</button>

          {/* <NavigatioBar/> */}
    </div>
  )
}