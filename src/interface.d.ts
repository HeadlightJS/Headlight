declare module Headlight {
    export interface IHash {
        [key: string]: string;
    }

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

    export interface IChangeModelParam<Schema> {
        model: IModel<Schema>;
    }

    export interface IChangeModelFieldParam<Schema> extends IChangeModelParam<Schema> {
        value: any;
        previous: any;
    }

    export interface IEventsHash<Schema> {
        [key: string]: (callback: ISignalCallback<IChangeModelParam<Schema> | IChangeModelFieldParam<Schema>>) => void;
    }

    export interface IModelSignalsListener<Schema> {
        change(callback: ISignalCallback<IChangeModelParam<Schema>>, receiver?: IReceiver): void;
        [key: string]: (callback: ISignalCallback<IChangeModelParam<Schema>>, receiver?: IReceiver) => void;
    }

    export interface IModel<Schema> extends IReceiver {
        on: IModelSignalsListener<Schema>;
        once: IModelSignalsListener<Schema>;
        PROPS: Schema;
        //signals: ISignalShemaHash<Schema>;

        toJSON(): Schema;
    }

    /*export interface ITransactionOptions<S> {
     model: IModel;
     fn: (model: IModel) => any;
     }

     export interface ITransaction<S> extends IBase {
     previous: S;
     current: S;
     diff: S;

     perform(): S;
     }*/
}
