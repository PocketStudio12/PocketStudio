const http = require("http");
const net = require("net");

const server = http.createServer((req, res) => {
  try {
    const parsed = new URL(req.url);

    const options = {
      hostname: parsed.hostname,
      port: parsed.port || 80,
      path: parsed.pathname + parsed.search,
      method: req.method,
      headers: req.headers
    };

    const proxyReq = http.request(options, (proxyRes) => {
      res.writeHead(proxyRes.statusCode, proxyRes.headers);
      proxyRes.pipe(res);
    });

    proxyReq.on("error", (err) => {
      console.log("HTTP Error:", err.message);
      res.end("Bad Gateway");
    });

    req.pipe(proxyReq);

  } catch (err) {
    res.end("Invalid URL");
  }
});

// ✅ FIXED HTTPS TUNNEL
server.on("connect", (req, clientSocket, head) => {
  const [host, port] = req.url.split(":");

  const serverSocket = net.connect(port || 443, host);

  serverSocket.on("connect", () => {
    clientSocket.write("HTTP/1.1 200 Connection Established\r\n\r\n");

    // 🔥 IMPORTANT: bi-directional pipe
    serverSocket.pipe(clientSocket);
    clientSocket.pipe(serverSocket);

    // 🔥 write head after connect
    if (head && head.length) serverSocket.write(head);
  });

  serverSocket.on("error", (err) => {
    console.log("HTTPS Error:", err.message);
    clientSocket.end();
  });

  clientSocket.on("error", () => {
    serverSocket.end();
  });
});

server.listen(8080, () => {
  console.log("✅ Stable Proxy running on 8080");
});
