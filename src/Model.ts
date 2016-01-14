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

    interface ITransactionArtifact<Schema> {
        signal: TSignalOnChangeModel<Schema> | TSignalOnChangeModelProp<Schema, any>;
        attr: Model.IChangeModelParam<Schema> | Model.IChangeModelPropParam<Schema, any>;
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

        keys(): Array<string>;
        toJSON(): Schema;
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
        private _state: Model.STATE = Model.STATE.SILENT;
        private _transactionArtifacts: Array<ITransactionArtifact<Schema>> = [];
        private _transactionArtifactsMap: {
            [key: string]: number;
        } = {};

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

            for (let i = props.length; i--;) {
                prop = props[i];
                value = this[prop];

                o[prop] = (value instanceof Model) ? value.toJSON() : value;
            }

            return o;
        }

        public keys(): Array<string> {
            return Model.keys(this);
        }

        public performTransaction(callback: (model: Model<Schema>) => void): void {
            Model.performTransaction<Schema>(this, callback);
        }

        public performSilentTransaction(callback: (model: Model<Schema>) => void): void {
            Model.performSilentTransaction<Schema>(this, callback);
        }

        public static keys<S>(model: Model<S>): Array<string> {
            return Object.keys(model.PROPS);
        }

        public static performTransaction<S>(model: Model<S>,
                                            callback: (model: Model<S>) => void): void {
            model._state = Model.STATE.IN_TRANSACTION;

            callback(model);

            //todo: исследовать бытродействие этого же действия с помощью foreach().
            for (let artifact of model._transactionArtifacts) {
                if (artifact) {
                    artifact.signal.dispatch(artifact.attr);
                }
            }

            model.clearTransactionArtifacts();
            model._state = Model.STATE.NORMAL;

        }

        public static performSilentTransaction<S>(model: Model<S>,
                                                  callback: (model: Model<S>) => void): void {
            model._state = Model.STATE.IN_SILENT_TRANSACTION;

            callback(model);

            model._state = Model.STATE.NORMAL;
        }

        public static dispatch<S>(model: Model<S>, propName: string,
                                  attr: Model.IChangeModelParam<any> | Model.IChangeModelPropParam<any, any>): void {

            let signal = <Signal<any>>model.signals[propName];

            switch (model._state) {
                case Model.STATE.NORMAL:
                    signal.dispatch(attr);

                    break;
                case Model.STATE.IN_TRANSACTION:
                    let currentIndex = model._transactionArtifactsMap[propName];

                    if (currentIndex !== undefined) {
                        model._transactionArtifacts[currentIndex] = undefined;
                    }

                    model._transactionArtifactsMap[propName] = model._transactionArtifacts.length;
                    model._transactionArtifacts.push({
                        signal: signal,
                        attr: attr
                    });

                    break;
                case Model.STATE.IN_SILENT_TRANSACTION:

                    break;
                case Model.STATE.SILENT:

                    break;
                default:
                    break;

            }
        }

        protected cidPrefix(): string {
            return 'm';
        }

        private clearTransactionArtifacts(): void {
            this._transactionArtifacts = [];
            this._transactionArtifactsMap = {};
        }

        private createSignals(): void {
            type LSCallbackAnyProp =
                (callback: TSignalCallbackOnChangeModelAnyProp<Schema>, receiver?: IReceiver) => void;

            let props = Model.keys(this),
                prop: string;

            this.signals = {
                change: new Signal()
            };

            this.on = {
                change: (callback: TSignalCallbackOnChangeModel<Schema>,
                         receiver?: IReceiver): void => {
                    this.onChange(callback, receiver);
                }
            };
            this.once = {
                change: (callback: TSignalCallbackOnChangeModel<Schema>,
                         receiver?: IReceiver): void => {
                    this.onChange(callback, receiver, null, true);
                }
            };

            for (let i = props.length; i--;) {
                prop = props[i];

                this.signals[prop] = new Signal();

                this.on[prop] =
                    ((p: string): LSCallbackAnyProp => {
                        return (callback: TSignalCallbackOnChangeModelAnyProp<Schema>,
                                receiver?: IReceiver): void => {
                            this.onChange(p, callback, receiver);
                        };
                    })(prop);
                this.once[prop] =
                    ((p: string): LSCallbackAnyProp => {
                        return (callback: TSignalCallbackOnChangeModelAnyProp<Schema>,
                                receiver?: IReceiver): void => {
                            this.onChange(p, callback, receiver, true);
                        };
                    })(prop);
            }
        }

        private initProperties(args: Schema): void {
            let props = Object.keys(args);

            for (let i = props.length; i--;) {
                this[props[i]] = args[props[i]];
            }
        }

        private enableSignals(): void {
            this._state = Model.STATE.NORMAL;
        }

        private onChange<Type>(propOrCallback: string | TSignalCallbackOnChangeModel<Schema> |
            TSignalCallbackOnChangeModelProp<Schema, Type>,
                               callbackOrReceiver: TSignalCallbackOnChangeModel<Schema> |
                                   TSignalCallbackOnChangeModelProp<Schema, Type> | IReceiver,
                               receiver?: IReceiver,
                               once?: boolean): void {

            let method = once ? 'addOnce' : 'add',
                signal: TSignalOnChangeModel<Schema> | TSignalOnChangeModelProp<Schema, Type>;

            if (typeof propOrCallback === 'function') {
                signal = <TSignalOnChangeModel<Schema>>this.signals.change;
                signal[method](
                    <TSignalCallbackOnChangeModel<Schema>>propOrCallback,
                    <IReceiver>callbackOrReceiver
                );
            } else {
                signal = <TSignalOnChangeModelProp<Schema, Type>>this.signals[<string>propOrCallback];
                signal[method](
                    <TSignalCallbackOnChangeModelProp<Schema, Type>>callbackOrReceiver,
                    <IReceiver>receiver
                );
            }
        }
    }

    //TODO Избавиться от any 13.01.16 11:07
    export function dProperty(...args: Array<any>): any {
        let decorateProperty = function (target: any,
                                         key: string,
                                         descriptor?: TypedPropertyDescriptor<any>): any {

            function dispatchSignals(prop: any, newVal: any, prev: any): void {
                if (newVal !== prev) {
                    Model.dispatch(this, prop, {
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
                    }

                    Model.dispatch(this, 'change', {
                        model: this
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

    export module Model {
        export interface IChangeModelParam<Schema> {
            model: IModel<Schema>;
        }

        export interface IChangeModelPropParam<Schema, Type> extends IChangeModelParam<Schema> {
            value: Type;
            previous: Type;
        }

        export const enum STATE {
            NORMAL,
            IN_TRANSACTION,
            IN_SILENT_TRANSACTION,
            SILENT
        }
    }
}
