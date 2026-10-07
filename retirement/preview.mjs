import { createServer } from "node:http";
import { readFile } from "node:fs/promises";

const root = new URL("./dist/frontend/", import.meta.url);
const config = JSON.parse(
   await readFile(
      new URL("staticwebapp.config.json", root),
      "utf8",
   ),
);
const server = createServer(async (req, res) => {
   const path = new URL(req.url, "http://localhost")
      .pathname;
   // A local fixture for browser checks, not an Azure routing emulator.
   if (
      config.routes.some((route) =>
         route.route.endsWith("*")
            ? path.startsWith(route.route.slice(0, -1))
            : path === route.route,
      )
   ) {
      res.writeHead(410, config.globalHeaders);
      res.end();
      return;
   }
   const file =
      path === "/notice.css" ? "notice.css" : "index.html";
   res.writeHead(200, {
      ...config.globalHeaders,
      "Content-Type": file.endsWith(".css")
         ? "text/css"
         : "text/html",
   });
   res.end(await readFile(new URL(file, root)));
});
server.listen(
   Number(process.env.PORT || 8089),
   "127.0.0.1",
   () => {
      console.log(
         `Notice preview on port ${server.address().port}`,
      );
   },
);
for (const signal of ["SIGTERM", "SIGINT"]) {
   process.on(signal, () => server.close());
}
