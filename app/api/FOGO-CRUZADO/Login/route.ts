import { error } from "console";
import { NextResponse } from "next/server";

export async function POST() {
  const response = await fetch(
    "https://api-service.fogocruzado.org.br/api/v2/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: process.env.FOGO_CRUZADO_EMAIL,
        password: process.env.FOGO_CRUZADO_PASSWORD,
      }),
    },
  );

  const data = await response.json();

  if (!response.ok) {
    NextResponse.json(
      { error: "Error to search the API FOGO CRUZADO response" },
      { status: response.status },
    );
  }
  return NextResponse.json(data);
}
