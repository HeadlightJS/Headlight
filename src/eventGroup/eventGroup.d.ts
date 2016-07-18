import {IBase} from '../base/base.d';
import {ISignalCallback} from '../signal/signal.d';
import {IReceiver} from '../receiver/receiver.d';

export interface IEventGroup<CallbackParam> extends IBase {
    callback: ISignalCallback<CallbackParam>;
    receiver: IReceiver;
    once: boolean;
}
