const http = require("http");
const net = require("net");

// detect device/app from user-agent
function getDevice(agent = "") {
  if (agent.includes("Android")) return "Android Device";
  if (agent.includes("iPhone")) return "iPhone";
  if (agent.includes("Windows")) return "Windows PC";
  if (agent.includes("Linux")) return "Linux Device";
  return "Unknown Device";
}

// detect app/service from host
function detectApp(host = "") {
  if (host.includes("youtube") || host.includes("googlevideo")) return "YouTube";
  if (host.includes("google")) return "Google";
  if (host.includes("facebook")) return "Facebook";
  if (host.includes("whatsapp")) return "WhatsApp";
  if (host.includes("chatgpt")) return "ChatGPT";
  return "Other";
}

const server = http.createServer((req, res) => {
  let parsed;

  try {
    parsed = new URL(req.url);
  } catch {
    return res.end("Invalid URL");
  }

  const ip = req.socket.remoteAddress;
  const agent = req.headers["user-agent"] || "";
  const device = getDevice(agent);
  const app = detectApp(parsed.hostname);

  // 🔥 TERMINAL OUTPUT
  console.log("━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🌍 IP: ${ip}`);
  console.log(`📱 Device: ${device}`);
  console.log(`🧠 App: ${app}`);
  console.log(`🌐 DNS: ${parsed.hostname}`);
  console.log(`📡 Method: ${req.method}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━");

  const proxyReq = http.request({
    hostname: parsed.hostname,
    port: parsed.port || 80,
    path: parsed.pathname + parsed.search,
    method: req.method,
    headers: req.headers
  }, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res);
  });

  proxyReq.on("error", () => res.end("Error"));
  req.pipe(proxyReq);
});

// HTTPS
server.on("connect", (req, clientSocket, head) => {
  const ip = clientSocket.remoteAddress;
  const [host, port] = req.url.split(":");

  const app = detectApp(host);

  // 🔥 TERMINAL OUTPUT (HTTPS)
  console.log("━━━━━━━━━━━━━━━━━━━━━━");
  console.log(`🔒 HTTPS CONNECT`);
  console.log(`🌍 IP: ${ip}`);
  console.log(`🧠 App: ${app}`);
  console.log(`🌐 DNS: ${host}`);
  console.log("━━━━━━━━━━━━━━━━━━━━━━");

  const serverSocket = net.connect(port || 443, host, () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    clientSocket.pipe(serverSocket);
    serverSocket.pipe(clientSocket);

    if (head && head.length) serverSocket.write(head);
  });

  serverSocket.on("error", () => clientSocket.end());
  clientSocket.on("error", () => serverSocket.end());
});

server.listen(8080, () => {
  console.log("🔥 Advanced Proxy Monitor running on 8080");
});
