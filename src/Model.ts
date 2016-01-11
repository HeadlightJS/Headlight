///<reference path="Receiver.ts"/>
///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    const EVENT_SEPARATOR = ':';

    interface ISignalCache<Schema> {
        change: ISignal<IChangeModelFieldParam<Schema>>;
        [signalCid: string]: ISignal<IChangeModelFieldParam<Schema>>;
    }

    function onChangeDummy(fieldOrCallback: any,
                           callbackOrReceiver: ISignalCallback<IChangeModelFieldParam<any>> | IReceiver,
                           receiver: IReceiver,
                           once: boolean): void {
        let self = <Model<any>>this,
            method = once ? 'addOnce' : 'add',
            signal: any;

        if (typeof fieldOrCallback === 'function') {
            signal = <any>self.signals.change;
            signal[method](
                <ISignalCallback<IChangeModelFieldParam<any>>>fieldOrCallback,
                <IReceiver>callbackOrReceiver
            );
        } else {
            signal = <any>self.signals[fieldOrCallback];
            signal[method](
                <ISignalCallback<IChangeModelFieldParam<any>>>callbackOrReceiver,
                <IReceiver>receiver
            );
        }
    }

    function onChange(fieldOrCallback: any,
                      callbackOrReceiver?: ISignalCallback<IChangeModelFieldParam<any>> | IReceiver,
                      receiver?: IReceiver): void {

        return onChangeDummy.call(this, fieldOrCallback, callbackOrReceiver, receiver, false);
    }

    function onChangeOnce(fieldOrCallback: any,
                          callbackOrReceiver?: ISignalCallback<IChangeModelFieldParam<any>> | IReceiver,
                          receiver?: IReceiver): void {

        return onChangeDummy.call(this, fieldOrCallback, callbackOrReceiver, receiver, true);
    }

    export abstract class Model<Schema> extends Receiver implements IModel<Schema> {
        public on: IModelSignalsListener<Schema>;
        public once: IModelSignalsListener<Schema>;
        public PROPS: Schema;
        public signals: ISignalCache<Schema>;

        private _depsMap: {
            [key: string]: Array<string>;
        };
        private _properties: IHash = {};

        constructor(args: Schema) {
            super();

            this.createSignals();
            this.initProperties(args);
            this.enableSignals();
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
            let m = <any>model;
            return Object.keys(m.PROPS);
        }

        private createSignals(): void {
            let fields = Model.keys(this);

            this.signals = {
                change: new Signal()
            };
            this.signals.change.disable();

            for (let field of fields) {
                this.signals[field] = new Signal();
                this.signals[field].disable();
            }

            this.on = {
                change: onChange.bind(this)
            };
            this.once = {
                change: onChangeOnce.bind(this)
            };
        }

        private initProperties(args: Schema): void {
            let fields = <any>args,
                self = <any>this;

            for (let n in fields) {
                if (fields.hasOwnProperty(n)) {
                    self[n] = fields[n];
                }
            }
        }

        private enableSignals(): void {
            let signals = Object.keys(this.signals);

            for (var i = signals.length; i--; ) {
                this.signals[signals[i]].enable();
            }
        }
    }

    // todo Написать честный тип вместо any
    export function dProperty(...args: Array<any>): any {
        let decorateProperty = function (target: any,
                                         key: string,
                                         descriptor?: TypedPropertyDescriptor<any>): any {
            function dispatchSignals(prop: any, newVal: any, prev: any): void {
                if (newVal !== prev) {
                    this.signals[prop].dispatch({
                        model: this,
                        value: newVal,
                        previous: prev
                    });

                    let deps = this._depsMap[prop],
                        d: string,
                        prevValue: any,
                        currValue: any;

                    for (var j = deps.length; j--; ) {
                        d = deps[j];
                        prevValue = this._properties[d];
                        currValue = this[d];

                        if (currValue !== prevValue) {
                            this.signals[d].dispatch({
                                model: this,
                                value: currValue,
                                previous: prevValue
                            });
                        }
                    }

                    this.signals.change.dispatch({
                        model: this
                    });
                }
            };

            target.PROPS = target.PROPS || {};
            target._depsMap = target._depsMap || {};
            target.PROPS[key] = key;
            target._depsMap[key] = [];

            (function (k: string, ConstructorOrDeps?: any): void {
                if (!descriptor) {
                    Object.defineProperty(target, key, {
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
                        let deps: Array<string> = ConstructorOrDeps.call(target);

                        for (let i = deps.length; i--; ) {
                            let d = target._depsMap[deps[i]];

                            if (d && d.indexOf(k) === -1) {
                                d.push(k);
                            }
                        }
                    }

                    let oldGet = descriptor.get,
                        oldSet = descriptor.set;

                    descriptor.get = function (): any {
                        return this._properties[k] = oldGet.call(this);
                    };
                    descriptor.set = function (newVal: any): void {
                        let prev = this[k];

                        oldSet.call(this, newVal);

                        dispatchSignals.call(this, k, this[k], prev);
                    };
                    descriptor.enumerable = true;
                    descriptor.configurable = true;
                }
            })(key, (args.length === 1 && typeof args[0] === BASE_TYPES.FUNCTION) ? args[0] : undefined);

            return descriptor;
        };

        if (args.length > 1) {
            return decorateProperty.apply(this, args);
        }

        return decorateProperty;
    }
}
