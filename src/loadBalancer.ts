import http from "http";
const httpProxy = require("http-proxy");

const servers = ["http://localhost:3000", "http://localhost:3001"];
let currentIndex = 0;

const proxy = httpProxy.createProxyServer();
const server = http.createServer((req: any, res:any) => {
 
    const target = servers[currentIndex];
    currentIndex = (currentIndex + 1) % servers.length;

    console.log(`Redirecting request to: ${target}`);
    proxy.web(req, res, { target }, (err:any) => {
        res.writeHead(502, { "Content-Type": "text/plain" });
        res.end("Bad gateway error.");
    });
});

server.listen(8080, () => {
    console.log("Load Balancer running on port 8080");
});