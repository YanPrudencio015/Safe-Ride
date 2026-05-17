let tokenInspiration: number = 0;
let token: string | null = null;

export async function GetAPIToken() {
  const now = Date.now();

  if (token && now < tokenInspiration) return token;

  if (
    process.env.FOGO_CRUZADO_EMAIL == undefined &&
    process.env.FOGO_CRUZADO_PASSWORD == undefined
  )
    return;

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
  if (!response.ok) {
    const errorBody = await response.json();
    throw new Error(
      `Auth failed [${response.status}]: ${JSON.stringify(errorBody)}`,
    );
  }
  const data = await response.json();

  if (!data?.data?.accessToken) {
    throw new Error(`Unexpected response shape: ${JSON.stringify(data)}`);
  }
  token = await data.data.accessToken;
  tokenInspiration = now + data.data.expiresIn * 1000;
  return token;
}
