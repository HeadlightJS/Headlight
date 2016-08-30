import {IBase} from '../base/base.d';
import {ISignal, ISignalCallback} from '../signal/signal.d';

export interface IReceiver extends IBase {
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
