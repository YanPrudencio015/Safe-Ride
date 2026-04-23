import { GetAPIToken } from "@/app/hook/APIAcess";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const cityId = searchParams.get("cityId");
  const token = await GetAPIToken();

  const response = await fetch(
    `https://api-service.fogocruzado.org.br/api/v2/neighborhoods?cityId=${cityId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    },
  );
  const data = await response.json();
  return NextResponse.json(data);
}
