import { NextResponse } from "next/server";

export async function POST(request: Request) {
  const { origin, destination } = await request.json();

  const token = process.env.NEXT_PUBLIC_MAP_TOKEN;
  const url = `https://api.mapbox.com/directions/v5/mapbox/driving/${origin[0]},${origin[1]};${destination[0]},${destination[1]}?geometries=geojson&overview=full&access_token=${token}`;
  try {
    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data.routes[0].geometry);
  } catch (error) {
    console.log("Error: ", error);
    return Response.json(
      { error: "Error to search directions" },
      { status: 500 },
    );
  }
}
