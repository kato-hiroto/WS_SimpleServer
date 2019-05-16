import userprofile = require('./userprofile');

// ルーム接続とデータ通信
class room {

    // 変数定義
    public memberNum : number;
    private _memberList : {[key: string]: userprofile} = {};  // ユーザIDをキーとするユーザ情報

    // コンストラクタ&変数定義
    constructor(
        public roomID : string,
        public name : string,
        public kind : string,
        public memberNumMax : number,
        user : userprofile
    ) {
        this.memberNum = 0;
        this.connectRoom(user);
    }

    // ルーム接続
    connectRoom(user : userprofile) : number {
        if (this.memberNum < this.memberNumMax) {
            this._memberList[user.userID] = user;
            this.memberNum += 1;
            return this.memberNum;
        } else {
            return -1;
        }
    }

    // ブロードキャスト
    broadcast(userID : string, message : string) : void{
        for (var key in this._memberList) {
            if (key != userID) {
                this._memberList[key].send(message);
            }
        }
    };

    // ルーム退室
    disconnectRoom(userID : string) : number {
        var profile = this._memberList[userID];
        if (profile && this.memberNum > 0) {
            // profile.deleteSocket();
            delete this._memberList[userID];
            this.memberNum -= 1;
            return this.memberNum         
        } else {
            return -1;
        }
    }
}

export = room;