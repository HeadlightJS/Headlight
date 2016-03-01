///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export abstract class Collection<Model extends Headlight.Model<any>> extends Array<Model> {
        public cid: string;
        public on: Collection.ISignalListeners<typeof Model.prototype.PROPS>;
        public once: Collection.ISignalListeners<typeof Model.prototype.PROPS>;
        public signals: Collection.ISignalHash<typeof Model.prototype.PROPS>;

        private _signals: Signal.ISignalCache = {};
        private _state: Collection.STATE = Collection.STATE.SILENT;
        private _receiveChangeSignalsState: Collection.RECEIVE_CHANGE_SIGNALS_STATE =
            Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO;
        private _modelsIdsHash: IHash<boolean> = {};

        constructor(items?: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>) {
            super();

            this.cid = Base.generateCid(this.cidPrefix());

            this._createSignals();
            this._initItems(items);
            this._enableSignals();
        }

        public toJSON(): Array<typeof Model.prototype.PROPS> {
            return Array.prototype.map.call(this, (model: Model.TModelOrSchema<typeof Model.prototype.PROPS>) => {
                return (<Model>model).toJSON();
            });
        }

        public toString(): string {
            return JSON.stringify(this.toJSON());
        }

        public push(...items: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): number {
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

        public pop(): Model {
            let model = Array.prototype.pop.call(this);

            if (model) {
                let models = [model];

                this._stopReceivingModelsChangeSignals(models);

                this._dispatchSignal(this.signals.remove, {
                    collection: this,
                    models: new Collection.SimpleCollection<Model>(models, this.model())
                });
            }

            return model;
        }

        public concat(...items: Array<Collection.TArrayOrCollection<typeof Model.prototype.PROPS> |
            Model.TModelOrSchema<typeof Model.prototype.PROPS>>): Collection<Model> {

            let models = [],
                newModels = Collection._convertToModels(this, items);

            for (let i = this.length; i--;) {
                models[i] = this[i];
            }

            return new Collection.SimpleCollection<Model>(models.concat(newModels), this.model());
        }

        public join(separator?: string): string {
            let string = '';

            for (let i = 0; i < this.length; i++) {
                string += JSON.stringify(this[i].toJSON());

                if (i !== this.length - 1) {
                    string += separator;
                }
            }

            return string;
        }

        public reverse(): Collection<Model> {
            Array.prototype.reverse.call(this);

            this._dispatchSignal(this.signals.sort, {
                collection: this
            });

            return this;
        }

        public shift(): Model {
            let model = Array.prototype.shift.call(this);

            if (model) {
                let models = [model];

                this._stopReceivingModelsChangeSignals(models);

                this._dispatchSignal(this.signals.remove, {
                    collection: this,
                    models: new Collection.SimpleCollection<Model>(models, this.model())
                });
            }

            return model;
        }

        public slice(start?: number, end?: number): Collection<Model> {
            return new Collection.SimpleCollection<Model>(
                    Array.prototype.slice.call(this, start, end), 
                    this.model()
                );
        }

        public sort(compareFn?: (a: Model,
                                 b: Model) => number): Collection<Model> {
            Array.prototype.sort.call(this, compareFn);

            this._dispatchSignal(this.signals.sort, {
                collection: this
            });

            return this;
        };

        public splice(start: number,
                      ...items: Array<number | Model.TModelOrSchema<typeof Model.prototype.PROPS>>): Collection<Model> {
            let M = this.model(),
                end = items.shift(),
                models = Collection._convertToModels(this, items),
                removed = Array.prototype.splice.apply(this,
                    [start, end].concat(models)
                );

            this._stopReceivingModelsChangeSignals(removed);

            this._dispatchSignal(this.signals.remove, {
                collection: this,
                models: removed
            });

            this._receiveModelsChangeSignals(models);

            this._dispatchSignal(this.signals.add, {
                collection: this,
                models: new Collection.SimpleCollection<Model>(models, M)
            });

            return new Collection.SimpleCollection<Model>(removed, M);
        };

        public unshift(...items: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): number {
            Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

            let models = this.slice(0, items.length);

            this._receiveModelsChangeSignals(models);

            this._dispatchSignal(this.signals.add, {
                collection: this,
                models: models
            });

            return this.length;
        };

        public filter(callbackfn: (value: Model.TModelOrSchema<typeof Model.prototype.PROPS>,
                                   index: number,
                                   collection: Collection<Model>) => boolean,
                      thisArg?: any): Collection<Model> {
            return new Collection.SimpleCollection<Model>(
                Array.prototype.filter.call(this, callbackfn, thisArg), this.model()
            );
        };
        
        public get(idOrCid: string): Model | void {
            for (let model of this) {
                if (model.id === idOrCid || model.cid === idOrCid) {
                    return <Model>model;
                }
            }
        }

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
        
        public static filter<M extends Headlight.Model<S>, S>(propName: string | Array<string>,
                             callback: Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<S>>):
            Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<S>> {
                
            let names = Array.isArray(propName) ? <Array<string>>propName : [<string>propName],
                fn = <Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<S>>>
                    ((param: Collection.ISignalCallbackChangeParam<S>) => {
                        
                        let values = <IHash<S>>{},
                            previous = <IHash<S>>{},
                            models = new Collection.SimpleCollection<M>([], param.collection.model()),
                            n: string,
                            flag = false;
                            
                        for (let i = names.length; i--;) {
                            n = names[i];
                            
                            for (let modelCid in param.values) {
                                if (param.values.hasOwnProperty(modelCid)) {
                                    let modelValues = param.values[modelCid];
                                    
                                    values[modelCid] = <S>{};
                                    previous[modelCid] = <S>{};
                                    
                                    if (n in modelValues) {
                                        models.push(<Headlight.Model<S>>param.collection.get(modelCid));
                                        
                                        values[modelCid][n] = modelValues[n];
                                        previous[modelCid][n] = param.previous[modelCid][n];

                                        flag = true;
                                    }
                                }
                            }
                        }    
                            
                        if (flag) {
                            callback({
                                collection: param.collection,
                                models: models,
                                values: values,
                                previous: previous
                            });
                        }    
                    });

            fn.originalCallback = callback;

            return fn;
        }

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
            
            /* tslint:disable */
            type TSCWithChangeParam = Signal.ISignalCallback<Collection.ISignalCallbackChangeParam<typeof Model.prototype.PROPS>>;
            type TSCWithModelParam = Signal.ISignalCallback<Collection.ISignalCallbackModelsParam<typeof Model.prototype.PROPS>>;
            type TSCWithParam = Signal.ISignalCallback<Collection.ISignalCallbackParam<typeof Model.prototype.PROPS>>;
            /* tslint:enable */

            this.on = {
                change: (callback: TSCWithChangeParam, receiver?: Receiver): void => {
                    if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.INITIALIZING;
                        this._receiveModelsChangeSignals(this);
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.YES;
                    }

                    this.signals.change.add(callback, receiver);
                },
                add: (callback: TSCWithModelParam, receiver?: Receiver): void => {
                    this.signals.add.add(callback, receiver);
                },
                remove: (callback: TSCWithModelParam, receiver?: Receiver): void => {
                    this.signals.remove.add(callback, receiver);
                },
                sort: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signals.sort.add(callback, receiver);
                }
            };

            this.once = {
                change: (callback: TSCWithChangeParam, receiver?: Receiver): void => {
                    if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.INITIALIZING;
                        this._receiveModelsChangeSignals(this);
                        this._receiveChangeSignalsState = Collection.RECEIVE_CHANGE_SIGNALS_STATE.YES;
                    }

                    this.signals.change.addOnce(callback, receiver);
                },
                add: (callback: TSCWithModelParam, receiver?: Receiver): void => {
                    this.signals.add.addOnce(callback, receiver);
                },
                remove: (callback: TSCWithModelParam, receiver?: Receiver): void => {
                    this.signals.remove.addOnce(callback, receiver);
                },
                sort: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signals.sort.addOnce(callback, receiver);
                }
            };
        }

        private _initItems(items: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): void {
            Array.prototype.push.apply(this, Collection._convertToModels(this, items));
        }

        private _dispatchSignal(signal: Signal<any>, 
                                param: Collection.TCollectionSignalParam<typeof Model.prototype.PROPS>): void {
            //todo Раскомментировать после того, как реализуется транзакция для коллекции

            //if (this._state !== Collection.STATE.SILENT) {
            signal.dispatch(param);
            //}
        }

        private _receiveModelsChangeSignals(models: Array<Model> | Collection<Model>): void {
            if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                return;
            }

            for (let i = models.length; i--;) {
                let model = models[i];

                if (!this._modelsIdsHash[model.cid]) {
                    this.receive(model.signals.change, this._onChangeModel);

                    this._modelsIdsHash[model.cid] = true;
                }
            }
        }

        private _stopReceivingModelsChangeSignals(models: Array<Model>): void {
            if (this._receiveChangeSignalsState === Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO) {
                return;
            }

            for (let i = models.length; i--;) {
                let model = models[i];

                this.stopReceiving(model.signals.change, this._onChangeModel);

                delete this._modelsIdsHash[model.cid];
            }
        }

        private _onChangeModel(param: Headlight.Model.IChangeParam<typeof Model.prototype.PROPS>): void {
            let values: IHash<typeof Model.prototype.PROPS> = {},
                previous: IHash<typeof Model.prototype.PROPS> = {},
                model = param.model;

            values[model.cid] = param.values;
            previous[model.cid] = param.previous;

            this._dispatchSignal(this.signals.change, {
                collection: this,
                models: new Collection.SimpleCollection<Model>([model], this.model()),
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
                models: Array<Headlight.Model<any>> = [];

            function add(item: Headlight.Model<any> | any): void {
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
        export type TArrayOrCollection<Schema> = Array<Model.TModelOrSchema<Schema>> | 
            Collection<Model<Schema>>;
            
        export type TCollectionSignalParam<Schema> = ISignalCallbackParam<Schema> | ISignalCallbackModelsParam<Schema> |
            ISignalCallbackChangeParam<Schema>

        export interface ISignalCallbackParam<Schema> {
            collection: Collection<Model<Schema>>;
        }

        export interface ISignalCallbackModelsParam<Schema> extends ISignalCallbackParam<Schema> {
            models: Collection<Model<Schema>>;
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

        export class SimpleCollection<Model extends Headlight.Model<any>> extends Collection<Model> {
            private _M: typeof Model;

            constructor(items: Array<Model.TModelOrSchema<any>>, M: typeof Model) {
                (() => {
                    this._initProps(items, M);
                })();
                
                super(items);
            }

            protected model(): typeof Model {
                return this._M;
            };

            private _initProps(items: Array<Model.TModelOrSchema<any>>,
                               M: typeof Model): Array<Model.TModelOrSchema<any>> {

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
