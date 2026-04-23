export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const endereco = searchParams.get("address");

  if (!endereco) {
    return Response.json(
      { error: "Erro to find the address" },
      { status: 400 },
    );
  }

  const token = process.env.NEXT_PUBLIC_MAP_TOKEN;

  const url = new URL(
    `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(endereco)}.json`,
  );

  url.searchParams.set("access_token", token!);
  url.searchParams.set("language", "pt");
  url.searchParams.set("country", "BR");
  url.searchParams.set("proximity", "-43.1729,-22.9068");
  url.searchParams.set(
    "types",
    "address,poi,place,neighborhood,locality,district",
  );

  try {
    const routeResponse = await fetch(url.toString());
    const data = await routeResponse.json();
    return Response.json(data);
  } catch (error) {
    return Response.json({ error: "Erro in server" }, { status: 500 });
  }
}
