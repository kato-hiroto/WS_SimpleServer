declare module '*/config.json' {

    interface Config {
        port : number;
        adminName : string;
        APIKey : string;
    }

    const value: Config;
    export = value;
}