import { Incident } from "@/app/hook/useRiskZones";

type DangerousZoneParams = {
  setRiskCoords: React.Dispatch<React.SetStateAction<Incident[]>>;
  coordinatesMatching: GeoJSON.LineString;
};

export default async function DangerousZone({
  setRiskCoords,
  coordinatesMatching,
}: DangerousZoneParams) {
  setRiskCoords([]);

  const res = await fetch("/api/route-analysis", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      coordinates: coordinatesMatching.coordinates,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    console.error("route-analysis falhou:", res.status, text);
    return;
  }

  const data = await res.json();

  if (!data.GeminiResponded?.result) {
    console.warn("Gemini didn't find the result");
    return;
  }

  const allCords = data.GeminiResponded.result[1].map((c: any) => c.coord);

  const GeminiResponseText = data.GeminiResponded.result[0];

  const incidents = allCords.map(
    ([lng, lat]: [number, number], index: number) => ({
      id: String(index),
      latitude: lat,
      longitude: lng,
    }),
  );

  // It's nessessary return the Gemini Response too
  return { incidents, GeminiResponseText };
}
