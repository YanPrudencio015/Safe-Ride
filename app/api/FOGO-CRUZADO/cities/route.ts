import { NextResponse } from "next/server";

import { GetAPIToken } from "@/app/hook/APIAcess";

export async function GET(request: Request) {
  const token = await GetAPIToken();
  try {
    const response = await fetch(
      `https://api-service.fogocruzado.org.br/api/v2/cities`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    );
    const data = await response.json();

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
