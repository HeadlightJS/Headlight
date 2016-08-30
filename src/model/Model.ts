import {IModel, ISignalListeners, ISignalListenerStoppers, IEventParam, ITransactionArtifact, 
    IEvents, ISignalListenerParam, TSignalCallback, IDObservable, IDComputed} from './model.d';
import {Signal} from '../signal/Signal';
import {ISignal, ISignalCallback} from '../signal/signal.d';
import {Receiver} from '../receiver/Receiver';
import {IReceiver} from '../receiver/receiver.d';
import {observable, computed} from './decorators';

export const enum STATE {
    SILENT,
    NORMAL,
    IN_TRANSACTION
}

export const EVENTS = {
    CHANGE: 'change'
};
    
const EVENT_NAMES = [EVENTS.CHANGE];

export class Model<Schema> extends Receiver implements IModel<Schema> {
    public idAttribute: string;
    
    public on: ISignalListeners<Schema>;
    public once: ISignalListeners<Schema>;
    public off: ISignalListenerStoppers<Schema>;

    public PROPS: Schema;
    public signal: ISignal<IEventParam<Schema>> = new Signal();

    public static dProperty: IDObservable = observable;
    public static dComputedProperty: IDComputed = computed;

    private _depsMap: {
        [key: string]: Array<string>;
    };
    private _properties: Schema = <Schema>{};
    private _state: STATE = STATE.SILENT;
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
        model._state = STATE.IN_TRANSACTION;

        callback(model);
        
        model.signal.dispatch(model._transactionArtifact.param);

        model._clearTransactionArtifact();
        model._state = STATE.NORMAL;
    }

    public static performSilentTransaction<S>(model: Model<S>,
                                                callback: (model: Model<S>) => void): void {
        model._state = STATE.SILENT;

        callback(model);

        model._state = STATE.NORMAL;
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

            // if (prop === 'name') {
            //     console.log(model._depsMap[prop]);
            // } 
            

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

    public static dispatch<S>(model: Model<S>, attr: IEventParam<S>): void {
        let signal = model.signal;

        switch (model._state) {
            case STATE.NORMAL:
                signal.dispatch(attr);

                break;
            case STATE.IN_TRANSACTION:
                model._transactionArtifact = model._transactionArtifact || {
                    param: attr
                };
                
                // TODO: uncomment when adding more events    
                //if (attr.change) {
                    let changedProps = Object.keys(attr.change);
                    
                    model._transactionArtifact.param.change = model._transactionArtifact.param.change; // || {};  
                    
                    for (let i = changedProps.length; i--;) {
                        let p = changedProps[i];
                        
                        model._transactionArtifact.param.change[p] = model._transactionArtifact.param.change[p] || {
                            value: undefined,
                            previous: attr.change[p].previous
                        };
                        
                        model._transactionArtifact.param.change[p].value = attr.change[p].value;
                    }  
                //}

                break;
            case STATE.SILENT:

                break;
        }
    }

    public static filter<S>(events: IEvents, 
                            callback: ISignalCallback<IEventParam<S>>): ISignalCallback<IEventParam<S>> {

        let fn = <ISignalCallback<IEventParam<S>>>((param: IEventParam<S>) => {
            let n: string,
                flag = false,
                names: Array<string>,
                p = <IEventParam<S>>{
                    model: param.model
                };
            
            let eventsNames = EVENT_NAMES;
            
            for (let i = eventsNames.length; i--;) {
                let eventName = eventsNames[i],
                    eventData = param[eventName]; 
                    
                // TODO: uncomment when adding more events    
                // if (!eventData) {
                //     continue;
                // }
                    
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
            change: (param: ISignalListenerParam<Schema>): void => {
                this.signal.add(
                    Model.filter<Schema>({
                            change: param.events || true
                        }, param.callback), 
                    param.receiver);         
            }
        };
        this.once = {
            change: (param: ISignalListenerParam<Schema>): void => {
                this.signal.addOnce(
                    Model.filter<Schema>({
                            change: param.events || true
                        }, param.callback), 
                    param.receiver);         
            }
        };
        this.off = {
            change: (callbackOrReceiver?: TSignalCallback<Schema> | IReceiver,
                        receiver?: IReceiver): void => {
                this.signal.remove(<TSignalCallback<Schema>>callbackOrReceiver, receiver);
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
        this._state = STATE.NORMAL;
    }
}
