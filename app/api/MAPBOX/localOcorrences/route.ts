export async function POST(request: Request) {
  const { lng, lat } = await request.json();
  const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

  const url = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?access_token=${token}`;
  try {
    const response = await fetch(url);
    const data = await response.json();

    return Response.json(data);
  } catch (error) {
    console.log("Error: ", error);
    return Response.json(
      { error: "Error to find the location: " },
      { status: 500 },
    );
  }
}
