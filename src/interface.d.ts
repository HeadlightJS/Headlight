declare module Headlight {
    export interface ISignalCallback<CallbackParam> extends Function {
        (param?: CallbackParam): void;
        once?: boolean;
    }

    export interface ISignal<CallbackParam> extends IBase {
        add(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver): void;
        addOnce(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver): void;
        remove(): void;
        remove(receiver: IReceiver): void;
        remove(callback: ISignalCallback<CallbackParam>): void;
        remove(callback: ISignalCallback<CallbackParam>, receiver: IReceiver): void;
        dispatch(param?: CallbackParam): void;
        enable(): void;
        disable(): void;
        getReceivers(): Array<IReceiver>;
    }

    export interface ISignalCache {
        [signalCid: string]: ISignal<any>;
    }

    export interface IEventGroup<CallbackParam> extends IBase {
        callback: ISignalCallback<CallbackParam>;
        receiver?: IReceiver;
        once?: boolean;
    }

    export interface IEventStorage<CallbackParam> {
        common: Array<IEventGroup<CallbackParam>>;
        [key: string]: Array<IEventGroup<CallbackParam>>;
    }

    export interface IReceiver extends IBase {
        receive<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): IReceiver;
        receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>, callback: ISignalCallback<CallbackParam>): IReceiver;

        stopReceiving(): IReceiver;
        stopReceiving(signal: ISignal<any>): IReceiver;
        stopReceiving(callback: ISignalCallback<any>): IReceiver;
        stopReceiving<CallbackParam>(signal: ISignal<CallbackParam>,
                                     callback: ISignalCallback<CallbackParam>): IReceiver;

        addSignal(signal: ISignal<any>): IReceiver;
        removeSignal(signal: ISignal<any>): IReceiver;

        getSignals(): Array<ISignal<any>>;
    }
}
