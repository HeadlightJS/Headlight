module Headlight {
    'use strict';

    export abstract class Base {
        public cid: string;
        private static cidMap: ICidMap = {};

        protected abstract cidPrefix(): string;

        constructor() {
            this.cid = Base.generateCid(this.cidPrefix());
        }

        public static generateCid(prefix: string): string {
            let lastCid = Base.cidMap[prefix] || 0;

            Base.cidMap[prefix] = lastCid + 1;

            return prefix + Base.cidMap[prefix];
        }
    }

    export const BASE_TYPES = {
        UNDEFINED: 'undefined',
        NUMBER: 'number',
        STRING: 'string',
        BOOLEAN: 'boolean',
        OBJECT: 'object',
        FUNCTION: 'function'
    };

    export const EVENTS = {
        CHANGE: 'change'
    };
    
    interface ICidMap {
        [cidPrefix: string]: number;
    }

    export interface IHash<T> {
        [key: string]: T;
    }
}
