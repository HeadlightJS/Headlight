import {IBase, ICidMap} from './Base.d';

export abstract class Base implements IBase {
    public cid: string;
    private static _cidMap: ICidMap = {};

    protected abstract cidPrefix(): string;

    constructor() {
        this.cid = Base.generateCid(this.cidPrefix());
    }

    public static generateCid(prefix: string): string {
        let lastCid = Base._cidMap[prefix] || 0;

        Base._cidMap[prefix] = lastCid + 1;

        return prefix + Base._cidMap[prefix];
    }
}
