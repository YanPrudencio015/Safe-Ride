import { json } from "stream/consumers";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const paramRoute = searchParams.get("param");
  const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

  // check how the coordinates are arrive as paramter

  if (paramRoute == null) return;

  const coordinatesPattern =
    /^-?\d+(\.\d+)?,-?\d+(\.\d+)?;-?\d+(\.\d+)?,-?\d+(\.\d+)?$/;
  const isCoordinates = coordinatesPattern.test(paramRoute);

  if (!paramRoute) {
    return Response.json(
      { error: "Erro to find the address" },
      { status: 400 },
    );
  }

  try {
    if (isCoordinates) {
      const url = new URL(
        `https://api.mapbox.com/directions/v5/mapbox/driving/${paramRoute}?geometries=geojson&overview=full&access_token=${token}`,
      );

      url.searchParams.set("access_token", token!);
      url.searchParams.set("geometries", "geojson");
      url.searchParams.set("language", "pt");
      const routeResponse = await fetch(url.toString());
      const data = await routeResponse.json();
      return Response.json(data.routes[0].geometry);
    }
  } catch (error) {
    return Response.json({ error: "Erro in server" }, { status: 500 });
  }
}
