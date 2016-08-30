import {Base} from '../base/Base';
import {IEventGroup} from './eventGroup.d';
import {ISignalCallback} from '../signal/signal.d';
import {IReceiver} from '../receiver/receiver.d';

export class EventGroup<CallbackParam> extends Base implements IEventGroup<CallbackParam> {

    public callback: ISignalCallback<CallbackParam>;
    public receiver: IReceiver;
    public once: boolean;

    protected get cidPrefix(): string {
        return 'e';
    }


    constructor(callback: ISignalCallback<CallbackParam>, once?: boolean) {
        super();

        this.callback = callback;
        this.once = once || false;
    }
}
