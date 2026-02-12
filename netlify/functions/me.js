const ORIGIN = "https://silly-empanada-4cfc7a.netlify.app";

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": ORIGIN,
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type",
    "Access-Control-Allow-Methods": "GET,OPTIONS",
    "Vary": "Origin"
  };
}

function getCookie(event, name) {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const parts = cookie.split(";").map(v => v.trim());
  const found = parts.find(p => p.startsWith(name + "="));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : null;
}

exports.handler = async (event) => {
  if (event.httpMethod === "OPTIONS") {
    return { statusCode: 204, headers: corsHeaders(), body: "" };
  }

  try {
    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    const token = getCookie(event, "session");
    if (!token) {
      return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ loggedIn: false }) };
    }

    const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
      method: "GET",
      headers: {
        "apikey": SUPABASE_ANON_KEY,
        "Authorization": `Bearer ${token}`
      }
    });

    const data = await res.json();

    if (!res.ok || !data?.email) {
      return { statusCode: 401, headers: corsHeaders(), body: JSON.stringify({ loggedIn: false }) };
    }

    return {
      statusCode: 200,
      headers: { ...corsHeaders(), "Content-Type": "application/json", "Cache-Control": "no-store" },
      body: JSON.stringify({ loggedIn: true, email: data.email })
    };
  } catch (e) {
    return { statusCode: 500, headers: corsHeaders(), body: JSON.stringify({ error: String(e) }) };
  }
};
