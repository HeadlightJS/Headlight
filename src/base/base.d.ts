export interface IBase {
    cid: string;
}

export interface ICidMap {
    [cidPrefix: string]: number;
}

export interface IHash<T> {
    [key: string]: T;
}
