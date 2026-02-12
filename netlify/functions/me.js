const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

function getCookie(event, name) {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  const parts = cookie.split(";").map(v => v.trim());
  const found = parts.find(p => p.startsWith(name + "="));
  return found ? decodeURIComponent(found.split("=").slice(1).join("=")) : null;
}

exports.handler = async (event) => {
  try {
    const token = getCookie(event, "session");
    if (!token) {
      return { statusCode: 401, body: JSON.stringify({ loggedIn: false }) };
    }

    const { data, error } = await supabase.auth.getUser(token);
    if (error || !data?.user) {
      return { statusCode: 401, body: JSON.stringify({ loggedIn: false }) };
    }

    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ loggedIn: true, email: data.user.email })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: String(e) }) };
  }
};
