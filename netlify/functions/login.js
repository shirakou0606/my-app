exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const SUPABASE_URL = process.env.SUPABASE_URL;
    const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY;

    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email or password" }) };
    }

    // Supabase Auth REST: password grant
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
      return { statusCode: 401, body: JSON.stringify({ error: data?.error_description || data?.msg || "Login failed" }) };
    }

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `session=${data.access_token}; HttpOnly; Secure; SameSite=None; Path=/; Max-Age=86400`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
