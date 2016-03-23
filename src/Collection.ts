///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';
    
    const EVENTS = {
        CHANGE: 'change',
        UPDATE: 'update',
        SORT: 'sort'
    };
    
    const EVENT_NAMES = [EVENTS.CHANGE, EVENTS.UPDATE, EVENTS.SORT];

    export abstract class Collection<Model extends Headlight.Model<any>> extends Array<Model> {
        public cid: string;
        public on: Collection.ISignalListeners<typeof Model.prototype.PROPS>;
        public once: Collection.ISignalListeners<typeof Model.prototype.PROPS>;
        public signal: Signal<typeof Model.prototype.PROPS> = new Signal();
        
        private _signals: Signal.ISignalCache = {};
        private _state: Collection.STATE = Collection.STATE.SILENT;
        private _receiveChangeSignalsState: Collection.RECEIVE_CHANGE_SIGNALS_STATE =
            Collection.RECEIVE_CHANGE_SIGNALS_STATE.NO;
        private _modelsCidsHash: IHash<Model> = {};
        private _modelsIdsHash: IHash<Model> = {};
        private _modelsCountHash: IHash<number> = {};
        private _transactionArtifact: ITransactionArtifact<typeof Model.prototype.PROPS>;

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

            this._onAddModels(models);

            this._dispatchSignal<Collection.IEventAddParam<typeof Model.prototype.PROPS>>(this.signal, {
                collection: this,
                update: {
                    add: this.slice(oldLength, this.length)
                }
            });

            return this.length;
        }

        public pop(): Model {
            let model = Array.prototype.pop.call(this);

            if (model) {
                let models = [model];

                this._onRemoveModels(models);

                this._dispatchSignal<Collection.IEventRemoveParam<typeof Model.prototype.PROPS>>(this.signal, {
                    collection: this,
                    update: {
                        remove: new Collection.SimpleCollection<Model>(models, this.model())
                    }
                });
            }

            return model;
        }

        public concat(...items: Array<Collection.TArrayOrCollection<typeof Model.prototype.PROPS> |
            Model.TModelOrSchema<typeof Model.prototype.PROPS>>): Collection.SimpleCollection<Model> {

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
            
            this._dispatchSignal<Collection.IEventSortParam<typeof Model.prototype.PROPS>>(this.signal, {
                collection: this,
                sort: true
            });

            return this;
        }

        public shift(): Model {
            let model = Array.prototype.shift.call(this);

            if (model) {
                let models = [model];

                this._onRemoveModels(models);
                
                this._dispatchSignal<Collection.IEventRemoveParam<typeof Model.prototype.PROPS>>(this.signal, {
                    collection: this,
                    update: {
                        remove: new Collection.SimpleCollection<Model>(models, this.model())
                    }
                });
            }

            return model;
        }

        public slice(start?: number, end?: number): Collection.SimpleCollection<Model> {
            return new Collection.SimpleCollection<Model>(
                    Array.prototype.slice.call(this, start, end), 
                    this.model()
                );
        }

        public sort(compareFn?: (a: Model,
                                 b: Model) => number): Collection<Model> {
            Array.prototype.sort.call(this, compareFn);

            this._dispatchSignal<Collection.IEventSortParam<typeof Model.prototype.PROPS>>(this.signal, {
                collection: this,
                sort: true
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
                ),
                removedCollection = new Collection.SimpleCollection<Model>(removed, M),
                addedCollection = new Collection.SimpleCollection<Model>(models, M);

            this._onRemoveModels(removed);

            this._onAddModels(models);
            
            let param = <Collection.IEventUpdateParam<typeof Model.prototype.PROPS>>{
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

        public unshift(...items: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): number {
            Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

            let models = this.slice(0, items.length);

            this._onAddModels(models);

            this._dispatchSignal<Collection.IEventAddParam<typeof Model.prototype.PROPS>>(this.signal, {
                collection: this,
                update: {
                    add: models
                }
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
        
        public add(itemOrItems: Model.TModelOrSchema<typeof Model.prototype.PROPS> |   
                    Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): number {
            return this.push.apply(this, itemOrItems);
        }
        
        public get(idOrCid: string | number): Model | void {
            return this._modelsCidsHash[idOrCid] || this._modelsIdsHash[idOrCid]; 
        }
        
        public has(idOrCidOrModel: string | number | Model): boolean {
            if ( idOrCidOrModel instanceof Headlight.Model) {
                return !!this._modelsCidsHash[idOrCidOrModel.cid];
            } 
            
            return !!this.get(<string | number>idOrCidOrModel);
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
        
        public static filter<M extends Headlight.Model<any>>(events: Collection.IEvents,
                             callback: Signal.ISignalCallback<Collection.IEventAnyParam<any>>):
            Signal.ISignalCallback<Collection.IEventParam<any>> {
            
            
            let fn = <Signal.ISignalCallback<Collection.IEventAnyParam<any>>>(
                (param: Collection.IEventAnyParam<any>) => {
                    
                let n: string,
                    flag = false,
                    names: Array<string>,
                    p = <Collection.IEventAnyParam<any>>{
                        collection: param.collection
                    };
                
                let eventsNames = EVENT_NAMES;
                
                for (let i = eventsNames.length; i--;) {
                    let eventName = eventsNames[i],
                        eventData = param[eventName]; 
                        
                    if (!eventData) {
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
        
        /*public static filter<M extends Headlight.Model<any>>(events: Model.IEvents,
                             callback: Signal.ISignalCallback<Collection.IEventParam<any>>):
            Signal.ISignalCallback<Collection.IEventParam<any>> {
                
            let fn = <Signal.ISignalCallback<Collection.IEventParam<any>>>((param: Collection.IEventParam<any>) => {
                let n: string,
                    flag = false,
                    names: Array<string>,
                    p = <Collection.IEventParam<any>>{
                        events: {},
                        collection: param.collection,
                    };
                
                let eventsNames = Object.keys(events);
                
                for (let i = eventsNames.length; i--;) {
                    let eventName = eventsNames[i],
                        eventData = param.events[eventName]; 
                        
                    if (Array.isArray(eventData)) {
                        names = <Array<string>>eventData;
                    } else if (eventData === true) {
                        if (eventName === 'change') {
                            names = Object.keys(param.values || {});    
                        }
                    }
                    
                    for (let i = names.length; i--;) {
                        n = names[i];
                        
                        if (eventName === 'change') {
                            p.values = p.values || <S>{};
                            p.previous = p.previous || <S>{};

                            if (events.change === true || (<Array<string>>events.change).indexOf(n) !== -1) {
                                //flag = true;
                                
                                p.values[n] = param.values[n];
                                p.previous[n] = param.previous[n];
                            }    
                        }
                        
                        if (events[eventName] === true || events[eventName].indexOf(n) !== -1) {
                            flag = true;
                            
                            p.events[eventName] = p.events[eventName] || [];
                            p.events[eventName].push(n);
                        }
                    }      
                }
                
                if (flag) {
                    callback(p);
                }
            });

            fn.originalCallback = callback.originalCallback || callback;

            return fn;
        }*/
        
        public static filterSignal<M extends Headlight.Model<S>, S>(args: {
                callback: Signal.ISignalCallback<Collection.IEventParam<S>>,
                events: Collection.TCollectionEvents | Array<Collection.TCollectionEvents>,
                propNames?: string | Array<string>,
            }): Signal.ISignalCallback<Collection.IEventAnyParam<S>> {
                
            let events = Array.isArray(args.events) ? 
                    <Array<Collection.TCollectionEvents>>args.events : [<Collection.TCollectionEvents>args.events],
                names = Array.isArray(args.propNames) ? <Array<string>>args.propNames : [<string>args.propNames],
                fn = <Signal.ISignalCallback<Collection.IEventParam<S>>>
                    ((a: Collection.IEventParam<S>) => {
                        /* tslint:disable */
                        let flag = false,
                            param = <any>{
                                collection: this
                            };
                        
                        
                       
                        
                        //if (events.indexOf(Collection.EVENTS.CHANGE) !== -1 && a.events.indexOf(Collection.EVENTS.CHANGE) !== -1) {
                        /* tslint:enable */
                            // let param = <Collection.ISignalCallbackChangeParam<S>>a,
                            //     values = <IHash<S>>{},
                            //     previous = <IHash<S>>{},
                            //     models = new Collection.SimpleCollection<M>([], param.collection.model()),
                            //     n: string,
                            //     flag = false;
                                
                            // for (let i = names.length; i--;) {
                            //     n = names[i];
                                
                            //     let modelCids = Object.keys(param.values);
                                
                            //     for (let j = modelCids.length; j--;) {
                            //         let modelCid = modelCids[j],
                            //             modelValues = param.values[modelCid];
                                        
                            //         values[modelCid] = <S>{};
                            //         previous[modelCid] = <S>{};
                                    
                            //         if (n in modelValues) {
                            //             models.push(<Headlight.Model<S>>param.collection.get(modelCid));
                                        
                            //             values[modelCid][n] = modelValues[n];
                            //             previous[modelCid][n] = param.previous[modelCid][n];

                            //             flag = true;
                            //         }
                            //     }
                            // }    
                                
                            // if (flag) {
                            //     args.callback({
                            //         events: events,
                            //         collection: param.collection,
                            //         changedModels: models,
                            //         values: values,
                            //         previous: previous
                            //     });
                            // }   
                        /* tslint:disable */    
                        // } else if (
                        //         (events.indexOf('sort') !== -1 && a.events.indexOf('sort') !== -1) ||
                        //         (events.indexOf('add') !== -1 && a.events.indexOf('add') !== -1) ||  
                        //         (events.indexOf('remove') !== -1 && a.events.indexOf('remove') !== -1) ||  
                        //         (events.indexOf('update') !== -1 && a.events.indexOf('update') !== -1) ||  
                        //         (events.indexOf(Collection.EVENTS.ANY) !== -1 && a.events.indexOf(Collection.EVENTS.ANY) !== -1)
                        //     ) {
                        // /* tslint:enable */
                        //     args.callback(a);
                        // }

                    
                        
                         
                        
                         
                    });

            fn.originalCallback = args.callback;

            return fn;
        }
        
        public static performTransaction<M extends Headlight.Model<any>>(collection: Collection<M>,
            callback: (collection: Collection<M>) => void): void {
                
            collection._state = Collection.STATE.IN_TRANSACTION;

            callback(collection);
            
            let param: Collection.IEventParam<any>;

            collection.signal.dispatch(collection._transactionArtifact)

            collection._clearTransactionArtifact();
            collection._state = Collection.STATE.NORMAL;

        }

        protected cidPrefix(): string {
            return 'c';
        }

        protected abstract model(): typeof Model;
        
        private _clearTransactionArtifact(): void {
            this._transactionArtifact = null;
        }

        private _createSignals(): void {
            /* tslint:disable */
            type TSCWithChangeParam = Signal.ISignalCallback<Collection.IEventChangeParam<typeof Model.prototype.PROPS>>;
            type TSCWithAddParam = Signal.ISignalCallback<Collection.IEventAddParam<typeof Model.prototype.PROPS>>;
            type TSCWithRemoveParam = Signal.ISignalCallback<Collection.IEventRemoveParam<typeof Model.prototype.PROPS>>;
            type TSCWithUpdateParam = Signal.ISignalCallback<Collection.IEventUpdateParam<typeof Model.prototype.PROPS>>;
            type TSCWithSortParam = Signal.ISignalCallback<Collection.IEventSortParam<typeof Model.prototype.PROPS>>;
            type TSCWithParam = Signal.ISignalCallback<Collection.IEventAnyParam<typeof Model.prototype.PROPS>>;
            /* tslint:enable */

            this.on = {
                change: (callback: TSCWithChangeParam, receiver?: Receiver): void => {
                    this.signal.add(
                        Collection._wrapCallback(
                            (param: Collection.IEventChangeParam<typeof Model.prototype.PROPS>) => {
                                if (param.change) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                add: (callback: TSCWithAddParam, receiver?: Receiver): void => {
                    this.signal.add(
                        Collection._wrapCallback(
                            (param: Collection.IEventAddParam<typeof Model.prototype.PROPS>) => {
                                if (param.update && param.update.add) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                remove: (callback: TSCWithRemoveParam, receiver?: Receiver): void => {
                    this.signal.add(
                        Collection._wrapCallback(
                            (param: Collection.IEventRemoveParam<typeof Model.prototype.PROPS>) => {
                                if (param.update && param.update.remove) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                update: (callback: TSCWithAddParam, receiver?: Receiver): void => {
                    this.signal.add(
                        Collection._wrapCallback(
                            (param: Collection.IEventUpdateParam<typeof Model.prototype.PROPS>) => {
                                if (param.update) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                sort: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signal.add(
                        Collection._wrapCallback(
                            (param: Collection.IEventSortParam<typeof Model.prototype.PROPS>) => {
                                if (param.sort) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                any: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signal.add(callback, receiver);
                }
            };

            this.once = {
                change: (callback: TSCWithChangeParam, receiver?: Receiver): void => {
                    this.signal.addOnce(
                        Collection._wrapCallback(
                            (param: Collection.IEventChangeParam<typeof Model.prototype.PROPS>) => {
                                if (param.change) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                add: (callback: TSCWithAddParam, receiver?: Receiver): void => {
                    this.signal.addOnce(
                        Collection._wrapCallback(
                            (param: Collection.IEventAddParam<typeof Model.prototype.PROPS>) => {
                                if (param.update && param.update.add) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                remove: (callback: TSCWithRemoveParam, receiver?: Receiver): void => {
                    this.signal.addOnce(
                        Collection._wrapCallback(
                            (param: Collection.IEventRemoveParam<typeof Model.prototype.PROPS>) => {
                                if (param.update && param.update.remove) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                update: (callback: TSCWithAddParam, receiver?: Receiver): void => {
                    this.signal.addOnce(
                        Collection._wrapCallback(
                            (param: Collection.IEventUpdateParam<typeof Model.prototype.PROPS>) => {
                                if (param.update) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                sort: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signal.addOnce(
                        Collection._wrapCallback(
                            (param: Collection.IEventSortParam<typeof Model.prototype.PROPS>) => {
                                if (param.sort) {
                                    callback.call(this, param);    
                                }
                            }, callback), 
                        receiver);
                },
                any: (callback: TSCWithParam, receiver?: Receiver): void => {
                    this.signal.addOnce(callback, receiver);
                }
            };
        }

        private _initItems(items: Array<Model.TModelOrSchema<typeof Model.prototype.PROPS>>): void {
            let models = Collection._convertToModels(this, items);
            
            Array.prototype.push.apply(this, models);
            
            this._onAddModels(models);
        }

        private _dispatchSignal<T extends Collection.IEventAnyParam<typeof Model.prototype.PROPS>>(signal: Signal<any>, 
                                param: T): void {
            type TSchema = typeof Model.prototype.PROPS;    
                                    
            switch (this._state) {
                case Collection.STATE.NORMAL:                
                    
                    signal.dispatch(param);

                    break;
                case Collection.STATE.IN_TRANSACTION:
                    this._transactionArtifact = this._transactionArtifact || {
                        param: param
                    };
                    
                    if (param.sort) {
                        this._transactionArtifact.param.sort = this._transactionArtifact.param.sort || param.sort;
                    }
                    
                    if (param.update) {
                        if (param.update.add) {
                            this._transactionArtifact.param.update.add = 
                                (this._transactionArtifact.param.update.add || 
                                    new Collection.SimpleCollection([], this.model())).concat(param.update.add);
                        }
                        
                        if (param.update.remove) {
                            this._transactionArtifact.param.update.remove = 
                                (this._transactionArtifact.param.update.remove || 
                                    new Collection.SimpleCollection([], this.model())).concat(param.update.remove);
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
                    //             new Collection.SimpleCollection(param.removedModels, this.model());
                    //     }
                    // }
                    
                    // if (param.addedModels) {    
                    //     if (this._transactionArtifact.addedModels) {
                    //         this._transactionArtifact.addedModels.add(param.addedModels);    
                    //     } else {
                    //         this._transactionArtifact.addedModels = 
                    //             new Collection.SimpleCollection(param.addedModels, this.model());
                    //     }
                    // }
                    
                    // if (param.changedModels) {
                    //     if (this._transactionArtifact.changedModels) {
                    //         this._transactionArtifact.changedModels.add(param.changedModels);    
                    //     } else {
                    //         this._transactionArtifact.changedModels = 
                    //             new Collection.SimpleCollection(param.changedModels, this.model());
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
                case Collection.STATE.SILENT:

                    break;
            }
        }

        private _onAddModels(models: Array<Model> | Collection<Model>): void {
            let map = this._modelsCidsHash; 
            
            models.forEach(function (model: Model): void {
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

        private _onRemoveModels(models: Array<Model>): void {
            models.forEach(function (model: Model): void {
                if (this._modelsCountHash[model.cid] >= 1) {
                    this._modelsCountHash[model.cid]--;
                
                    if (this._modelsCountHash[model.cid] === 0) {
                        this.stopReceiving(model.signal, this._onChangeModel);
                        
                        delete this._modelsIdsHash[model[model.idAttribute]];    
                    }
                }
            }, this);
           
        }

        private _onChangeModel(param: Headlight.Model.IEventParam<typeof Model.prototype.PROPS>): void {
            // let values: IHash<typeof Model.prototype.PROPS> = {},
            //     previous: IHash<typeof Model.prototype.PROPS> = {},
            //     model = param.model;

            // values[model.cid] = param.values;
            // previous[model.cid] = param.previous;
            
            let change = <Collection.TChangeHash>{},
                events = Object.keys(param.change);        
            
            for (let e of events) {
                change[e] = change[e] || {};
                
                change[e][param.model.cid] = param.change[e];
            }

            this._dispatchSignal<Collection.IEventChangeParam<typeof Model.prototype.PROPS>>(this.signal, {
                collection: this,
                change: change
            });
        }

        private _enableSignals(): void {
            this._state = Collection.STATE.NORMAL;
        }
        
        private static _wrapCallback(fn: Signal.ISignalCallback<Collection.IEventParam<any>>,
            originalFn?: Signal.ISignalCallback<Collection.IEventParam<any>>):
            Signal.ISignalCallback<Collection.IEventParam<any>> {
            
            let callback = <Signal.ISignalCallback<Collection.IEventParam<any>>>
                ((f: Signal.ISignalCallback<Collection.IEventParam<any>>) => {
                    return (param: Collection.IEventParam<any>) => {
                        f(param);
                    };
                })(fn);
            
            callback.originalCallback = originalFn ? (originalFn.originalCallback || originalFn) : 
                fn.originalCallback || fn;
            
            return callback;
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
                if (!(item instanceof Headlight.Model)) {
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
        export const enum EVENTS { SORT, ADD, REMOVE, UPDATE, CHANGE, ANY}
        
        export type TCollectionEvents = 'sort' | 'add' | 'remove' | 'change' | 'update' | 'any';
        
        export type TArrayOrCollection<Schema> = Array<Model.TModelOrSchema<Schema>> | 
            Collection<Model<Schema>>;
            
        // export type TCollectionSignalParam<Schema> = ISignalCallbackParam<Schema> | 
        //     ISignalCallbackChangeModelsParam<Schema> |
        //     ISignalCallbackAddModelsParam<Schema> |
        //     ISignalCallbackRemoveModelsParam<Schema> |
        //     ISignalCallbackChangeParam<Schema>;
        
        export interface IEvents {
            sort?: boolean;
            update?: boolean | {
                add?: boolean,
                remove?: boolean
            };
            change?: boolean | IHash<boolean>;
        }
            
        export interface IEventParam<Schema> {
            collection: Collection<Model<Schema>>;
        }    
        
        export interface IEventSortParam<Schema> extends IEventParam<Schema> {
            sort: boolean;
        }  
        
        export interface IEventAddParam<Schema> extends IEventParam<Schema> {
            update: {
                add?: SimpleCollection<Model<Schema>>;
            };
        }
        
        export interface IEventRemoveParam<Schema> extends IEventParam<Schema> {
            update: {
                remove?: SimpleCollection<Model<Schema>>;
            };
        }
        
        export interface IEventUpdateParam<Schema> extends IEventParam<Schema>, 
                                                            IEventAddParam<Schema>, IEventRemoveParam<Schema> {
            update: {
                add?: SimpleCollection<Model<Schema>>;
                remove?: SimpleCollection<Model<Schema>>;
            };
        }
        
        export type TChangeHash = IHash<IHash<{
            value: any,
            previous: any;
        }>>;
        
        export interface IEventChangeParam<Schema> extends IEventParam<Schema> {
            change: TChangeHash;
        }    
        
        export interface IEventAnyParam<Schema> {
            collection: Collection<Model<Schema>>;
            sort?: boolean;
            update?: {
                add?: SimpleCollection<Model<Schema>>;
                remove?: SimpleCollection<Model<Schema>>;
            };
            change?: TChangeHash;
        }  

        // export interface ISignalCallbackParam<Schema> {
        //     events: IEvents;
        //     collection: Collection<Model<Schema>>;
        // }
        
        // export interface ISignalCallbackAddModelsParam<Schema> extends ISignalCallbackParam<Schema> {
        //     addedModels: Collection<Model<Schema>>;
        // }
        
        // export interface ISignalCallbackRemoveModelsParam<Schema> extends ISignalCallbackParam<Schema> {
        //     removedModels: Collection<Model<Schema>>;
        // }
        
        // export interface ISignalCallbackUpdateModelsParam<Schema> extends ISignalCallbackAddModelsParam<Schema>, 
        //     ISignalCallbackRemoveModelsParam<Schema> {
            
        // }

        // export interface ISignalCallbackChangeParam<Schema> extends ISignalCallbackParam<Schema> {
        //     changedModels: Collection<Model<Schema>>;
        //     values: IHash<Schema>;
        //     previous: IHash<Schema>;
        // }
       

        export interface ISignalListeners<Schema> {
            change(callback: Signal.ISignalCallback<IEventChangeParam<Schema>>,
                    receiver?: Receiver): void;
            update(callback: Signal.ISignalCallback<IEventUpdateParam<Schema>>, 
                    receiver?: Receiver): void;        
            add(callback: Signal.ISignalCallback<IEventAddParam<Schema>>, receiver?: Receiver): void;
            remove(callback: Signal.ISignalCallback<IEventRemoveParam<Schema>>, 
                    receiver?: Receiver): void;
            sort(callback: Signal.ISignalCallback<IEventSortParam<Schema>>, receiver?: Receiver): void;
            any(callback: Signal.ISignalCallback<IEventAnyParam<Schema>>, receiver?: Receiver): void;
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
            NORMAL,
            IN_TRANSACTION
        }

        export const enum RECEIVE_CHANGE_SIGNALS_STATE {
            NO,
            INITIALIZING,
            YES
        }
    }
    
    interface ITransactionArtifact<Schema> {
        //signal: Signal<Collection.TCollectionSignalParam<Schema>>;
        param: Collection.IEventAnyParam<Schema>;
    }
}
