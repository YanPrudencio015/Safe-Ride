import { NextResponse } from "next/server";
import { GetAPIToken } from "@/app/hook/APIAcess";

export async function POST(request: Request) {
  try {
    const { stateID, cityID, time } = await request.json();

    if (!stateID || !cityID) {
      return NextResponse.json(
        { error: "stateID and cityID are required" },
        { status: 400 },
      );
    }

    const token = await GetAPIToken();

    // Default: last 2 hours if no time provided
    const initialDate =
      time ??
      new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString().slice(0, 19);

    const url = `https://api-service.fogocruzado.org.br/api/v2/occurrences?idState=${stateID}&idCities=${cityID}&initialDate=${initialDate}`;

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}` },
    });

    if (!res.ok) {
      const errBody = await res.text();
      console.error("FC occurrences error:", res.status, errBody);
      return NextResponse.json(
        { error: "Erro on Fogo Cruzado API", detail: errBody },
        { status: res.status },
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Occurrences route error:", error);
    return NextResponse.json(
      { error: "Error on serevr inside" },
      { status: 500 },
    );
  }
}
