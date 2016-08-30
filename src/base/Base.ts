import {IBase, ICidMap} from './base.d';

/**
 * Basic class
 * @abstract
 */
export abstract class Base implements IBase {
    /**
     * Unique identifier of the instance.
     */
    public cid: string;

    protected abstract cidPrefix: string;

    /**
     * Maps of used cids.
     */
    private static _cidMap: ICidMap = {};


    constructor() {
        this.cid = Base.generateCid(this.cidPrefix);
    }

    /**
     * Generates next unused cid.
     * 
     * @prop {string} prefix - cid prefix.
     */
    public static generateCid(prefix: string): string {
        let lastCid = Base._cidMap[prefix] || 0;

        Base._cidMap[prefix] = lastCid + 1;

        return prefix + Base._cidMap[prefix];
    }
}
