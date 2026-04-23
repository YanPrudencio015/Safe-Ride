let tokenInspiration: number = 0;
let token: string | null = null;

export async function GetAPIToken() {
  const now = Date.now();

  if (token && now < tokenInspiration) return token;
  const response = await fetch(
    "https://api-service.fogocruzado.org.br/api/v2/auth/login",
    {
      method: "POST",
      headers: { "Content-Type": "Application/json" },
      body: JSON.stringify({
        email: process.env.FOGO_CRUZADO_EMAIL,
        password: process.env.FOGO_CRUZADO_PASSWORD,
      }),
    },
  );

  const data = await response.json();
  token = await data.data.accessToken;
  console.log("token: ", token);
  tokenInspiration = now + data.data.expiresIn * 1000;

  return token;
}
