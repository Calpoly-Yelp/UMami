const http = require("node:http");

const replacement = "https://api.umami.elischiffler.dev";
const retiredBody = JSON.stringify({
   retired: true,
   replacement,
});
const headers = {
   "Content-Type": "application/json; charset=utf-8",
   "Cache-Control": "no-store",
   "X-Content-Type-Options": "nosniff",
};

const server = http.createServer((request, response) => {
   const healthy =
      (request.method === "GET" ||
         request.method === "HEAD") &&
      request.url === "/health";
   response.writeHead(healthy ? 200 : 410, headers);
   response.end(
      healthy
         ? JSON.stringify({
              ok: true,
              retired: true,
              replacement,
           })
         : retiredBody,
   );
});

// Node handles these methods outside the ordinary request event.
const rejectTunnel = (_request, socket) => {
   socket.end(
      "HTTP/1.1 410 Gone\r\n" +
         "Content-Type: application/json; charset=utf-8\r\n" +
         "Cache-Control: no-store\r\n" +
         "Connection: close\r\n" +
         `Content-Length: ${Buffer.byteLength(retiredBody)}\r\n\r\n` +
         retiredBody,
   );
};
server.on("connect", rejectTunnel);
server.on("upgrade", rejectTunnel);
server.requestTimeout = 10000;
server.headersTimeout = 10000;
server.listen(
   Number(process.env.PORT || 8080),
   "0.0.0.0",
   () => {
      console.log(
         `Retired API listening on port ${server.address().port}`,
      );
   },
);

for (const signal of ["SIGTERM", "SIGINT"]) {
   process.on(signal, () => server.close());
}
