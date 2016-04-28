module Headlight {
    'use strict';

    //TODO Избавиться от any 13.01.16 11:07
    export function dProperty(...args: Array<any>): any {
        let decorateProperty = function (target: any,
                                         key: string,
                                         descriptor?: TypedPropertyDescriptor<any>): any {
            target.PROPS = target.PROPS || {};
            target._depsMap = target._depsMap || {};
            target.PROPS[key] = key;
            target._depsMap[key] = [];

            (function (k: string, ConstructorOrDeps?: any): void {
                if (!descriptor) {
                    Object.defineProperty(target, k, {
                        get: function (): any {
                            return this._properties[k];
                        },
                        set: function (newVal: any): void {
                            let prev = this._properties[k];

                            //todo добавить проверку на instance of Collection
                            this._properties[k] = (ConstructorOrDeps && !(ConstructorOrDeps instanceof Model))
                                ? new ConstructorOrDeps(newVal) : newVal;

                            Model.dispatchSignals(this, k, this._properties[k], prev);
                        },
                        enumerable: true,
                        configurable: true
                    });
                } else {
                    if (ConstructorOrDeps) {
                        let deps: Array<string> =
                            Array.isArray(ConstructorOrDeps) ? ConstructorOrDeps : ConstructorOrDeps.call(target);

                        for (let i = deps.length; i--;) {
                            target._depsMap[deps[i]].push(k);
                        }
                    }

                    let originalGet = descriptor.get,
                        originalSet = descriptor.set;

                    descriptor.get = function (): any {
                        return this._properties[k] = originalGet.call(this);
                    };

                    if (originalSet) {
                        descriptor.set = function (newVal: any): void {
                            let prev = this[k];

                            originalSet.call(this, newVal);

                            Model.dispatchSignals(this, k, this[k], prev);
                        };
                    }

                    descriptor.enumerable = true;
                    descriptor.configurable = true;
                }
            })(key,
                (args.length === 1 && ((typeof args[0] === BASE_TYPES.FUNCTION) || Array.isArray(args[0])))
                    ? args[0] : undefined);

            return descriptor;
        };

        if (args.length > 1) {
            return decorateProperty.apply(this, args);
        }

        return decorateProperty;
    }
}

