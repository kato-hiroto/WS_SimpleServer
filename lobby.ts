// 定義
import userprofile = require('./userprofile');
import room = require('./room');
import packet = require('./packet');

class lobby {

    // 変数定義
    private _userList : {[key: string]: userprofile} = {};   // SteamIDをキーとするユーザ情報
    private _roomList : {[key: string]: room} = {};          // ルーム名をキーとするルーム情報
    private _APIKey : string = "";   // ユーザ情報登録時の共通パスワード

    constructor(apikey : string) {
        this._APIKey = apikey;
    }

    // メッセージ解読
    readPacket(socket : any, data : packet) : void{

        // ユーザ情報の登録
        if (data.order == "registerUser") {
            this.registerUser(socket, data);
        } else if (data.order == "connectRoom"){
            this.connectRoom(socket, data);

        // 登録後の処理
        } else if (this._userList[data.steamID]){
            var user : userprofile = this._userList[data.steamID];
            var roomName : string = data.room;

            // 認証コードが異なるならエラー
            if (user.authCode != data.authCode) {
                socket.send("ServerError : Your authentication code isn't correct.");
            
            // 以下、指示に従って関数実行
            } else if (data.order == "sendMessage") {
                this.sendMessage(data);
            } else if (data.order == "getRoomList") {
                this.getRoomList(user);
            } else if (data.order == "createRoom") {
                this.createRoom(user, roomName);
            } else if (data.order == "joinRoom") {
                this.joinRoom(user, roomName);
            } else if (data.order == "joinRoomForcefully") {
                this.joinRoomForcefully(user, roomName);
            } else {
                socket.send("ServerError : Your order couldn't understood.");
            }

        // 登録されていないのに登録以外の処理を要求したとき
        } else {
            socket.send("ServerError : You must register.");
        }
    }

    // ユーザ情報の登録と取得
    registerUser(socket : any, data : packet) : boolean {

        // APIキーの確認
        if (data.authCode != this._APIKey){
            socket.send("ServerError : Your APIKey isn't correct.");
            return false;
        }

        // ソケットがまだ登録されていないことを確認
        for (var key in this._userList) {
            if (this._userList[key].socket == socket){
                this._userList[key].send("ServerError : You have already registered your information.");
                return false;
            }
        }
        // ユーザ情報の登録
        var userID = this.randomID();    // データベースがあるなら、SteamIDで検索した戻り値を入れる
        var tmpAuthCode = this.randomID();    // 認証用のランダムコード生成
        var user : userprofile = new userprofile(tmpAuthCode, userID, data.name, data.steamID, "");
        user.socket = socket;
        this._userList[user.steamID] = user;
        user.send("ServerMessage : Succeeded registering your information. Your authentication code is [" + tmpAuthCode + "].");
        return true;        
    }

    // ルームリストの取得(ルーム名と現在の人数のみ)
    getRoomList(user : userprofile) : void{
        var jsonData : string = "{";
        var comma : string = "";
        for (var key in this._roomList) {
            jsonData += comma;
            jsonData += "\"" + key + "\":\"" + this._roomList[key].memberNum + "\"";
            comma = ",";
        }
        jsonData += "}";
        user.send("ServerMessage : RoomList is [" + jsonData + "].");
    }

    // ルームを作成
    createRoom(user : userprofile, roomName : string) : void{
        if (this._roomList[roomName]) {
            user.send("ServerError : The Room has already been created.");
        } else {
            this.moveRoom(user, roomName);
            this._roomList[roomName] = new room(this.randomID(), roomName, "sample", 4, user);
            user.send("ServerInfo : Succeeded creating the room.");
        }
    }

    // ルームに参加
    joinRoom(user : userprofile, roomName : string) : void{
        if (this._roomList[roomName]) {
            var memberNum = this._roomList[roomName].connectRoom(user);
            if (memberNum > 0) {
                this.moveRoom(user, roomName);
                user.send("ServerInfo : Succeeded joining the room.");
                this._roomList[roomName].broadcast(user.userID, "ServerMessage : Joined Player [" + user.name + "].");
            } else {
                user.send("ServerError : The Room is full.");
            }
        } else {
            user.send("ServerError : The Room hasn't been created.");
        }
    }

    // ルームがあれば参加、なければ作成
    joinRoomForcefully(user : userprofile, roomName : string) : void{
        if (this._roomList[roomName]) {
            var memberNum = this._roomList[roomName].connectRoom(user);
            if (memberNum > 0) {
                this.moveRoom(user, roomName);
                user.send("ServerInfo : Succeeded joining the room.");
                this._roomList[roomName].broadcast(user.userID, "ServerMessage : Join Player [" + user.name + "].");
            } else {
                user.send("ServerError : The Room is full.");
            }
        } else {
            this.moveRoom(user, roomName);
            this._roomList[roomName] = new room(this.randomID(), roomName, "sample", 4, user);
            user.send("ServerInfo : Succeeded creating the room.");
        }
    }

    // ユーザ登録込みで自動的にルーム接続
    connectRoom(socket : any, data : packet) : void {
        if (this.registerUser(socket, data)){
            this.joinRoomForcefully(this._userList[data.steamID], data.room);
        }
    }

    // メッセージ送信
    sendMessage(data : any) : void{
        var user : userprofile = this._userList[data.steamID];
        if (user.roomName) {
            this._roomList[user.roomName].broadcast(user.userID, data.value);
        } else {
            user.send("ServerError : You must join or create a room.");            
        }
    }

    // 切断
    disconnect(socket : any) : void {
        // ソケットを捜索
        for (var key in this._userList) {
            if (this._userList[key].socket == socket){
                var user : userprofile = this._userList[key];
                var steamID : string  = user.steamID;
                var memberNum : number = this._roomList[user.roomName].disconnectRoom(user.userID);    // 部屋から切断
                if (memberNum <= 0) {
                    delete this._roomList[user.roomName];    // 部屋が0人なら部屋も削除
                }
                delete this._userList[steamID];    // ユーザリストから削除
                return;
            }
        }
    } 

    // ユーザの所属ルーム移動
    moveRoom(user : userprofile, nextRoomName : string) : void {        
        if (user.roomName) {
            this._roomList[user.roomName].disconnectRoom(user.userID);
        }
        user.roomName = nextRoomName;
    }

    // 乱数文字列の生成
    randomID() : string{
        var l = 32;
        var c = "abcdefghijklmnopqrstuvwxyz0123456789";
        var cl = c.length;
        var r = "";
        for(var i = 0; i < l; i++){
            r += c[Math.floor(Math.random() * cl)];
        }
        return r;
    }
}

export = lobby;