const ORIGIN = "https://silly-empanada-4cfc7a.netlify.app";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "POST,OPTIONS",
    "Vary": "Origin"
  };
}

exports.handler = async (event) => {
  // Preflight
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, headers: corsHeaders(), body: "Method Not Allowed" };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return {
        statusCode: 400,
        headers: corsHeaders(),
        body: JSON.stringify({ error: "Missing email or password" })
      };
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": SUPABASE_ANON_KEY
      },
      body: JSON.stringify({ email, password })
    });

    const data = await res.json();

    if (!res.ok || !data?.access_token) {
      return {
        statusCode: 401,
        headers: corsHeaders(),
        body: JSON.stringify({ error: data?.error_description || "Login failed" })
      };
    }

    return {
      statusCode: 200,
      headers: {
        ...corsHeaders(),
        "Set-Cookie": `session=${data.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=86400`,
        "Content-Type": "application/json",
        "Cache-Control": "no-store"
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: String(e) }) };
  }
};
