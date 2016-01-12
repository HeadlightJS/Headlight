///<reference path="Base.ts"/>
///<reference path="Receiver.ts"/>
///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    type TSignalOnChangeModel<S> = ISignal<Model.IChangeModelParam<S>>;
    type TSignalOnChangeModelProp<S, T> = ISignal<Model.IChangeModelPropParam<S, T>>;

    type TSignalCallbackOnChangeModel<S> = Signal.ISignalCallback<Model.IChangeModelParam<S>>;
    type TSignalCallbackOnChangeModelProp<S, T> = Signal.ISignalCallback<Model.IChangeModelPropParam<S, T>>;

    type TSignalOnChangeModelAnyProp<S> = TSignalOnChangeModelProp<S, any>;
    type TSignalCallbackOnChangeModelAnyProp<S> = TSignalCallbackOnChangeModelProp<S, any>;

    interface ISignalHash<Schema> {
        change: TSignalOnChangeModel<Schema>;
        [signalCid: string]: TSignalOnChangeModelAnyProp<Schema>;
    }

    export interface IModelSignalsListener<Schema> {
        change(callback: TSignalCallbackOnChangeModel<Schema>, receiver?: IReceiver): void;
        [key: string]: (callback: TSignalCallbackOnChangeModelAnyProp<Schema>, receiver?: IReceiver) => void;
    }

    export interface IModel<Schema> extends IReceiver {
        on: IModelSignalsListener<Schema>;
        once: IModelSignalsListener<Schema>;
        PROPS: Schema;
        signals: ISignalHash<Schema>;

        toJSON(): Schema;
    }

    function onChange<Schema, Type>(fieldOrCallback: string | TSignalCallbackOnChangeModel<Schema> |
                                  TSignalCallbackOnChangeModelProp<Schema, Type>,
                              callbackOrReceiver: TSignalCallbackOnChangeModel<Schema> |
                                  TSignalCallbackOnChangeModelProp<Schema, Type> | IReceiver,
                              receiver?: IReceiver,
                              once?: boolean): void {

        let self = <Model<Schema>>this,
            method = once ? 'addOnce' : 'add',
            signal: TSignalOnChangeModel<Schema> | TSignalOnChangeModelProp<Schema, Type> ;

        if (typeof fieldOrCallback === 'function') {
            signal = <TSignalOnChangeModel<Schema>>self.signals.change;
            signal[method](
                <TSignalCallbackOnChangeModel<Schema>>fieldOrCallback,
                <IReceiver>callbackOrReceiver
            );
        } else {
            signal = <TSignalOnChangeModelProp<Schema, Type>>self.signals[<string>fieldOrCallback];
            signal[method](
                <TSignalCallbackOnChangeModelProp<Schema, Type>>callbackOrReceiver,
                <IReceiver>receiver
            );
        }
    }

    export abstract class Model<Schema> extends Receiver implements IModel<Schema> {
        public on: IModelSignalsListener<Schema>;
        public once: IModelSignalsListener<Schema>;
        public PROPS: Schema;
        public signals: ISignalHash<Schema>;

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
            let o: Schema = <Schema>{},
                props: Array<string> = Model.keys(this),
                prop: string,
                value: any;

            for (var i = props.length; i--; ) {
                prop = props[i];
                value = this[prop];

                o[prop] = (value instanceof Model) ? value.toJSON() : value;
            }

            return o;
        }

        public static keys<Schema>(model: Model<Schema>): Array<string> {
            let m = <Model<Schema>>model;
            return Object.keys(m.PROPS);
        }

        protected cidPrefix(): string {
            return 'm';
        }

        private createSignals(): void {
            let fields = Model.keys(this),
                self = this;

            this.signals = {
                change: new Signal()
            };
            this.signals.change.disable();

            this.on = {
                change: (callback: TSignalCallbackOnChangeModel<Schema>,
                         receiver?: IReceiver): void => {
                    onChange.call(this, callback, receiver);
                }
            };
            this.once = {
                change: (callback: TSignalCallbackOnChangeModel<Schema>,
                         receiver?: IReceiver): void => {
                    onChange.call(this, callback, receiver, null, true);
                }
            };

            for (let field of fields) {
                this.signals[field] = new Signal();
                this.signals[field].disable();

                this.on[field] =
                    (function(f: string): (callback: TSignalCallbackOnChangeModelAnyProp<Schema>,
                                           receiver?: IReceiver) => void {
                        return (callback: TSignalCallbackOnChangeModelProp<Schema, any>,
                                receiver?: IReceiver): void => {
                            onChange.call(self, f, callback, receiver);
                        };
                    })(field);
                this.once[field] =
                    (function(f: string): (callback: TSignalCallbackOnChangeModelAnyProp<Schema>,
                                           receiver?: IReceiver) => void {
                        return (callback: TSignalCallbackOnChangeModelAnyProp<Schema>,
                                receiver?: IReceiver): void => {
                            onChange.call(self, f, callback, receiver, true);
                        };
                    })(field);
            }
        }

        private initProperties(args: Schema): void {
            for (let a in args) {
                if (args.hasOwnProperty(a)) {
                    this[a] = args[a];
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

                        for (let i = deps.length; i--; ) {
                            let d = target._depsMap[deps[i]];

                            if (d && d.indexOf(k) === -1) {
                                d.push(k);
                            }
                        }
                    }

                    let originalGet = descriptor.get,
                        originalSet = descriptor.set;

                    if (!originalGet) {
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
    
    export module Model {
        export interface IChangeModelParam<Schema> {
            model: IModel<Schema>;
        }

        export interface IChangeModelPropParam<Schema, Type> extends IChangeModelParam<Schema> {
            value: Type;
            previous: Type;
        }
    }
}
