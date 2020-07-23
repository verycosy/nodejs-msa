const http = require("http");

const options = {
  host: "localhost",
  port: 8000,
  path: "/",
};

const req = http.request(options, (res) => {
  let data = "";

  res.on("data", (chunk) => {
    // 서버가 보내는 데이터 수신
    data += chunk;
  });

  res.on("end", () => {
    // 수신 완료
    console.log(data);
  });
});

req.end(); // 명시적 완료
