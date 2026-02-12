exports.handler = async () => {
  return {
    statusCode: 200,
    headers: {
      "Set-Cookie": "session=; HttpOnly; Secure; SameSite=Lax; Path=/; Max-Age=0",
      "Content-Type": "application/json"
    },
    body: JSON.stringify({ ok: true })
  };
};
