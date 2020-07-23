"use strict";

const business = require("../monolithic/goods");
class goods extends require("./server.js") {
  constructor() {
    super("goods", process.argv[2] ? Number(process.argv[2]) : 9010, [
      "POST/goods",
      "GET/goods",
      "DELETE/goods",
    ]);

    this.connectToDistributor("127.0.0.1", 9000, (data) => {
      console.log("Distributor Notification", data);
    });
  }

  // onRead 함수에는 유효한 API인지를 판단하는 유효성 검사가 빠져 있습니다. 그 이유는 다음 장에서 설명합니다.
  onRead(socket, data) {
    console.log("onRead", socket.remoteAddress, socket.remotePort, data);

    // 비즈니스 로직 호출
    business.onRequest(
      socket,
      data.method,
      data.uri,
      data.params,
      (s, packet) => {
        socket.write(JSON.stringify(packet) + "¶"); // 응답 패킷 전송
      }
    );
  }
}

new goods();
