///<reference path="Base.ts"/>
///<reference path="Receiver.ts"/>
///<reference path="Signal.ts"/>
///<reference path="dProperty.ts"/>

module Headlight {
    'use strict';

    interface ITransactionArtifact<Schema> {
        signal: Model.TSignalOnChange<Schema>;
        attr: Model.IChangeParam<Schema>;
    }
    export interface IModel<Schema> extends IReceiver {
        on: Model.ISignalListeners<Schema>;
        once: Model.ISignalListeners<Schema>;
        PROPS: Schema;
        signals: Model.ISignalHash<Schema>;

        keys(): Array<string>;
        toJSON(): Schema;
    }

    export abstract class Model<Schema> extends Receiver implements IModel<Schema> {
        public on: Model.ISignalListeners<Schema>;
        public once: Model.ISignalListeners<Schema>;
        public PROPS: Schema;
        public signals: Model.ISignalHash<Schema>;

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

            this._createSignals();
            this._initProperties(args);
            this._enableSignals();
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

            for (let artifact of model._transactionArtifacts) {
                if (artifact) {
                    artifact.signal.dispatch(artifact.attr);
                }
            }

            model._clearTransactionArtifacts();
            model._state = Model.STATE.NORMAL;

        }

        public static performSilentTransaction<S>(model: Model<S>,
                                                  callback: (model: Model<S>) => void): void {
            model._state = Model.STATE.IN_SILENT_TRANSACTION;

            callback(model);

            model._state = Model.STATE.NORMAL;
        }

        public static dispatch<S>(model: Model<S>, propName: string, attr: Model.IChangeParam<any>): void {
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

        public static filter<S>(propName: string,
                             handler: Signal.ISignalCallback<Model.IChangeParam<S>>):
            Signal.ISignalCallback<Model.IChangeParam<S>> {

            return (param: Model.IChangeParam<S>) => {
                if (propName in param.values) {
                    handler(param);
                }
            };
        }

        protected cidPrefix(): string {
            return 'm';
        }

        private _clearTransactionArtifacts(): void {
            this._transactionArtifacts = [];
            this._transactionArtifactsMap = {};
        }

        private _createSignals(): void {
            this.signals = {
                change: new Signal()
            };

            this.on = {
                change: (callback: Model.TSignalCallbackOnChange<Schema>,
                         receiver?: IReceiver): void => {
                    this.signals.change.add(callback, receiver);
                }
            };
            this.once = {
                change: (callback: Model.TSignalCallbackOnChange<Schema>,
                         receiver?: IReceiver): void => {
                    this.signals.change.addOnce(callback, receiver);
                }
            };
        }

        private _initProperties(args: Schema): void {
            let props = Object.keys(args || {});

            for (let i = props.length; i--;) {
                this[props[i]] = args[props[i]];
            }
        }

        private _enableSignals(): void {
            this._state = Model.STATE.NORMAL;
        }
    }

    export module Model {
        export type TModelOrSchema<Schema> = IModel<Schema> | Schema;
        export type TSignalOnChange<S> = ISignal<Model.IChangeParam<S>>;
        export type TSignalCallbackOnChange<S> = Signal.ISignalCallback<Model.IChangeParam<S>>;

        export interface ISignalListeners<Schema> {
            change(callback: TSignalCallbackOnChange<Schema>, receiver?: IReceiver): void;
        }


        export interface ISignalHash<Schema> {
            change: TSignalOnChange<Schema>;
        }

        export interface IChangeParam<Schema> {
            model: IModel<Schema>;
            values: Schema;
            previous: Schema;
        }

        export const enum STATE {
            NORMAL,
            IN_TRANSACTION,
            IN_SILENT_TRANSACTION,
            SILENT
        }
    }
}
