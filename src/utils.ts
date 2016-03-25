module Headlight.utils {
    'use strict';

    export function isString(some: any): boolean {
        return typeof some === 'string' || some instanceof String;
    }

    export function isNumber(some: any): boolean {
        return typeof some === 'number' || some instanceof Number;
    }
    
    export function isArray(some: any): boolean {
        return Array.isArray(some);
    }

    export function isNaN(some: any): boolean {
        return typeof some === 'number' && (<any>window).isNaN(some);
    }
    
    export function notEmpty(some: any): boolean {
        return some != null;
    }
    
    export function isObject(some: any): boolean {
        return typeof some === 'object' && !isArray(some);
    }
    
    export function isNull(some: any): boolean {
        return some === null;
    }
    
    export function isUndefined(some: any): boolean {
        return some === undefined;
    }

    export function clone<T>(some: T): T {
        if (typeof some === 'object') {
            if (isArray(some)) {
                return (<any>some).slice();
            } else {
                let result = {};
                Object.keys(some).forEach((key: string) => {
                    result[key] = some[key];
                });
                return <any>result;
            }
        }
        return some;
    }
}
