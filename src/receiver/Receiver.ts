import {BASE_TYPES} from '../base/base_types';
import {Base} from '../base/Base';
import {ISignal, ISignalCallback, ISignalCache} from '../signal/signal.d';
import {IReceiver} from './receiver.d';
import {IModel} from '../model/model.d';

export class Receiver extends Base implements IReceiver {
    private _signals: ISignalCache = {};

    public listen<S, R>(callback: (fn: IFunc<S>) => R, handler: IHandler<R>): void {
        let result = <any>callback(<IFunc<S>>this._getWrapper());

        let forListen = Receiver.parseListenerDeps(result);

        let proxyHandler = () => {
            let data = Receiver.unparseListener(result);
            handler(data);
        };

        forListen.forEach((dep) => {
            let listen = false;
            let modelHandler = () => {
                if (!listen) {
                    dep.model.signals.change.all.addOnce(() => {
                        proxyHandler();
                    });
                    listen = true;
                }
            };
            dep.fields.forEach((key: string) => {
                dep.model.signals.change[key].add(modelHandler);
            });
        });
    }

    public receive<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void {
        signal.add(callback, this);

        this.addSignal(signal);
    }

    public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void {
        signal.addOnce(callback, this);

        this.addSignal(signal);
    }

    public stopReceiving<CallbackParam>(
        signalOrCallback?: ISignal<CallbackParam> | ISignalCallback<CallbackParam>,
        callback?: ISignalCallback<CallbackParam>): void {

        if (signalOrCallback === undefined && callback === undefined) {
            this.resetSignals();
        } else if (callback === undefined) {
            if (typeof signalOrCallback === BASE_TYPES.FUNCTION) {
                let cids = Object.keys(this._signals),
                    c = <ISignalCallback<CallbackParam>>signalOrCallback;

                for (let i = cids.length; i--; ) {
                    this._signals[cids[i]].remove(c, this);
                }
            } else {
                let s = <ISignal<CallbackParam>>signalOrCallback;

                s.remove(this);
            }
        } else {
            let s = <ISignal<CallbackParam>>signalOrCallback;

            s.remove(callback, this);
        }
    }

    public addSignal(signal: ISignal<any>): void {
        this._signals[signal.cid] = signal;
    }

    public removeSignal(signal: ISignal<any>): void {
        if (this.hasSignal(signal)) {
            delete this._signals[signal.cid];

            signal.remove(this);
        }
    }

    public hasSignal(signal: ISignal<any>): boolean {
        return signal.cid in this._signals;
    }

    public getSignals(): Array<ISignal<any>> {
        let cids = Object.keys(this._signals),
            res: Array<ISignal<any>> = [];

        for (let i = cids.length; i--; ) {
            res.push(this._signals[cids[i]]);
        }

        return res;
    }

    public resetSignals(): void {
        let cids = Object.keys(this._signals);

        for (let i = cids.length; i--; ) {
            this._signals[cids[i]].remove(this);
        }

        this._signals = {};
    }

    protected cidPrefix(): string {
        return 'r';
    }

    protected static parseListenerDeps(data: Object): Array<IListenData<any>> {
        let models = {};
        let result = [];

        let find = function (obj: any): void {

            if (typeof obj !== 'object') {
                throw new Error('Bad value');
            }

            if (obj.__fieldData) {
                if (models[obj.__fieldData.model.cid]) {
                    models[obj.__fieldData.model.cid].fields.push(obj.__fieldData.field);
                } else {
                    models[obj.__fieldData.model.cid] = {
                        model: obj.__fieldData.model,
                        fields: [obj.__fieldData.field]
                    };
                }
            } else {
                if (Array.isArray(obj)) {
                    obj.forEach(find);
                } else {
                    Object.keys(obj).forEach((key: string) => {
                        find(obj[key]);
                    });
                }
            }
        };
        find(data);

        Object.keys(models).forEach((cid: string) => {
            result.push({
                model: models[cid].model,
                fields: models[cid].fields
            });
        });

        return result;
    }

    protected static unparseListener(data: any): any {

        let result = {};

        let find = function (parent: Object, key: string|number, localResult: any): void {
            if (parent[key].__fieldData) {
                localResult[key] = parent[key].__fieldData.model[parent[key].__fieldData.field];
            } else {
                if (Array.isArray(parent[key])) {
                    localResult[key] = [];
                    parent[key].forEach((item, i) => {
                        find(parent[key], i, localResult[key]);
                    });
                } else {
                    localResult[key] = {};
                    Object.keys(parent).forEach((childKey: string) => {
                        find(parent[childKey], childKey, localResult[childKey]);
                    });
                }
            }
        };

        if (data.__fieldData) {
            return data.__fieldData.model[data.__fieldData.field];
        } else {
            Object.keys(data).forEach((key: string) => {
                find(data, key, result);
            });
        }

        return result;
    }

    private _getWrapper<T>(): IFunc<T> {
        return (model: IModel<T>): T => {
            let result = <T>{};

            let set = () => {
                throw new Error('Служебный объект, нельзя перезаписывать!');
            };

            model.keys().forEach((key: string) => {
                Object.defineProperty(result, key, {
                    get: () => {
                        return {
                            __fieldData: {
                                model: model,
                                field: key
                            }
                        };
                    },
                    set: set
                });
            });

            return result;
        };
    }
}


export interface IListenData<S> {
    model: IModel<S>;
    fields: Array<string>;
}

export interface IFunc<T> {
    (data: IModel<T>): T;
}

export interface IHandler<T> {
    (data: T): void;
}
