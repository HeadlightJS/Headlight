module Headlight {
    'use strict';

    //TODO Избавиться от any 13.01.16 11:07
    export function dProperty(...args: Array<any>): any {
        let decorateProperty = function (target: any,
                                         key: string,
                                         descriptor?: TypedPropertyDescriptor<any>): any {

            function dispatchSignals(prop: string, newVal: any, prev: any): void {
                if (newVal !== prev) {
                    /*Model.dispatch(this, prop, {
                        model: this,
                        value: newVal,
                        previous: prev
                    });

                    let deps = this._depsMap[prop],
                        d: string,
                        prevValue: any,
                        currValue: any;

                    for (let j = deps.length; j--;) {
                        d = deps[j];
                        prevValue = this._properties[d];
                        currValue = this[d];

                        if (currValue !== prevValue) {
                            Model.dispatch(this, d, {
                                model: this,
                                value: currValue,
                                previous: prevValue
                            });
                        }
                    }*/

                    /*Model.dispatch(this, 'change', {
                        model: this
                    });*/

                    let model = <Model<any>>this,
                        values = {},
                        previous = {},
                        deps = this._depsMap[prop],
                        d: string,
                        prevValue: any,
                        currValue: any;

                    values[prop] = newVal;
                    previous[prop] = prev;

                    //todo итерация через зависимости зависимостей

                    for (let j = deps.length; j--;) {
                        d = deps[j];
                        prevValue = this._properties[d];
                        currValue = this[d];

                        if (currValue !== prevValue) {
                            /*Model.dispatch(this, d, {
                                model: this,
                                value: currValue,
                                previous: prevValue
                            });*/

                            values[d] = currValue;
                            previous[d] = prevValue;
                        }
                    }

                    Model.dispatch(this, 'change', {
                        model: this,
                        values: values,
                        previous: previous
                    });
                }
            }

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

                            dispatchSignals.call(this, k, this._properties[k], prev);
                        },
                        enumerable: true,
                        configurable: true
                    });
                } else {
                    if (ConstructorOrDeps) {
                        let deps: Array<string> =
                            Array.isArray(ConstructorOrDeps) ? ConstructorOrDeps : ConstructorOrDeps.call(target);

                        for (let i = deps.length; i--;) {
                            let d = target._depsMap[deps[i]];

                            if (d && d.indexOf(k) === -1) {
                                d.push(k);
                            }
                        }
                    }

                    let originalGet = descriptor.get,
                        originalSet = descriptor.set;

                    if (!originalGet) {
                        //TODO native template 13.01.16 11:08
                        throw Error('`get` accessor for property `' + k +
                            '` of class `' + target.name + '` should be specified.');
                    }

                    descriptor.get = function (): any {
                        return this._properties[k] = originalGet.call(this);
                    };

                    if (originalSet) {
                        descriptor.set = function (newVal: any): void {
                            let prev = this[k];

                            originalSet.call(this, newVal);

                            dispatchSignals.call(this, k, this[k], prev);
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

