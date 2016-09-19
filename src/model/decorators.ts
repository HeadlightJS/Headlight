import {BASE_TYPES} from '../base/base_types';
import {Base} from '../base/Base';
import {IDObservable, IDComputed} from './model.d';
import {Model} from './Model';

interface IArgs {
    target: any;
    key: string;
    descriptor?: TypedPropertyDescriptor<any>;
    Constructor?: (typeof Base) | (() => typeof Base);
    deps?: Array<string>;
}

export function init(M: typeof Model): IModelDecorators {
    'use strict';

    return {
        observable: function (ConstructorOrFn?: (Function) | (() => Function)): PropertyDecorator {
            return function (target: any, key: string, descriptor?: TypedPropertyDescriptor<any>): PropertyDescriptor {
                mutateTarget(target, key);

                mutateDescriptor({
                    target: target,
                    key: key,
                    descriptor: descriptor,
                    Constructor: isConstructor(ConstructorOrFn) ? ConstructorOrFn : 
                        (typeof ConstructorOrFn === BASE_TYPES.FUNCTION ? ConstructorOrFn.call(target) : undefined)
                });

                return descriptor;
            };
        },
        computed: function (arrayOrFn: Array<string> | (() => Array<string>)): any {
            'use strict';

            return function (target: any, key: string, descriptor?: TypedPropertyDescriptor<any>): PropertyDescriptor {
                mutateTarget(target, key);

                mutateDescriptor({
                    target: target,
                    key: key,
                    descriptor: descriptor,
                    deps: typeof arrayOrFn === BASE_TYPES.FUNCTION ? (<any>arrayOrFn).call(target) : arrayOrFn
                });

                return descriptor;
            };
        }
    };

    function mutateTarget(target: any, key: string): void {
        'use strict';

        target.PROPS = target.PROPS || {};
        target.PROPS[key] = key;
        target._depsMap = target._depsMap || {};
        target._depsMap[key] = [];
    }

    function isConstructor(arg: any): boolean {
        'use strict';

        return arg && arg.prototype && !!arg.prototype.cidPrefix;
    }

    function isModelOrCollection(arg: any): boolean {
        'use strict';

        return arg instanceof M;
    }

    function mutateDescriptor(args: IArgs): void {
        'use strict';

        if (!args.descriptor) {
            Object.defineProperty(args.target, args.key, {
                get: function (): any {
                    return this._properties[args.key];
                },
                set: function (newVal: any): void {
                    let prev = this._properties[args.key],
                        C = <any>(args.Constructor); 

                    this._properties[args.key] = (C && !isModelOrCollection(C)) ? new C(newVal) : newVal;

                    M.dispatchSignals(this, args.key, this._properties[args.key], prev);

                    // if (this._realSignals[args.key]) {
                    //     this._realSignals[args.key].dispatch(this._properties[args.key]);
                    // }
                },
                enumerable: true,
                configurable: true
            });
        } else {
            if (args.deps) {
                for (let i = args.deps.length; i--;) {
                    args.target._depsMap[args.deps[i]].push(args.key);
                }
            }

            let originalGet = args.descriptor.get,
                originalSet = args.descriptor.set;

            args.descriptor.get = function (): any {
                return this._properties[args.key] = originalGet.call(this);
            };

            if (originalSet) {
                args.descriptor.set = function (newVal: any): void {
                    let prev = this[args.key];

                    originalSet.call(this, newVal);

                    M.dispatchSignals(this, args.key, this[args.key], prev);
                };
            }

            args.descriptor.enumerable = true;
            args.descriptor.configurable = true;
        }
    }
};

export interface IModelDecorators {
    observable: IDObservable;
    computed: IDComputed;
}
