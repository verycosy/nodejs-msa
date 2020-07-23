const net = require("net");
const server = net.createServer((socket) => {
  // TCP 서버 생성
  socket.end("hello world"); // 접속시 응답
});

server.on("error", (err) => {
  console.error(err);
});

server.listen(9000, () => {
  console.log(`listen`, server.address());
  // Node.js는 IPv6 사용
});
