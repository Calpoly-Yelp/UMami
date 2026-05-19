const LOCAL_HOSTNAMES = new Set(["localhost", "127.0.0.1"]);

export const API_BASE_URL = LOCAL_HOSTNAMES.has(
   window.location.hostname,
)
   ? "http://localhost:4000"
   : "https://umami-api-calpoly-bpgzacb7ckf3hked.westus3-01.azurewebsites.net";

export function apiUrl(path) {
   return `${API_BASE_URL}${path.startsWith("/") ? path : `/${path}`}`;
}
