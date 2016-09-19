import {IBase} from '../base/base.d';
import {ISignal, ISignalCallback} from '../signal/signal.d';
import {IModel} from '../model/model.d';

export interface IReceiver extends IBase {
    listen<S, R>(callback: (fn: IFunc<S>) => R, handler: IHandler<R>): void;

    receive<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void;
    receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void;

    stopReceiving(): void;
    stopReceiving<CallbackParam>(callback: ISignalCallback<CallbackParam>): void;
    stopReceiving<CallbackParam>(signal: ISignal<CallbackParam>): void;
    stopReceiving<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): void;

    addSignal(signal: ISignal<any>): void;
    removeSignal(signal: ISignal<any>): void;
    hasSignal(signal: ISignal<any>): boolean;
    getSignals(): Array<ISignal<any>>;
    resetSignals(): void;
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
