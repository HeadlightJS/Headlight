import {IBase} from '../base/base.d';
import {IReceiver} from '../receiver/receiver.d';
import {IEventGroup} from '../eventGroup/eventGroup.d';

export interface ISignal<CallbackParam> extends IBase {
    add(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver, once?: boolean): string;
    addOnce(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver): string;

    remove(): void;
    remove(receiver?: IReceiver): void;
    remove(callback?: ISignalCallback<CallbackParam>, receiver?: IReceiver): void;

    dispatch(param?: CallbackParam): void;
    getReceivers(): Array<IReceiver>;
} 

export interface ISignalCallback<CallbackParam> extends Function {
    (param?: CallbackParam): void;
    once?: boolean;
    originalCallback?: ISignalCallback<CallbackParam>;
}

export interface ISignalCache {
    [signalCid: string]: ISignal<any>;
}

export type TEventGroups<CallbackParam> = Array<IEventGroup<CallbackParam>>; 

export interface IEventStorage<CallbackParam> {
    common: TEventGroups<CallbackParam>;
    [key: string]: TEventGroups<CallbackParam>;
}
