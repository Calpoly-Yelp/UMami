// Preloaded only by the regression test. Any attempted outbound access fails it.
const forbidden = () => {
   process.stderr.write("Unexpected outbound activity\n");
   process.exit(86);
};
require("node:http").request = forbidden;
require("node:http").get = forbidden;
require("node:https").request = forbidden;
require("node:https").get = forbidden;
require("node:net").Socket.prototype.connect = forbidden;
const dns = require("node:dns");
const lookup = dns.lookup;
// Node calls lookup even for the numeric bind address. This resolves locally.
dns.lookup = (host, ...args) =>
   host === "0.0.0.0" ? lookup(host, ...args) : forbidden();
dns.promises.lookup = forbidden;
for (const key of ["resolve", "resolve4", "resolve6"]) {
   require("node:dns")[key] = forbidden;
   require("node:dns").promises[key] = forbidden;
}
globalThis.fetch = forbidden;
globalThis.setInterval = forbidden;
