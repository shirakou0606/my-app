exports.handler = async (event) => {
  const cookie = event.headers.cookie || event.headers.Cookie || "";
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
    body: JSON.stringify({
      hasCookieHeader: !!cookie,
      cookieHeader: cookie,
      note: "login後にここを開いて cookieHeader に session=... が入っていれば Cookie送信は成功"
    })
  };
};
