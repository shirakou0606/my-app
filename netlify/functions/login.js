const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

exports.handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const { email, password } = JSON.parse(event.body || "{}");
    if (!email || !password) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing email or password" }) };
    }

    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error || !data?.session?.access_token) {
      return { statusCode: 401, body: JSON.stringify({ error: error?.message || "Login failed" }) };
    }

    return {
      statusCode: 200,
      headers: {
        "Set-Cookie": `session=${data.session.access_token}; HttpOnly; Secure; SameSite=Lax; Path=/`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ ok: true })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
