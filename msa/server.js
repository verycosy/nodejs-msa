"use strict";

const net = require("net");
const tcpClient = require("./client");

class tcpServer {
  constructor(name, port, urls) {
    this.context = {
      port,
      name,
      urls,
    };
    this.merge = {};
    this.server = net.createServer((socket) => {
      this.onCreate(socket);
      socket.on("error", (exception) => {
        this.onClose(socket);
      });
      socket.on("close", () => {
        this.onClose(socket);
      });
      socket.on("data", (data) => {
        var key = socket.remoteAddress + ":" + socket.remotePort;
        var sz = this.merge[key]
          ? this.merge[key] + data.toString()
          : data.toString();
        var arr = sz.split("¶");
        for (var n in arr) {
          if (sz.charAt(sz.length - 1) != "¶" && n == arr.length - 1) {
            this.merge[key] = arr[n];
            break;
          } else if (arr[n] == "") {
            break;
          } else {
            this.onRead(socket, JSON.parse(arr[n]));
          }
        }
      });
    });

    this.server.on("error", (err) => {
      console.log(err);
    });

    this.server.listen(port, () => {
      console.log("listen", this.server.address());
    });
  }

  onCreate(socket) {
    console.log("onCreate", socket.remoteAddress, socket.remotePort);
  }

  onClose(socket) {
    console.log("onClose", socket.remoteAddress, socket.remotePort);
  }

  connectToDistributor(host, port, onNoti) {
    var packet = {
      uri: "/distributes",
      method: "POST",
      key: 0,
      params: this.context,
    };

    var isConnectedDistributor = false;
    this.clientDistributor = new tcpClient(
      host,
      port,
      (options) => {
        // 접속 이벤트
        isConnectedDistributor = true;
        this.clientDistributor.write(packet);
      },
      (options, data) => {
        onNoti(data);
      }, // 데이터 수신 이벤트
      (options) => {
        isConnectedDistributor = false;
      }, // 접속 종료 이벤트
      (options) => {
        isConnectedDistributor = false;
      } // 에러 이벤트
    );

    setInterval(() => {
      // 주기적인 Distributor 접속 시도
      if (isConnectedDistributor != true) {
        this.clientDistributor.connect();
      }
    }, 3000);
  }
}

module.exports = tcpServer;
