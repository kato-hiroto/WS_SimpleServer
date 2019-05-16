// 各ユーザの設定と動作
class userprofile{

    // 変数定義
    public active : boolean;
    private _socket : any;

    // コンストラクタ&変数定義
    constructor(
        public authCode : string,
        public userID : string,
        public name : string,
        public steamID : string,
        public roomName : string
    ) {
        this.active = true;
        this._socket = null;
    }

    // ソケットオブジェクトの取得
    get socket() : any {
        if (this.active) {
            return this._socket;
        } else {
            return null;
        }
    }

    // ソケットオブジェクトの設定
    set socket(inputSocket : any) {
        this._socket = inputSocket;
    }

    // ソケットへ情報送信
    public send(message : string) : void{
        if (this.active) {
            this._socket.send(message);
        }
    }

    // ソケットオブジェクトの削除
    public deleteSocket() : void {
        this._socket = null;
    }
}

export = userprofile;