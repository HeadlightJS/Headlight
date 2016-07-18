import {IHash} from '../base/base.d';
import {Base} from '../base/Base';
import {ISignal, ISignalCallback} from '../signal/signal.d';
import {IReceiver} from '../receiver/receiver.d';

export interface IModel<Schema> extends IReceiver {
    idAttribute: string;
        
    on: ISignalListeners<Schema>;
    once: ISignalListeners<Schema>;
    off: ISignalListenerStoppers<Schema>;

    PROPS: Schema;
    signal: ISignal<IEventParam<Schema>>;

    toJSON(): Schema;
    toJSON<T>(): T;
    keys(): Array<string>;
    performTransaction(callback: (model: IModel<Schema>) => void): void;
    performSilentTransaction(callback: (model: IModel<Schema>) => void): void;
}

export type TModelOrSchema<Schema> = IModel<Schema> | Schema;

export type TSignal<S> = ISignal<IEventParam<S>>;

export type TSignalCallback<S> = ISignalCallback<IEventParam<S>>;

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
    change(receiver: IReceiver): void;
    change(callback: TSignalCallback<Schema>, receiver: IReceiver): void;
}

export interface ISignalListenerParam<Schema> {
    callback: TSignalCallback<Schema>;
    receiver?: IReceiver;
    events?: IHash<boolean>;
}

export interface ISignalHash<Schema> {
    change: TSignal<Schema>;
}

export interface IEvents {
    change?: boolean | IHash<boolean>;
}

export interface IEventParam<Schema> {
    model: IModel<Schema>;
    change?: TParamValues;
}

interface ITransactionArtifact<Schema> {
    param: IEventParam<Schema>;
}

export interface IDProperty {
    (): PropertyDecorator;
    (Constructor: Function): PropertyDecorator;
    (fn: () => Function): PropertyDecorator;
}

export interface IDComputedProperty {
    (deps: Array<string>): PropertyDecorator;
    (fn: () => Array<string>): PropertyDecorator;
}
