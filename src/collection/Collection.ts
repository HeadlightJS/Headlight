import {Base} from '../base/Base';
import {IHash} from '../base/base.d';
import {Signal} from '../signal/Signal';
import {Receiver} from '../receiver/Receiver';
import {IFunc, IHandler} from '../receiver/receiver.d';
import {ISignal, ISignalCache, ISignalCallback} from '../signal/signal.d';
import {ICollectionTransactionArtifact} from '../transaction/transaction.d';
import {Model} from '../model/Model';
import {IModel, TModelOrSchema, IEventParam as IModelEventParam} from '../model/model.d';
import {ICollection, TTypeOfProps, ISignalListenerParam, ISignalListeners, IEventAddParam, IEventRemoveParam, 
    IEventSortParam, IEventChangeParam, IEventAnyParam, IEventParam, TArrayOrCollection, IEvents, 
    TChangeHash, IEventUpdateParam, } from './collection.d';

export const enum STATE {
    SILENT,
    NORMAL,
    IN_TRANSACTION
}

export const enum RECEIVE_CHANGE_SIGNALS_STATE {
    NO,
    INITIALIZING,
    YES
}

const EVENTS = {
    CHANGE: 'change',
    UPDATE: 'update',
    SORT: 'sort'
};

const EVENT_NAMES = [EVENTS.CHANGE, EVENTS.UPDATE, EVENTS.SORT];

export class Collection<M extends Model<any>> extends Array<M> implements ICollection<IModel<any>> {
    public cid: string;
    public on: ISignalListeners<TTypeOfProps>;
    public once: ISignalListeners<TTypeOfProps>;
    public signal: ISignal<TTypeOfProps> = new Signal();
    
    private _signals: ISignalCache = {};
    private _state: STATE = STATE.SILENT;
    private _receiveChangeSignalsState: RECEIVE_CHANGE_SIGNALS_STATE =
        RECEIVE_CHANGE_SIGNALS_STATE.NO;
    private _modelsCidsHash: IHash<M> = {};
    private _modelsIdsHash: IHash<M> = {};
    private _modelsCountHash: IHash<number> = {};
    private _transactionArtifact: ICollectionTransactionArtifact<TTypeOfProps>;

    constructor(items?: Array<TModelOrSchema<TTypeOfProps>>) {
        super();

        this.cid = Base.generateCid(this.cidPrefix());

        this._createSignals();
        this._initItems(items);
        this._enableSignals();
    }

    public toJSON(): Array<TTypeOfProps> {
        return Array.prototype.map.call(this, (M: TModelOrSchema<TTypeOfProps>) => {
            return (<M>M).toJSON();
        });
    }

    public toString(): string {
        return JSON.stringify(this.toJSON());
    }

    public push(...items: Array<TModelOrSchema<TTypeOfProps>>): number {
        let oldLength = this.length,
            models = Collection._convertToModels(this, items);

        Array.prototype.push.apply(this, models);

        this._onAddModels(models);

        this._dispatchSignal<IEventAddParam<TTypeOfProps>>(this.signal, {
            collection: this,
            update: {
                add: this.slice(oldLength, this.length)
            }
        });

        return this.length;
    }

    public pop(): M {
        let M = Array.prototype.pop.call(this);

        if (M) {
            let models = [M];

            this._onRemoveModels(models);

            this._dispatchSignal<IEventRemoveParam<TTypeOfProps>>(this.signal, {
                collection: this,
                update: {
                    remove: new Collection<M>(models)
                }
            });
        }

        return M;
    }

    public concat(...items: Array<TArrayOrCollection<TTypeOfProps> |
        TModelOrSchema<TTypeOfProps>>): ICollection<M> {

        let models = [],
            newModels = Collection._convertToModels(this, items);

        for (let i = this.length; i--;) {
            models[i] = this[i];
        }

        return new Collection<M>(models.concat(newModels));
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

    public reverse(): this {
        Array.prototype.reverse.call(this);
        
        this._dispatchSignal<IEventSortParam<TTypeOfProps>>(this.signal, {
            collection: this,
            sort: true
        });

        return this;
    }

    public shift(): M {
        let M = Array.prototype.shift.call(this);

        if (M) {
            let models = [M];

            this._onRemoveModels(models);
            
            this._dispatchSignal<IEventRemoveParam<TTypeOfProps>>(this.signal, {
                collection: this,
                update: {
                    remove: new Collection<M>(models)
                }
            });
        }

        return M;
    }

    public slice(start?: number, end?: number): ICollection<M> {
        return new Collection<M>(Array.prototype.slice.call(this, start, end));
    }

    public sort(compareFn?: (a: M, b: M) => number): this {
        Array.prototype.sort.call(this, compareFn);

        this._dispatchSignal<IEventSortParam<TTypeOfProps>>(this.signal, {
            collection: this,
            sort: true
        });

        return this;
    };

    public splice(start: number, ...items: Array<number | TModelOrSchema<TTypeOfProps>>): Collection<M> {
        let end = items.shift(),
            models = Collection._convertToModels(this, items),
            removed = Array.prototype.splice.apply(this,
                [start, end].concat(models)
            ),
            removedCollection = new Collection<M>(removed),
            addedCollection = new Collection<M>(models);

        this._onRemoveModels(removed);

        this._onAddModels(models);
        
        let param = <IEventUpdateParam<TTypeOfProps>>{
                collection: this,
                update: {}
            };
        
        if (removed.length) {
            param.update.remove = removedCollection;
        }
        
        if (models.length) {
            param.update.add = addedCollection;
        }
        
        this._dispatchSignal(this.signal, param);

        return removedCollection;
    };

    public unshift(...items: Array<TModelOrSchema<TTypeOfProps>>): number {
        Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

        let models = this.slice(0, items.length);

        this._onAddModels(models);

        this._dispatchSignal<IEventAddParam<TTypeOfProps>>(this.signal, {
            collection: this,
            update: {
                add: models
            }
        });    

        return this.length;
    };

    public filter(callbackfn: (value: TModelOrSchema<TTypeOfProps>,
                                index: number,
                                collection: Collection<M>) => boolean,
                    thisArg?: any): Collection<M> {
        return new Collection<M>(Array.prototype.filter.call(this, callbackfn, thisArg));
    };
    
    public add(itemOrItems: TModelOrSchema<TTypeOfProps> |   
                Array<TModelOrSchema<TTypeOfProps>>): number {
        let arr = <Array<TModelOrSchema<TTypeOfProps>>>[];
        
        if (Array.isArray(itemOrItems)) {
            arr = itemOrItems;
        } else {
            arr.push(itemOrItems);
        }             
                    
        return this.push.apply(this, arr);
    }
    
    public get(idOrCid: string | number): M | void {
        return this._modelsCidsHash[idOrCid] || this._modelsIdsHash[idOrCid]; 
    }
    
    public has(idOrCidOrModel: string | number | M): boolean {
        if ( idOrCidOrModel instanceof Model) {
            return !!this._modelsCidsHash[(<M>idOrCidOrModel).cid];
        } 
        
        return !!this.get(<string | number>idOrCidOrModel);
    }

    public receive<CallbackParam>(signal: Signal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void {
        return Receiver.prototype.receive.call(this, signal, callback);                                
    };

    public listen<S, R>(callback: (fn: IFunc<S>) => R, handler: IHandler<R>): void {
        return Receiver.prototype.listen.call(this, callback, handler);
    }

    public receiveOnce<CallbackParam>(signal: Signal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void {
        return Receiver.prototype.receiveOnce.call(this, signal, callback);                                
    };

    public stopReceiving<CallbackParam>(signalOrCallback?: ISignal<CallbackParam> | ISignalCallback<CallbackParam>,
                                        callback?: ISignalCallback<CallbackParam>): void {
        return Receiver.prototype.stopReceiving.call(this, signalOrCallback, callback);                                
    };

    public addSignal(signal: Signal<any>): void {
        return Receiver.prototype.addSignal.call(this, signal);                                
    };

    public removeSignal(signal: Signal<any>): void {
        return Receiver.prototype.removeSignal.call(this, signal);                                
    };

    public hasSignal(signal: Signal<any>): boolean {
        return Receiver.prototype.hasSignal.call(this, signal);                                
    };

    public getSignals(): Array<Signal<any>> {
        return Receiver.prototype.getSignals.call(this);                                
    };

    public resetSignals(): void {
        return Receiver.prototype.resetSignals.call(this);                                
    };
    
    public performTransaction(callback: (Collection: this) => void): void {
        Collection.performTransaction<M>(this, callback);
    }
    
    public performSilentTransaction(callback: (Collection: this) => void): void {
        Collection.performSilentTransaction<M>(this, callback);
    }
    
    public static filter<M extends Model<any>>(events: IEvents, callback: ISignalCallback<IEventAnyParam<any>>): 
        ISignalCallback<IEventParam<any>> {
        
        let fn = <ISignalCallback<IEventAnyParam<any>>>(
            (param: IEventAnyParam<any>) => {
                
            let n: string,
                flag = false,
                names: Array<string>,
                p = <IEventAnyParam<any>>{
                    collection: param.collection
                };
            
            let eventsNames = EVENT_NAMES;
            
            for (let i = eventsNames.length; i--;) {
                let eventName = eventsNames[i],
                    eventData = param[eventName]; 
                    
                if (!eventData) {
                    continue;
                }
                
                if (eventData === true) {
                    flag = true;
                    
                    p[eventName] = true;
                    
                    continue;
                }
                    
                names = Object.keys(eventData);
                
                for (let i = names.length; i--;) {
                    n = names[i];
                    
                    if (events[eventName] && (events[eventName] === true || events[eventName][n])) {
                        p[eventName] = p[eventName] || {};
                        
                        p[eventName][n] = eventData[n];
                        
                        flag = true;
                    }
                }      
            }
            
            if (flag) {
                callback(p);
            }
        });

        fn.originalCallback = callback.originalCallback || callback;

        return fn;
    }
    
    public static performTransaction<M extends Model<any>>(collection: Collection<M>,
        callback: (collection: Collection<M>) => void): void {
            
        collection._state = STATE.IN_TRANSACTION;

        callback(collection);
        
        let param: IEventParam<any>;

        collection.signal.dispatch(collection._transactionArtifact.param);

        collection._clearTransactionArtifact();
        collection._state = STATE.NORMAL;

    }
    
    public static performSilentTransaction<M extends Model<any>>(collection: Collection<M>,
                                                callback: (collection: Collection<M>) => void): void {
        collection._state = STATE.SILENT;

        callback(collection);

        collection._state = STATE.NORMAL;
    }

    protected cidPrefix(): string {
        return 'c';
    }

    protected model(): typeof Model {
        return Model;
    }
    
    private _clearTransactionArtifact(): void {
        this._transactionArtifact = null;
    }

    private _createSignals(): void {
        type TSCWithChangeParam = ISignalCallback<IEventChangeParam<TTypeOfProps>>;
        type TSCWithAddParam = ISignalCallback<IEventAddParam<TTypeOfProps>>;
        type TSCWithRemoveParam = ISignalCallback<IEventRemoveParam<TTypeOfProps>>;
        type TSCWithUpdateParam = ISignalCallback<IEventUpdateParam<TTypeOfProps>>;
        type TSCWithSortParam = ISignalCallback<IEventSortParam<TTypeOfProps>>;
        type TSCWithParam = ISignalCallback<IEventAnyParam<TTypeOfProps>>;

        this.on = {
            change: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(
                    Collection.filter<M>({
                            change: param.events || true
                        }, param.callback), 
                    param.receiver); 
            },
            add: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(
                    Collection.filter<M>({
                            update: {
                                add: true
                            }
                        }, param.callback), 
                    param.receiver);
            },
            remove: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(
                    Collection.filter<M>({
                            update: {
                                remove: true
                            }
                        }, param.callback), 
                    param.receiver);
            },
            update: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(
                    Collection.filter<M>({
                            update: param.events || true
                        }, param.callback), 
                    param.receiver);
            },
            sort: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(
                    Collection.filter<M>({
                            sort: true
                        }, param.callback), 
                    param.receiver);
            },
            any: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.add(param.callback, param.receiver);
            }
        };
        
        this.once = {
            change: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(
                    Collection.filter<M>({
                            change: param.events || true
                        }, param.callback), 
                    param.receiver); 
            },
            add: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(
                    Collection.filter<M>({
                            update: {
                                add: true
                            }
                        }, param.callback), 
                    param.receiver);
            },
            remove: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(
                    Collection.filter<M>({
                            update: {
                                remove: true
                            }
                        }, param.callback), 
                    param.receiver);
            },
            update: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(
                    Collection.filter<M>({
                            update: param.events || true
                        }, param.callback), 
                    param.receiver);
            },
            sort: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(
                    Collection.filter<M>({
                            sort: true
                        }, param.callback), 
                    param.receiver);
            },
            any: (param: ISignalListenerParam<TTypeOfProps>): void => {
                this.signal.addOnce(param.callback, param.receiver);
            }
        };
    }

    private _initItems(items: Array<TModelOrSchema<TTypeOfProps>>): void {
        let models = Collection._convertToModels(this, items);
        
        Array.prototype.push.apply(this, models);
        
        this._onAddModels(models);
    }

    private _dispatchSignal<T extends IEventAnyParam<TTypeOfProps>>(signal: ISignal<any>, 
                            param: T): void {
        type TSchema = TTypeOfProps;    
                                
        switch (this._state) {
            case STATE.NORMAL:                
                
                signal.dispatch(param);

                break;
            case STATE.IN_TRANSACTION:
                this._transactionArtifact = this._transactionArtifact || {
                    param: param
                };
                
                if (param.sort) {
                    this._transactionArtifact.param.sort = this._transactionArtifact.param.sort || param.sort;
                }
                
                if (param.update) {
                    this._transactionArtifact.param.update = this._transactionArtifact.param.update || {};
                    
                    if (param.update.add) {
                        this._transactionArtifact.param.update.add = 
                            (this._transactionArtifact.param.update.add || 
                                new Collection([])).concat(param.update.add);
                    }
                    
                    if (param.update.remove) {
                        this._transactionArtifact.param.update.remove = 
                            (this._transactionArtifact.param.update.remove || 
                                new Collection([])).concat(param.update.remove);
                    }
                }
                
                if (param.change) {
                    let changedProps = Object.keys(param.change);
                    
                    this._transactionArtifact.param.change = this._transactionArtifact.param.change || {};
                    
                    for (let i = changedProps.length; i--;) {
                        let p = changedProps[i];
                        
                        this._transactionArtifact.param.change[p] = this._transactionArtifact.param.change[p] || {};
                        
                        let cids = Object.keys(param.change[p]);
                        
                        for (let j = cids.length; j--;) {
                            let cid = cids[j];
                            
                            this._transactionArtifact.param.change[p][cid] = 
                                this._transactionArtifact.param.change[p][cid] || {
                                    value: undefined,
                                    previous: param.change[p][cid].previous
                                };
                                
                            this._transactionArtifact.param.change[p][cid].value = param.change[p][cid].value;     
                        }
                    }
                }
                
                // if (param.removedModels) {
                //     if (this._transactionArtifact.removedModels) {
                //         this._transactionArtifact.removedModels.add(param.removedModels);    
                //     }  else {
                //         this._transactionArtifact.removedModels = 
                //             new Collection(param.removedModels, this.model());
                //     }
                // }
                
                // if (param.addedModels) {    
                //     if (this._transactionArtifact.addedModels) {
                //         this._transactionArtifact.addedModels.add(param.addedModels);    
                //     } else {
                //         this._transactionArtifact.addedModels = 
                //             new Collection(param.addedModels, this.model());
                //     }
                // }
                
                // if (param.changedModels) {
                //     if (this._transactionArtifact.changedModels) {
                //         this._transactionArtifact.changedModels.add(param.changedModels);    
                //     } else {
                //         this._transactionArtifact.changedModels = 
                //             new Collection(param.changedModels, this.model());
                //     }
                // } 
                
                // if (param.values) {
                //     this._transactionArtifact.values = this._transactionArtifact.values || {};
                //     this._transactionArtifact.previous = this._transactionArtifact.previous || {};
                    
                //     let cids = Object.keys(param.values);
                    
                //     for (let i = cids.length; i--;) {
                //         let cid = cids[i];
                        
                //         this._transactionArtifact.values[cid] = this._transactionArtifact.values[cid] || {};
                //         this._transactionArtifact.previous[cid] = this._transactionArtifact.previous[cid] || {};
                        
                //         let valuesNames = Object.keys(param.values[cid]);
                        
                //         for (let j = valuesNames.length; j--;) {
                //             let name = valuesNames[j];
                            
                //             this._transactionArtifact.values[cid][name] = param.values[cid][name];
                //             this._transactionArtifact.previous[cid][name] = param.previous[cid][name];    
                //         }
                //     }
                // }

                break;
            case STATE.SILENT:

                break;
        }
    }

    private _onAddModels(models: Array<M> | Collection<M>): void {
        let map = this._modelsCidsHash; 
        
        models.forEach(function (model: M): void {
            let cid = model.cid;
                
            if (!map[cid]) {
                this.receive(model.signal, this._onChangeModel);
                
                map[cid] = model;
                map[model[model.idAttribute]] = model;
                this._modelsCountHash[cid] = 1;
            } else {
                this._modelsCountHash[cid]++;
            }
        }, this);
    }

    private _onRemoveModels(models: Array<M>): void {
        models.forEach(function (M: M): void {
            //if (this._modelsCountHash[M.cid] >= 1) {
                this._modelsCountHash[M.cid]--;
            
                if (this._modelsCountHash[M.cid] === 0) {
                    this.stopReceiving(M.signal, this._onChangeModel);
                    
                    delete this._modelsIdsHash[M[M.idAttribute]];    
                }
            //}
        }, this);
        
    }

    private _onChangeModel(param: IModelEventParam<TTypeOfProps>): void {
        // let values: IHash<TTypeOfProps> = {},
        //     previous: IHash<TTypeOfProps> = {},
        //     M = param.M;

        // values[M.cid] = param.values;
        // previous[M.cid] = param.previous;
        
        let change = <TChangeHash>{},
            events = Object.keys(param.change);        
        
        for (let e of events) {
            change[e] = change[e] || {};
            
            change[e][param.model.cid] = param.change[e];
        }

        this._dispatchSignal<IEventChangeParam<TTypeOfProps>>(this.signal, {
            collection: this,
            change: change
        });
    }

    private _enableSignals(): void {
        this._state = STATE.NORMAL;
    }

    private static _convertToModels(
        collection: Collection<any>,
        items: Array<TModelOrSchema<any> | any>): Array<TModelOrSchema<any>> {

        if (!items || !items.length) {
            return [];
        }

        let M = collection.model(),
            models: Array<Model<any>> = [];

        function add(item: Model<any> | any): void {
            if (!(item instanceof M)) {
                if (item instanceof Model) {
                    //todo написать вывод ошибки
                    throw new Error('');
                } else {
                    models.unshift(new (<any>M)(item));
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
