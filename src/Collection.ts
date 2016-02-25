///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export abstract class Collection<Schema> extends Array<Model.TModelOrSchema<Schema>> {
        public cid: string;
        public on: Collection.ISignalListeners<Schema>;
        public once: Collection.ISignalListeners<Schema>;
        public signals: Collection.ISignalHash<Schema>;

        private _signals: Signal.ISignalCache = {};
        private _state: Collection.STATE = Collection.STATE.SILENT;
        private _receiveChangeSignalsState: Collection.RECEIVE_CHANGE_SIGNALS_STATE =
            Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO;
        private _modelsIdsHash: IHash<boolean> = {};

        constructor(items?: Array<Model.TModelOrSchema<Schema>>) {
            super();

            this.cid = Base.generateCid(this.cidPrefix());

            this._createSignals();
            this._initItems(items);
            this._enableSignals();
        }

        public toJSON(): Array<Schema> {
            return Array.prototype.map.call(this, (model: Model.TModelOrSchema<Schema>) => {
                return (<Model<Schema>>model).toJSON();
            });
        }

        public toString(): string {
            return JSON.stringify(this.toJSON());
        }

        public push(...items: Array<Model.TModelOrSchema<Schema>>): number {
            let oldLength = this.length,
                models = Collection._convertToModels(this, items);

            Array.prototype.push.apply(this, models);

            this._receiveModelsChangeSignals(models);

            this._dispatchSignal(this.signals.add, {
                collection: this,
                models: this.slice(oldLength, this.length)
            });

            return this.length;
        }

        public pop(): Model.TModelOrSchema<Schema> {
            let model = Array.prototype.pop.call(this);

            if (model) {
                let models = [model];

                this._stopReceivingModelsChangeSignals(models);

                this._dispatchSignal(this.signals.remove, {
                    collection: this,
                    models: new Collection.SimpleCollection<Schema>(models, this.model())
                });
            }

            return model;
        }

        public concat(...items: Array<Collection.TArrayOrCollection<Schema> |
            Model.TModelOrSchema<Schema>>): Collection<Schema> {

            let models = [],
                newModels = Collection._convertToModels(this, items);

            for (let i = this.length; i--;) {
                models[i] = this[i];
            }

            return new Collection.SimpleCollection<Schema>(models.concat(newModels), this.model());
        }

        public join(separator?: string): string {
            let string = '';

            for (let i = 0; i < this.length; i++) {
                string += JSON.stringify((<Model<Schema>>this[i]).toJSON());

                if (i !== this.length - 1) {
                    string += separator;
                }
            }

            return string;
        }

        public reverse(): Collection<Schema> {
            Array.prototype.reverse.call(this);

            this._dispatchSignal(this.signals.sort, {
                collection: this
            });

            return this;
        }

        public shift(): Model.TModelOrSchema<Schema> {
            let model = Array.prototype.shift.call(this);

            if (model) {
                let models = [model];

                this._stopReceivingModelsChangeSignals(models);

                this._dispatchSignal(this.signals.remove, {
                    collection: this,
                    models: new Collection.SimpleCollection<Schema>(models, this.model())
                });
            }

            return model;
        }

        public slice(start?: number, end?: number): Collection<Schema> {
            return new Collection.SimpleCollection<Schema>(Array.prototype.slice.call(this, start, end), this.model());
        }

        public sort(compareFn?: (a: Model.TModelOrSchema<Schema>,
                                 b: Model.TModelOrSchema<Schema>) => number): Collection<Schema> {
            Array.prototype.sort.call(this, compareFn);

            this._dispatchSignal(this.signals.sort, {
                collection: this
            });

            return this;
        };

        public splice(start: number,
                      ...items: Array<number | Model.TModelOrSchema<Schema>>): Collection<Schema> {
            let M = this.model(),
                end = items.shift(),
                models = Collection._convertToModels(this, items),
                removed = new Collection.SimpleCollection<Schema>(Array.prototype.splice.apply(this,
                    [start, end].concat(models)
                ), M);

            this._stopReceivingModelsChangeSignals(removed);

            this._dispatchSignal(this.signals.remove, {
                collection: this,
                models: removed
            });

            this._receiveModelsChangeSignals(models);

            this._dispatchSignal(this.signals.add, {
                collection: this,
                models: new Collection.SimpleCollection<Schema>(models, M)
            });

            return removed;
        };

        public unshift(...items: Array<Model.TModelOrSchema<Schema>>): number {
            Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

            let models = this.slice(0, items.length);

            this._receiveModelsChangeSignals(models);

            this._dispatchSignal(this.signals.add, {
                collection: this,
                models: models
            });

            return this.length;
        };

        public filter(callbackfn: (value: Model.TModelOrSchema<Schema>,
                                   index: number,
                                   collection: Collection<Schema>) => boolean,
                      thisArg?: any): Collection<Schema> {
            return new Collection.SimpleCollection<Schema>(
                Array.prototype.filter.call(this, callbackfn, thisArg), this.model()
            );
        };

        public receive<CallbackParam>(signal: Signal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): void;

        public receiveOnce<CallbackParam>(signal: Signal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): void;

        public stopReceiving<CallbackParam>(signalOrCallback?: Signal<CallbackParam> |
            Signal.ISignalCallback<CallbackParam>,
                                            callback?: Signal.ISignalCallback<CallbackParam>): void;

        public addSignal(signal: Signal<any>): void;

        public removeSignal(signal: Signal<any>): void;

        public hasSignal(signal: Signal<any>): boolean;

        public getSignals(): Array<Signal<any>>;

        public resetSignals(): void;

        protected cidPrefix(): string {
            return 'c';
        }

        protected abstract model(): typeof Model;

        private _createSignals(): void {
            this.signals = {
                change: new Signal(),
                add: new Signal(),
                remove: new Signal(),
                sort: new Signal()
            };

            this.on = {
                change: (callback: Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<Schema>>,
                         receiver?: Receiver): void => {
                    if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.INITIALIZING;
                        this._receiveModelsChangeSignals(this);
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.YES;
                    }

                    this.signals.change.add(callback, receiver);
                },
                add: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: Receiver): void => {
                    this.signals.add.add(callback, receiver);
                },
                remove: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: Receiver): void => {
                    this.signals.remove.add(callback, receiver);
                },
                sort: (callback: Signal.ISignalCallback<Collection.ISignalCallbackParam<Schema>>,
                       receiver?: Receiver): void => {
                    this.signals.sort.add(callback, receiver);
                }
            };

            this.once = {
                change: (callback: Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<Schema>>,
                         receiver?: Receiver): void => {
                    if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.INITIALIZING;
                        this._receiveModelsChangeSignals(this);
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.YES;
                    }

                    this.signals.change.addOnce(callback, receiver);
                },
                add: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                      receiver?: Receiver): void => {
                    this.signals.add.addOnce(callback, receiver);
                },
                remove: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: Receiver): void => {
                    this.signals.remove.addOnce(callback, receiver);
                },
                sort: (callback: Signal.ISignalCallback<Collection.ISignalCallbackParam<Schema>>,
                       receiver?: Receiver): void => {
                    this.signals.sort.addOnce(callback, receiver);
                }
            };
        }

        private _initItems(items: Array<Model.TModelOrSchema<Schema>>): void {
            Array.prototype.push.apply(this, Collection._convertToModels(this, items));
        }

        private _dispatchSignal(signal: Signal<any>, param: Collection.TCollectionSignalParam<Schema>): void {
            //todo Раскомментировать после того, как реализуется транзакция для коллекции

            //if (this._state !== Collection.STATE.SILENT) {
            signal.dispatch(param);
            //}
        }

        private _receiveModelsChangeSignals(models: Array<Model<Schema>> | Collection<Schema>): void {
            if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                return;
            }

            for (let i = models.length; i--;) {
                let model = <Model<Schema>>models[i];

                if (!this._modelsIdsHash[model.cid]) {
                    this.receive(model.signals.change, this._onChangeModel);

                    this._modelsIdsHash[model.cid] = true;
                }
            }
        }

        private _stopReceivingModelsChangeSignals(models: Array<Model.TModelOrSchema<Schema>>): void {
            if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                return;
            }

            for (let i = models.length; i--;) {
                let model = <Model<Schema>>models[i];

                this.stopReceiving(model.signals.change, this._onChangeModel);

                delete this._modelsIdsHash[model.cid];
            }
        }

        private _onChangeModel(param: Model.IChangeParam<Schema>): void {
            let values: IHash<Schema> = {},
                previous: IHash<Schema> = {},
                model = param.model;

            values[model.cid] = param.values;
            previous[model.cid] = param.previous;

            this._dispatchSignal(this.signals.change, {
                collection: this,
                models: new Collection.SimpleCollection<Schema>([model], this.model()),
                values: values,
                previous: previous
            });
        }

        private _enableSignals(): void {
            this._state = Collection.STATE.NORMAL;
        }

        private static _convertToModels(
            collection: Collection<any>,
            items: Array<Model.TModelOrSchema<any> | any>): Array<Model.TModelOrSchema<any>> {

            if (!items || !items.length) {
                return [];
            }

            let Model = collection.model(),
                models: Array<Model<any>> = [];

            function add(item: Model<any> | any): void {
                if (!(item instanceof Model)) {
                    if (item instanceof Headlight.Model) {
                        //todo написать вывод ошибки
                        throw new Error('');
                    } else {
                        models.unshift(new (<any>Model)(item));
                    }
                } else {
                    models.unshift(item);
                }
            }

            for (let i = items.length; i--;) {
                let item = items[i];

                if (Array.isArray(item) || item instanceof Collection) {
                    for (let j = item.length; j--;) {
                        add(item[j]);
                    }
                } else {
                    add(item);
                }


            }

            return models;
        }
    }

    /* Receiver methods mixing */
    Collection.prototype.receive = Receiver.prototype.receive;
    Collection.prototype.receiveOnce = Receiver.prototype.receiveOnce;
    Collection.prototype.stopReceiving = Receiver.prototype.stopReceiving;
    Collection.prototype.addSignal = Receiver.prototype.addSignal;
    Collection.prototype.removeSignal = Receiver.prototype.removeSignal;
    Collection.prototype.hasSignal = Receiver.prototype.hasSignal;
    Collection.prototype.getSignals = Receiver.prototype.getSignals;
    Collection.prototype.resetSignals = Receiver.prototype.resetSignals;

    export module Collection {
        export type TArrayOrCollection<Schema> = Array<Model.TModelOrSchema<Schema>> | Collection<Schema>;
        export type TCollectionSignalParam<Schema> = ISignalCallbackParam<Schema> | ISignalCallbackModelsParam<Schema> |
            ISignalCallbackChangeParam<Schema>

        export interface ISignalCallbackParam<Schema> {
            collection: Collection<Schema>;
        }

        export interface ISignalCallbackModelsParam<Schema> extends ISignalCallbackParam<Schema> {
            models: Collection<Schema>;
        }

        export interface ISignalCallbackChangeParam<Schema> extends ISignalCallbackModelsParam<Schema> {
            values: IHash<Schema>;
            previous: IHash<Schema>;
        }

        export interface ISignalHash<Schema> {
            change: Signal<ISignalCallbackChangeParam<Schema>>;
            add: Signal<ISignalCallbackModelsParam<Schema>>;
            remove: Signal<ISignalCallbackModelsParam<Schema>>;
            sort: Signal<ISignalCallbackParam<Schema>>;
        }

        export interface ISignalListeners<Schema> {
            change(callback: Signal.ISignalCallback<ISignalCallbackChangeParam<Schema>>,
                   receiver?: Receiver): void;
            add(callback: Signal.ISignalCallback<ISignalCallbackModelsParam<Schema>>, receiver?: Receiver): void;
            remove(callback: Signal.ISignalCallback<ISignalCallbackModelsParam<Schema>>, receiver?: Receiver): void;
            sort(callback: Signal.ISignalCallback<ISignalCallbackParam<Schema>>, receiver?: Receiver): void;
        }

        export class SimpleCollection<Schema> extends Collection<Schema> implements Collection<Schema> {
            private _M: typeof Model;

            constructor(items: Array<Model.TModelOrSchema<Schema>>, M: typeof Model) {
                (() => {
                    this._initProps(items, M);
                })();
                
                super(items);
            }

            protected model(): typeof Model {
                return this._M;
            };

            private _initProps(items: Array<Model.TModelOrSchema<Schema>>,
                               M: typeof Model): Array<Model.TModelOrSchema<Schema>> {

                this._M = M;

                return items;
            }
        }

        export const enum STATE {
            SILENT,
            NORMAL
        }

        export const enum RECEIVE_CHANGE_SIGNALS_STATE {
            NO,
            INITIALIZING,
            YES
        }
    }
}
