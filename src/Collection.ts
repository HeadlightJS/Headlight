///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ICollection<Schema> extends IReceiver, IBase, Array<Model.TModelOrSchema<Schema>> {
        on: Collection.ISignalListeners<Schema>;
        once: Collection.ISignalListeners<Schema>;
        signals: Collection.ISignalHash<Schema>;

        length: number;
        toJSON(): Array<Schema>;
        toLocaleString(): string;
        push(...items: Array<Model.TModelOrSchema<Schema>>): number;
        pop(): Model.TModelOrSchema<Schema>;
        concat(...items: Array<Collection.TArrayOrCollection<Schema> |
            Model.TModelOrSchema<Schema>>): ICollection<Schema>;
        join(separator?: string): string;
        reverse(): ICollection<Schema>;
        shift(): Model.TModelOrSchema<Schema>;
        slice(start?: number, end?: number): ICollection<Schema>;
        sort(compareFn?: (a: Model.TModelOrSchema<Schema>,
                          b: Model.TModelOrSchema<Schema>) => number): ICollection<Schema>;
        splice(start: number): ICollection<Schema>;
        splice(start: number,
               deleteCount: number,
               ...items: Array<Model.TModelOrSchema<Schema>>): ICollection<Schema>;
        unshift(...items: Array<Model.TModelOrSchema<Schema>>): number;
        indexOf(searchElement: Model.TModelOrSchema<Schema>, fromIndex?: number): number;
        lastIndexOf(searchElement: Model.TModelOrSchema<Schema>, fromIndex?: number): number;
        every(callbackfn: (value: Model.TModelOrSchema<Schema>,
                           index: number,
                           array: Array<Model.TModelOrSchema<Schema>>) => boolean,
              thisArg?: any): boolean;
        some(callbackfn: (value: Model.TModelOrSchema<Schema>,
                          index: number,
                          array: Array<Model.TModelOrSchema<Schema>>) => boolean,
             thisArg?: any): boolean;
        forEach(callbackfn: (value: Model.TModelOrSchema<Schema>,
                             index: number,
                             array: Array<Model.TModelOrSchema<Schema>>) => void,
                thisArg?: any): void;
        map<T>(callbackfn: (value: Model.TModelOrSchema<Schema>,
                            index: number,
                            array: Array<Model.TModelOrSchema<Schema>>) => ICollection<Schema>,
               thisArg?: any): Array<T>;
        filter(callbackfn: (value: Model.TModelOrSchema<Schema>,
                            index: number,
                            collection: ICollection<Schema>) => boolean,
               thisArg?: any): ICollection<Schema>;
        reduce<T>(callbackfn: (previousValue: Model.TModelOrSchema<Schema>,
                               currentValue: Model.TModelOrSchema<Schema>,
                               currentIndex: number,
                               collection: ICollection<Schema>) => Model.TModelOrSchema<Schema>,
                  initialValue?: Model.TModelOrSchema<Schema>): T;
        reduceRight<T>(callbackfn: (previousValue: Model.TModelOrSchema<Schema>,
                                    currentValue: Model.TModelOrSchema<Schema>,
                                    currentIndex: number,
                                    collection: ICollection<Schema>) => Model.TModelOrSchema<Schema>,
                       initialValue?: Model.TModelOrSchema<Schema>): T;

        [index: number]: Model.TModelOrSchema<Schema>;
    }

    export abstract class Collection<Schema> extends Array<Model.TModelOrSchema<Schema>> implements
        ICollection<Schema> {

        public cid: string;
        public on: Collection.ISignalListeners<Schema>;
        public once: Collection.ISignalListeners<Schema>;
        public signals: Collection.ISignalHash<Schema>;

        private _signals: Signal.ISignalCache = {};
        private _state: Collection.STATE = Collection.STATE.SILENT;
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
                return (<IModel<Schema>>model).toJSON();
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
            Model.TModelOrSchema<Schema>>): ICollection<Schema> {

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
                string += JSON.stringify((<IModel<Schema>>this[i]).toJSON());

                if (i !== this.length - 1) {
                    string += separator;
                }
            }

            return string;
        }

        public reverse(): ICollection<Schema> {
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

        public slice(start?: number, end?: number): ICollection<Schema> {
            return new Collection.SimpleCollection<Schema>(Array.prototype.slice.call(this, start, end), this.model());
        }

        public sort(compareFn?: (a: Model.TModelOrSchema<Schema>,
                                 b: Model.TModelOrSchema<Schema>) => number): ICollection<Schema> {
            Array.prototype.sort.call(this, compareFn);

            this._dispatchSignal(this.signals.sort, {
                collection: this
            });

            return this;
        };

        public splice(start: number,
                      ...items: Array<number | Model.TModelOrSchema<Schema>>): ICollection<Schema> {
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
                                   collection: ICollection<Schema>) => boolean,
                      thisArg?: any): ICollection<Schema> {
            return new Collection.SimpleCollection<Schema>(
                Array.prototype.filter.call(this, callbackfn, thisArg), this.model()
            );
        };




        public receive<CallbackParam>(signal: ISignal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): void;

        public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): void;

        public stopReceiving<CallbackParam>(signalOrCallback?: ISignal<CallbackParam> |
            Signal.ISignalCallback<CallbackParam>,
                                            callback?: Signal.ISignalCallback<CallbackParam>): void;

        public addSignal(signal: ISignal<any>): void;

        public removeSignal(signal: ISignal<any>): void;

        public hasSignal(signal: ISignal<any>): boolean;

        public getSignals(): Array<ISignal<any>>;

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
                         receiver?: IReceiver): void => {
                    this.signals.change.add(callback, receiver);
                },
                add: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: IReceiver): void => {
                    this.signals.add.add(callback, receiver);
                },
                remove: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: IReceiver): void => {
                    this.signals.remove.add(callback, receiver);
                },
                sort: (callback: Signal.ISignalCallback<Collection.ISignalCallbackParam<Schema>>,
                       receiver?: IReceiver): void => {
                    this.signals.sort.add(callback, receiver);
                }
            };

            this.once = {
                change: (callback: Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<Schema>>,
                         receiver?: IReceiver): void => {
                    this.signals.change.addOnce(callback, receiver);
                },
                add: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                      receiver?: IReceiver): void => {
                    this.signals.add.addOnce(callback, receiver);
                },
                remove: (callback: Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<Schema>>,
                         receiver?: IReceiver): void => {
                    this.signals.remove.addOnce(callback, receiver);
                },
                sort: (callback: Signal.ISignalCallback<Collection.ISignalCallbackParam<Schema>>,
                       receiver?: IReceiver): void => {
                    this.signals.sort.addOnce(callback, receiver);
                }
            };
        }

        private _initItems(items: Array<Model.TModelOrSchema<Schema>>): void {
            let models = Collection._convertToModels(this, items);

            Array.prototype.push.apply(this, models);

            this._receiveModelsChangeSignals(models);
        }

        private _dispatchSignal(signal: ISignal<any>, param: Collection.TCollectionSignalParam<Schema>): void {
            //todo Раскомментировать после того, как реализуется транзакция для коллекции

            //if (this._state !== Collection.STATE.SILENT) {
            signal.dispatch(param);
            //}
        }

        private _receiveModelsChangeSignals(models: Array<Model.TModelOrSchema<Schema>>): void {
            for (let i = models.length; i--;) {
                let model = <IModel<Schema>>models[i];

                if (!this._modelsIdsHash[model.cid]) {
                    this.receive(model.signals.change, this._onChangeModel);

                    this._modelsIdsHash[model.cid] = true;
                }
            }
        }

        private _stopReceivingModelsChangeSignals(models: Array<Model.TModelOrSchema<Schema>>): void {
            for (let i = models.length; i--;) {
                let model = <IModel<Schema>>models[i];

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
                models: Array<IModel<any>> = [];

            function add(item: IModel<any> | any): void {
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
        export type TArrayOrCollection<Schema> = Array<Model.TModelOrSchema<Schema>> | ICollection<Schema>;
        export type TCollectionSignalParam<Schema> = ISignalCallbackParam<Schema> | ISignalCallbackModelsParam<Schema> |
            ISignalCallbackChangeParam<Schema>

        export interface ISignalCallbackParam<Schema> {
            collection: ICollection<Schema>;
        }

        export interface ISignalCallbackModelsParam<Schema> extends ISignalCallbackParam<Schema> {
            models: ICollection<Schema>;
        }

        export interface ISignalCallbackChangeParam<Schema> extends ISignalCallbackModelsParam<Schema> {
            values: IHash<Schema>;
            previous: IHash<Schema>;
        }

        export interface ISignalHash<Schema> {
            change: ISignal<ISignalCallbackChangeParam<Schema>>;
            add: ISignal<ISignalCallbackModelsParam<Schema>>;
            remove: ISignal<ISignalCallbackModelsParam<Schema>>;
            sort: ISignal<ISignalCallbackParam<Schema>>;
        }

        export interface ISignalListeners<Schema> {
            change(callback: Signal.ISignalCallback<ISignalCallbackChangeParam<Schema>>,
                   receiver?: IReceiver): void;
            add(callback: Signal.ISignalCallback<ISignalCallbackModelsParam<Schema>>, receiver?: IReceiver): void;
            remove(callback: Signal.ISignalCallback<ISignalCallbackModelsParam<Schema>>, receiver?: IReceiver): void;
            sort(callback: Signal.ISignalCallback<ISignalCallbackParam<Schema>>, receiver?: IReceiver): void;
        }

        export class SimpleCollection<Schema> extends Collection<Schema> implements ICollection<Schema> {
            private _M: typeof Model;

            constructor(items: Array<Model.TModelOrSchema<Schema>>, M: typeof Model) {
                super(this._initProps(items, M));
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
    }
}
