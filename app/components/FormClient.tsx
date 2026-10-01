
import Form from "next/form";
import { useEffect, useRef, useState } from "react";
// fontAwesome
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faLocationDot } from "@fortawesome/free-solid-svg-icons";
import { faClose } from "@fortawesome/free-solid-svg-icons";
import { faBars } from "@fortawesome/free-solid-svg-icons";
import { faLocationCrosshairs } from "@fortawesome/free-solid-svg-icons";
// google fonts
import { Rubik } from "next/font/google";
import { Roboto } from "next/font/google";

// componets
import ClientMapRoute from "../lib/mapbox/ClientMapRoute";
import DrawingRoute from "../lib/mapbox/DrawingRoute";
import { useRouteOccurrences } from "../hook/useRouteOccurrences";
import { SearchBox } from "@mapbox/search-js-react";
import renderOccurrencesCircles from "../lib/mapbox/OccurrencesCicles";
import { UseRiskZones, Incident } from "../hook/useRiskZones";
import DangerousZone from "../lib/pipeline/neighborhoodsNews";
import { useMapRiskZones } from "../hook/dangerousNeighborhoods/useMapRiskZones";
const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

const rubik = Rubik({
  subsets: ["latin"],
});
const roboto = Roboto({
  subsets: ["latin"],
});

type MapProps = {
  mapRef: React.RefObject<mapboxgl.Map | null>;
  occurrenceMarkersRef: React.RefObject<mapboxgl.Marker[]>;
  markRef: React.RefObject<mapboxgl.Marker[]>;
  pendingRouteRef: React.RefObject<GeoJSON.LineString | null>;
};

export default function FormClient({
  mapRef,
  occurrenceMarkersRef,
  markRef,
  pendingRouteRef,
}: MapProps) {
  const [origin, setOrigin] = useState("");
  const [destination, setDestination] = useState("");
  const [DestinationCoordinates, SetdesinationCoordinates] =
    useState<number[]>();
  const [OriginCoordinates, SetOriginCoordinates] = useState<number[]>();
  const mapMark = useRef<mapboxgl.Marker[]>([]);
  const [riskCoords, setRiskCoords] = useState<Incident[]>([]);
  const [coordinates, setCoordinates] = useState<[number, number][]>([]);
  const [coordinatesMatching, setcoordinatesMatching] =
    useState<GeoJSON.LineString | null>(null);
  const riskZones = UseRiskZones(riskCoords);

  const { occurrences, loading: occLoading } =
    useRouteOccurrences(coordinatesMatching);

  function AllCoordinates() {
    if (OriginCoordinates && DestinationCoordinates) {
      setCoordinates([
        OriginCoordinates as [number, number],
        DestinationCoordinates as [number, number],
      ]);
    }
  }

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
  }, [coordinates]);

  // Cleans up occurrence markers when occurrences change
  useEffect(() => {
    const map = mapRef.current;
    if (!map && !markRef) return;
    occurrenceMarkersRef.current.forEach((m) => m.remove());
    occurrenceMarkersRef.current = [];
    markRef.current.forEach((m) => m.remove());
    if (!occurrences.length) return;
  }, [occurrences]);

  // Renders pulsing circles from Fogo Cruzado occurrences on the map
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !occurrences.length) return;
    const cleanup = renderOccurrencesCircles({ occurrences, map });
    return cleanup;
  }, [occurrences]);

  // runs the pipeline
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

  // Highlights dangerous neighborhoods identified by Gemini
  useMapRiskZones({ mapRef, riskZones });

  return (
    <div
      className=" bg-[#285A48] w-full lg:w-[28em] h-[18em] lg:h-full z-10 flex justify-start 
      items-center flex-col gap-5"
    >
      <div className="w-full flex justify-between flex-row border border-white h-[3em] items-center px-5">
        <h1 className={`${roboto} text-[1.2em]`}>Safe Ride</h1>
        <button type="button">
          <FontAwesomeIcon icon={faBars} className="size-6" />
        </button>
      </div>
      <Form
        action={"/"}
        className="w-full h-[8em]  flex justify-center items-center flex-col px-3 gap-3
          text-[#EEEE] relative before:absolute before:h-px before:w-[80%] before:bg-[#EEEE]"
      >
        <div
          className=" w-full h-[3em]  rounded-2xl  flex justify-between flex-row
          items-center px-4 gap-2"
        >
          <FontAwesomeIcon icon={faLocationCrosshairs} className="size-6" />
          <SearchBox
            accessToken={`${token}`}
            value={origin}
            onChange={(value) => setOrigin(value)}
            onRetrieve={(res) => {
              const coords = res.features[0].geometry.coordinates;
              // setOrigin(res.features[0].properties.full_address);
              SetOriginCoordinates(coords);
            }}
            options={{
              language: "pt",
              country: "BR",
            }}
          />
        </div>
        <div
          className=" w-full h-[3em] rounded-2xl  flex justify-between flex-row
          items-center px-4 gap-2"
        >
          <FontAwesomeIcon icon={faLocationDot} className="size-6 " />
          <SearchBox
            accessToken={`${token}`}
            value={destination}
            onChange={(value) => setDestination(value)}
            onRetrieve={(res) => {
              const coords = res.features[0].geometry.coordinates;
              // setDestination(res.features[0].properties.full_address);
              SetdesinationCoordinates(coords);
            }}
            options={{
              language: "pt",
              country: "BR",
            }}
          />
        </div>
      </Form>
      <button
        className={` w-[90%] h-[3em] rounded-[5em] z-10
      bg-[#075B5E] active:scale-95 transition-all duration-200
      ease-in-out text-white ${rubik.className}`}
        onClick={() => {
          mapMark.current.forEach((m) => m.remove());
          AllCoordinates();
        }}
      >
        SEARCH A DRIVER
      </button>
    </div>
  );
}
