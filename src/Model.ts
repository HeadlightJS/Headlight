///<reference path="Base.ts"/>
///<reference path="Receiver.ts"/>
///<reference path="Signal.ts"/>
///<reference path="dProperty.ts"/>

module Headlight {
    'use strict';
    
    const EVENTS = {
        CHANGE: 'change'
    };
    
    const EVENT_NAMES = [EVENTS.CHANGE];

    export abstract class Model<Schema> extends Receiver {
        public idAttribute: string;
        
        public on: Model.ISignalListeners<Schema>;
        public once: Model.ISignalListeners<Schema>;
        public off: Model.ISignalListenerStoppers<Schema>;

        public PROPS: Schema;
        public signal: Signal<Model.IEventParam<Schema>> = new Signal();;

        private _depsMap: {
            [key: string]: Array<string>;
        };
        private _properties: Schema = <Schema>{};
        private _state: Model.STATE = Model.STATE.SILENT;
        private _transactionArtifact: ITransactionArtifact<Schema>;

        constructor(args: Schema) {
            super();

            this._createSignals();
            this._initProperties(args);
            this._enableSignals();
            
            this.idAttribute = this.idAttribute || 'id';
        }

        public toJSON<T>(): T | Schema {
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
            
            model.signal.dispatch(model._transactionArtifact.param);

            model._clearTransactionArtifact();
            model._state = Model.STATE.NORMAL;
        }

        public static performSilentTransaction<S>(model: Model<S>,
                                                  callback: (model: Model<S>) => void): void {
            model._state = Model.STATE.SILENT;

            callback(model);

            model._state = Model.STATE.NORMAL;
        }
        
        public static dispatchSignals(model: Model<any>, prop: string, newVal: any, prev: any): void {
            if (newVal !== prev) {
                let values = {},
                    previous = {},
                    d: string,
                    prevValue: any,
                    currValue: any,
                    props = [prop],
                    changeObj = <any>{};
                    
                changeObj[prop] = {
                    value: newVal,
                    previous: prev    
                }; 

                (function iterateThroughDeps(deps:  Array<string>): void {
                    for (let j = deps.length; j--;) {
                        d = deps[j];
                        prevValue = model._properties[d];
                        currValue = model[d];

                        if (currValue !== prevValue) {
                            changeObj[d] = {
                                value: currValue,
                                previous: prevValue
                            };

                            iterateThroughDeps(model._depsMap[d]);
                        }
                    }
                })(model._depsMap[prop]);

                Model.dispatch(model, {
                    model: model,
                    change: changeObj
                });
            }
        }

        public static dispatch<S>(model: Model<S>, attr: Model.IEventParam<S>): void {
            let signal = model.signal;

            switch (model._state) {
                case Model.STATE.NORMAL:
                    signal.dispatch(attr);

                    break;
                case Model.STATE.IN_TRANSACTION:
                    model._transactionArtifact = model._transactionArtifact || {
                        param: attr
                    };
                    
                    if (attr.change) {
                        let changedProps = Object.keys(attr.change);
                        
                        model._transactionArtifact.param.change = model._transactionArtifact.param.change || {};  
                        
                        for (let i = changedProps.length; i--;) {
                            let p = changedProps[i];
                            
                            model._transactionArtifact.param.change[p] = model._transactionArtifact.param.change[p] || {
                                value: undefined,
                                previous: attr.change[p].previous
                            };
                            
                            model._transactionArtifact.param.change[p].value = attr.change[p].value;
                        } 
                        
                    }

                    break;
                case Model.STATE.SILENT:

                    break;
            }
        }

        public static filter<S>(events: Model.IEvents,
                             callback: Signal.ISignalCallback<Model.IEventParam<S>>):
            Signal.ISignalCallback<Model.IEventParam<S>> {

            let fn = <Signal.ISignalCallback<Model.IEventParam<S>>>((param: Model.IEventParam<S>) => {
                let n: string,
                    flag = false,
                    names: Array<string>,
                    p = <Model.IEventParam<S>>{
                        model: param.model
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

        protected cidPrefix(): string {
            return 'm';
        }

        private _clearTransactionArtifact(): void {
            this._transactionArtifact = null;
        }

        private _createSignals(): void {
            this.on = {
                change: (param: Model.ISignalListenerParam<Schema>): void => {
                    this.signal.add(
                        Model.filter<Schema>({
                                change: param.events || true
                            }, param.callback), 
                        param.receiver);         
                }
            };
            this.once = {
                change: (param: Model.ISignalListenerParam<Schema>): void => {
                    this.signal.addOnce(
                        Model.filter<Schema>({
                                change: param.events || true
                            }, param.callback), 
                        param.receiver);         
                }
            };
            this.off = {
                change: (callbackOrReceiver?: Model.TSignalCallback<Schema> | Receiver,
                         receiver?: Receiver): void => {
                    this.signal.remove(<Model.TSignalCallback<Schema>>callbackOrReceiver, receiver);
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
        export type TModelOrSchema<Schema> = Model<Schema> | Schema;
        export type TSignal<S> = Signal<IEventParam<S>>;
        export type TSignalCallback<S> = Signal.ISignalCallback<IEventParam<S>>;
        export type TParamValues = IHash<{
                value: any,
                previous: any;
            }>;

        export interface ISignalListeners<Schema> {
            change(param: ISignalListenerParam<Schema>): void;
        }

        export interface ISignalListenerStoppers<Schema> {
            change(): void;
            change(callback: TSignalCallback<Schema>): void;
            change(receiver: Receiver): void;
            change(callback: TSignalCallback<Schema>, receiver: Receiver): void;
        }
        
        export interface ISignalListenerParam<Schema> {
            callback: TSignalCallback<Schema>;
            receiver?: Receiver;
            events?: IHash<boolean>;
        }

        export interface ISignalHash<Schema> {
            change: TSignal<Schema>;
        }
        
        export interface IEvents {
            change?: boolean | IHash<boolean>;
        }

        export interface IEventParam<Schema> {
            model: Model<Schema>;
            change?: TParamValues;
        }

        export const enum STATE {
            SILENT,
            NORMAL,
            IN_TRANSACTION
        }
    }
    
    interface ITransactionArtifact<Schema> {
        param: Model.IEventParam<Schema>;
    }
}
