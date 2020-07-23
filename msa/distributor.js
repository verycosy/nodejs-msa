"use strict";
/*
 * distributor
 */
// 접속 노드 관리 오브젝트

var map = {};

class distributor extends require("./server.js") {
  constructor() {
    super("distributor", 9000, ["POST/distributes", "GET/distributes"]);
  }

  // 노드 접속 이벤트 처리
  onCreate(socket) {
    console.log("onCreate", socket.remoteAddress, socket.remotePort);
    this.sendInfo(socket);
  }

  // 노드 접속 해제 이벤트 처리
  onClose(socket) {
    var key = socket.remoteAddress + ":" + socket.remotePort;
    console.log("onClose", socket.remoteAddress, socket.remotePort);
    delete map[key];
    this.sendInfo();
  }

  // 노드 등록 처리
  onRead(socket, json) {
    // 데이터 수신
    var key = socket.remoteAddress + ":" + socket.remotePort; // 키 생성
    console.log("onRead", socket.remoteAddress, socket.remotePort, json);
    if (json.uri == "/distributes" && json.method == "POST") {
      // 노드 정보 등록
      map[key] = {
        socket: socket,
      };
      map[key].info = json.params;
      map[key].info.host = socket.remoteAddress;
      this.sendInfo(); // 접속한 노드에 전파
    }
  }

  // 패킷 전송
  write(socket, packet) {
    socket.write(JSON.stringify(packet) + "¶");
  }

  // 접속 노드 혹은 특정 소켓에 접속 노드 정보 전파
  sendInfo(socket) {
    var packet = {
      uri: "/distributes",
      method: "GET",
      key: 0,
      params: [],
    };

    for (var n in map) {
      packet.params.push(map[n].info);
    }

    if (socket) {
      this.write(socket, packet);
    } else {
      for (var n in map) {
        this.write(map[n].socket, packet);
      }
    }
  }
}

new distributor();

/*
[
    {
        "port": "첫 번째 노드의 포트",
        "name": "첫 번째 노드의 이름",
        "urls": [
            "첫 번째 노드의 첫 번째 url",
            "첫 번째 노드의 두 번째 url",
            ......
        ],
        "host": "첫 번째 노드의 host"
    },
    {
        "port": "두 번째 노드의 포트",
        "name": "두 번째 노드의 이름",
        "urls": [
            "두 번째 노드의 첫 번째 url",
            "두 번째 노드의 두 번째 url",
            ......
        ],
        "host": "두 번째 노드의 host"
    },
    ......
]
 */
