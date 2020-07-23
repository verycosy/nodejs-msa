"use strict";

const net = require("net");

class tcpClient {
  constructor(host, port, onCreate, onRead, onEnd, onError) {
    this.options = {
      host,
      port,
    };

    this.onCreate = onCreate;
    this.onRead = onRead;
    this.onEnd = onEnd;
    this.onError = onError;
  }

  connect() {
    this.client = net.connect(this.options, () => {
      if (this.onCreate) this.onCreate(this.options);
    });

    this.client.on("data", (data) => {
      var sz = this.merge ? this.merge + data.toString() : data.toString();
      var arr = sz.split("¶");
      for (var n in arr) {
        if (sz.charAt(sz.length - 1) != "¶" && n == arr.length - 1) {
          this.merge = arr[n];
          break;
        } else if (arr[n] == "") {
          break;
        } else {
          this.onRead(this.options, JSON.parse(arr[n]));
        }
      }
    });

    this.client.on("close", () => {
      if (this.onEnd) this.onEnd(this.options);
    });

    this.client.on("error", (err) => {
      if (this.onError) this.onError(this.options, err);
    });
  }

  write(packet) {
    this.client.write(JSON.stringify(packet) + "¶");
  }
}

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

module.exports = tcpClient;
