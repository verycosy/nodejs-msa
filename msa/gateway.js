"use strict";

const http = require("http");
const url = require("url");
const querystring = require("querystring");

const tcpClient = require("./client");

var mapClients = {};
var mapUrls = {};
var mapResponse = {};
var mapRR = {};
var index = 0;

var server = http
  .createServer((req, res) => {
    var method = req.method;
    var uri = url.parse(req.url, true);
    var pathname = uri.pathname;

    if (method === "POST" || method === "PUT") {
      var body = "";

      req.on("data", function (data) {
        body += data;
      });
      req.on("end", function () {
        var params;
        if (req.headers["content-type"] == "application/json") {
          params = JSON.parse(body);
        } else {
          params = querystring.parse(body);
        }

        onRequest(res, method, pathname, params);
      });
    } else {
      onRequest(res, method, pathname, uri.query);
    }
  })
  .listen(8000, () => {
    console.log("listen", server.address());

    var packet = {
      // ➋ Distributor 전달 패킷
      uri: "/distributes",
      method: "POST",
      key: 0,
      params: {
        port: 8000,
        name: "gate",
        urls: [],
      },
    };
    var isConnectedDistributor = false;

    this.clientDistributor = new tcpClient( // ➌ Distributor 접속
      "127.0.0.1",
      9000,
      (options) => {
        // ➍ istributor 접속 완료 이벤트
        isConnectedDistributor = true;
        this.clientDistributor.write(packet);
      },
      (options, data) => {
        onDistribute(data);
      }, // ➎ Distributor 데이터 수신 이벤트
      (options) => {
        isConnectedDistributor = false;
      }, // ➏ Distributor 접속 종료 이벤트
      (options) => {
        isConnectedDistributor = false;
      } // ➐ Distributor 에러 이벤트
    );
    setInterval(() => {
      // ➑ istributor 재접속
      if (isConnectedDistributor != true) {
        this.clientDistributor.connect();
      }
    }, 3000);
  });

// HTTP 게이트웨이로 API 요청이 오면 현재 처리 가능한 마이크로서비스 API들을 확인해 처리 가능한 API만 처리하도록
// 유일성을 보장할 수 있도록 고유키 값을 증가시키고(➍), 동일한 API를 처리하는 마이크로서비스 여러 개를 고르게 호출하기 위해 라운드 로빈 인덱스 값을 증가시킵니다(➎).
function onRequest(res, method, pathname, params) {
  var key = method + pathname;
  var client = mapUrls[key];
  if (client == null) {
    // ➊ 처리 가능한 API만 처리
    res.writeHead(404);
    res.end();
    return;
  } else {
    params.key = index; // ➋ 고유키 발급 (API 호출에 대한 고유키 값 설정)
    var packet = {
      uri: pathname,
      method: method,
      params: params,
    };
    mapResponse[index] = res; // ➌ 요청에 대한 응답 객체 저장
    index++; // ➍ 고유 값 증가
    if (mapRR[key] == null)
      // ➎ 라운드 로빈 처리
      mapRR[key] = 0;
    mapRR[key]++;
    client[mapRR[key] % client.length].write(packet); // ➏ 마이크로서비스에 요청
  }
}

/*
onDistribute로 Distributor에서 현재 접속 가능한 마이크로서비스 목록이 전달되면(➒)
접속하지 않은 마이크로서비스에 대해 Client 클래스 인스턴스를 생성합니다.
접속 주소로 key를 만들어 mapClients에 인스턴스를 저장하고(➓), 처리 가능한 URL들을 mapUrls에 저장합니다(⓫).
*/
function onDistribute(data) {
  // ➒ istributor 데이터 수신 처리
  for (var n in data.params) {
    var node = data.params[n];
    var key = node.host + ":" + node.port;
    if (mapClients[key] == null && node.name != "gate") {
      var client = new tcpClient(
        node.host,
        node.port,
        onCreateClient,
        onReadClient,
        onEndClient,
        onErrorClient
      );
      mapClients[key] = {
        // ➓ 마이크로서비스 연결 정보 저장
        client: client,
        info: node,
      };
      for (var m in node.urls) {
        // ⓫ 마이크로서비스 URL 정보 저장
        var key = node.urls[m];
        if (mapUrls[key] == null) {
          mapUrls[key] = [];
        }
        mapUrls[key].push(client);
      }
      client.connect();
    }
  }
}

// 마이크로서비스 접속 이벤트 처리
function onCreateClient(options) {
  console.log("onCreateClient");
}

function onReadClient(options, packet) {
  // 마이크로 서비스 응답
  console.log("onReadClient", packet);
  mapResponse[packet.key].writeHead(200, {
    "Content-Type": "application/json",
  });
  mapResponse[packet.key].end(JSON.stringify(packet));
  delete mapResponse[packet.key];
}

function onEndClient(options) {
  // ⓬ 마이크로서비스 접속 종료 처리
  var key = options.host + ":" + options.port;
  console.log("onEndClient", mapClients[key]);
  for (var n in mapClients[key].info.urls) {
    var node = mapClients[key].info.urls[n];
    delete mapUrls[node];
  }
  delete mapClients[key];
}

function onErrorClient(options) {
  console.log("onErrorClient");
}
