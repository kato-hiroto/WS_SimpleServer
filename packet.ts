// データ送受信形式
class packet{
    
    // 変数定義
    public authCode : string;
    public name : string;
    public steamID : string;
    public room : string;
    public order : string;
    public value : any;
    private _enable : boolean;

    // コンストラクタ＆JSON解読
    constructor (jsonData : string) {
        try {
            var data = JSON.parse(jsonData);
            this.authCode = data.authCode;
            this.name = data.name;
            this.steamID = data.steamID;
            this.room = data.room;
            this.order = data.order;
            this.value = data.value;
            this._enable = true; 
        } catch (error) {
            this._enable = false; 
        }
    }

    // パケットが正常かどうか
    public packetEnable(socket : any) : boolean{
        if (this.authCode && this.name && this.steamID && this.room && this.order && this.value && this._enable) {
            return true;
        } else {
            console.log("ServerError : This message's format isn't correct JSON.");
            socket.send("ServerError : This message's format isn't correct JSON.");
            return false;
        }
    }

    // valueをJSON形式に変換
    public value2JSON() : string {
        return JSON.stringify(this.value);
    }
}

export = packet;