const http = require("http");
const url = require("url");
const querystring = require("querystring");

const members = require("./members.js");
const goods = require("./goods.js");
const purchases = require("./purchases.js");

const server = http
  .createServer((req, res) => {
    const method = req.method;
    const uri = url.parse(req.url, true);
    const pathname = uri.pathname;

    if (method === "POST" || method === "PUT") {
      let body = "";
      req.on("data", (data) => {
        body += data;
      });

      req.on("end", () => {
        let params;

        if (req.headers["content-type"] === "application/json") {
          params = JSON.parse(body);
        } else {
          params = querystring.parse(body);
        }

        onRequest(res, method, pathname, uri.query);
      });
    } else {
      onRequest(res, method, pathname, uri.query);
    }
  })
  .listen(8000);

/**
 * 요청에 대해 회원 관리, 상품 관리, 구매 관리 모듈별로 분기
 * @param res       response 객체
 * @param method    메서드
 * @param pathname  URI
 * @param params    입력 파라미터
 */
function onRequest(res, method, pathname, params) {
  switch (pathname) {
    case "/members":
      members.onRequest(res, method, pathname, params, response);
      break;
    case "/goods":
      goods.onRequest(res, method, pathname, params, response);
      break;
    case "/purchases":
      purchases.onRequest(res, method, pathname, params, response);
      break;
    default:
      res.writeHead(404);
      return res.end();
  }
}

/**
 * HTTP 헤더에 JSON 형식으로 응답
 * @param res       response 객체
 * @param packet    결과 파라미터
 */
function response(res, packet) {
  res.writeHead(200, { "Content-Type": "application/json" });
  res.end(JSON.stringify(packet));
}
