module Headlight {
    'use strict';

    interface ICidMap {
        [cidPrefix: string]: number;
    }

    let cidMap: ICidMap = {

    };

    export interface IBase {
        cid: string;
    }

    export abstract class Base implements IBase {
        public cid: string;

        protected cidPrefix(): string {
            return 'b';
        }

        constructor() {
            this.cid = Base.generateCid(this.cidPrefix());
        }

        public static generateCid(prefix: string): string {
            let lastCid = cidMap[prefix] || 0;

            cidMap[prefix] = lastCid + 1;

            return prefix + cidMap[prefix];
        }
    }
}
