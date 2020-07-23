const net = require("net");

const options = {
  port: 9000,
  host: "localhost",
};

const client = net.connect(options, () => {
  // 서버 접속
  console.log("connected");
});

client.on("data", (data) => {
  // 데이터 수신 이벤트
  console.log(data.toString());
});

client.on("end", () => {
  // 접속 종료 이벤트
  console.log("disconnected");
});
