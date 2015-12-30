///<reference path="Base.ts"/>

module Headlight {
    'use strict';

    export abstract class Model<Schema> extends Base implements IModel<Schema> {
        private _fields: Object;

        constructor(args: Schema) {
            super();

            Object.defineProperties(this, {
                _fields: {
                    value: {},
                    enumerable: false
                }
            });

            let fields = <any>args,
                self = <any>this;

            for (let n in fields) {
                if (fields.hasOwnProperty(n)) {
                    self[n] = fields[n];
                }
            }
        }

        public toJSON(): Schema {
            let o: any = <any>{},
                fields: Array<string> = Model.keys(this),
                self: any = <any>this;

            for (let field of fields) {
                if (self[field] instanceof Model) {
                    o[field] = self[field].toJSON();
                } else {
                    o[field] = <any>self[field];
                }
            }

            return <Schema>o;
        }

        public static keys(model: Model<any>): Array<string> {
            return Object.keys(model._fields);
        }
    }

    export function dProperty(...args: Array<any>): any {
        let decorateProperty = function (target: Object,
                                         key: string,
                                         descriptor?: TypedPropertyDescriptor<any>): any {
            (function (k: string, C?: any): void {
                if (!descriptor) {
                    Object.defineProperty(target, key, {
                        get: function (): any {
                            return this._fields[k];
                        },
                        set: function (newVal: any): void {
                            this._fields[k] = C ? new C(newVal) : newVal;

                            //todo Signal dispatching
                        },
                        enumerable: true,
                        configurable: true
                    });
                } else {
                    let oldGet = descriptor.get,
                        oldSet = descriptor.set;

                    descriptor.get = function (): any {
                        return oldGet.call(this);
                    };
                    descriptor.set = function (newVal1: any): void {
                        oldSet.call(this, newVal1);
                        //todo Signal dispatching
                    };
                    descriptor.enumerable = true;
                    descriptor.configurable = true;
                }

                //todo Signal creating
            })(key, (args.length === 1) ? args[0] : undefined);

            return descriptor;
        };

        if (args.length > 1) {
            return decorateProperty.apply(this, args);
        }

        return decorateProperty;
    }
}
