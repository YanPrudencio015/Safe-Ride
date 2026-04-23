import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const coordinates = searchParams.get("coordinates");
  const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

  // check if the params is wrong
  if (!coordinates) {
    return Response.json(
      { error: "Error to get the coordinates" },
      { status: 400 },
    );
  }

  const url = new URL(
    `https://api.mapbox.com/directions/v5/mapbox/driving/${coordinates}?access_token=${token}&geometries=geojson&language=pt`,
  );

  try {
    const res = await fetch(url);
    const data = await res.json();
    return Response.json(data);
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { error: "Error to find the route" },
      { status: 500 },
    );
  }
}
