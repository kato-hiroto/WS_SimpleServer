// 定義
declare function require(x: string): any;
declare var __dirname;
declare var process;
import lobby = require("./lobby");
import packet = require("./packet");
import config = require("./config.json");

// 必須オブジェクト定義
var WebSocketServer = require("ws").Server;
var http = require("http");
var express = require("express");
var app = express(); app.use(express.static(__dirname + "/"));
var server = http.createServer(app);
var wss = new WebSocketServer({server: server});

// オブジェクト定義
var port : number = config.port;
var adminName : string = config.adminName;
var APIKey : string = config.APIKey;
var lob = new lobby(APIKey);
var connections = [];

// 接続時
wss.on("connection", function (ws) {

    //配列にWebSocket接続を保存
    connections.push(ws);

    //切断時
    ws.on("close", function () {
        lob.disconnect(ws);
        connections = connections.filter(function (conn, i) {
            return (conn === ws) ? false : true;
        });
        console.log("disconnected");
    });

    //　メッセージ受信
    ws.on("message", function (message) {
        console.log("message : ", message);
        // ws.send("ServerEcho : "+ message);
        // console.log("test");
        var data = new packet(message);
        if(data.packetEnable(ws)){
            lob.readPacket(ws, data);
        }
    });
});

// ポート番号の設定
server.listen(port, function(){
    console.log("listen to " + port.toString() + "...");
    process.setuid(adminName)
});

