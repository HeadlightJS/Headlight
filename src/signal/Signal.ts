import {BASE_TYPES} from '../base/base_types';
import {Base} from '../base/Base';
import {ISignal, ISignalCallback, IEventStorage, TEventGroups} from './signal.d';
import {IReceiver} from '../receiver/receiver.d';
import {EventGroup} from '../eventGroup/EventGroup';

const GENERAL_STORAGE_ID = 'common';

export class Signal<CallbackParam> extends Base implements ISignal<CallbackParam> {

    protected get cidPrefix(): string {
        return 's';
    }

    private _eventStorage: IEventStorage<CallbackParam>;

    constructor() {
        super();

        this._resetEventStorage();
    }

    public add(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver, once?: boolean): string {
        let eventGroup = Signal.createEventGroup<CallbackParam>(callback, receiver, once);

        this._getEventGroups(receiver).push(eventGroup);

        if (receiver) {
            receiver.addSignal(this);
        }

        return eventGroup.cid;
    }

    public addOnce(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver): string {
        return this.add(callback, receiver, true);
    }

    public remove(callbackOrReceiver?: ISignalCallback<CallbackParam> | IReceiver,
                    receiver?: IReceiver): void {

        if (callbackOrReceiver === undefined && receiver === undefined) {
            this._resetEventStorage();
        } else if (callbackOrReceiver && receiver === undefined) {
            if (typeof callbackOrReceiver === BASE_TYPES.FUNCTION) {
                let cids = Object.keys(this._eventStorage);

                for (let i = cids.length; i--; ) {
                    let groups = this._getEventGroups(cids[i]),
                        r: IReceiver;

                    if (groups.length) {
                        r = groups[0].receiver;
                    }

                    if (Signal.removeCallbackFromEventGroups<CallbackParam>(groups,
                            <ISignalCallback<CallbackParam>>callbackOrReceiver) && r) {
                        r.removeSignal(this);
                    }
                }
            } else {
                let r = <IReceiver>callbackOrReceiver;

                delete this._eventStorage[r.cid];

                r.removeSignal(this);
            }
        } else {
            if (Signal.removeCallbackFromEventGroups(
                    this._getEventGroups(receiver.cid),
                    <ISignalCallback<CallbackParam>>callbackOrReceiver)) {

                receiver.removeSignal(this);
            }
        }
    }

    public dispatch(param?: CallbackParam): void {
        let cids = Object.keys(this._eventStorage);

        for (let i = cids.length; i--;) {
            let eventGroups = this._getEventGroups(cids[i]);

            for (let j = eventGroups.length; j--;) {
                eventGroups[j].callback.call(eventGroups[j].receiver || this, param);

                if (eventGroups[j].once) {
                    this.remove(eventGroups[j].callback, eventGroups[j].receiver);
                }
            }
        }
    }

    public getReceivers(): Array<IReceiver> {
        let receivers: Array<IReceiver> = [];
        let cids = Object.keys(this._eventStorage);

        for (let i = cids.length; i--; ) {
            let eventGroups = this._getEventGroups(cids[i]);

            if (eventGroups[0] && eventGroups[0].receiver) {
                receivers.push(eventGroups[0].receiver);
            }
        }

        return receivers;
    }

    private _resetEventStorage(): Signal<CallbackParam> {
        if (this._eventStorage) {
            let cids = Object.keys(this._eventStorage);

            for (let i = cids.length; i--; ) {
                let eventGroups = this._getEventGroups(cids[i]);

                if (eventGroups[0] && eventGroups[0].receiver) {
                    eventGroups[0].receiver.removeSignal(this);
                }
            }
        }

        this._eventStorage = {
            common: []
        };

        return this;
    }

    private _getEventGroups(receiverOrCid?: IReceiver | string): TEventGroups<CallbackParam> {
        let cid = GENERAL_STORAGE_ID;

        if (receiverOrCid !== undefined) {
            if (typeof receiverOrCid === BASE_TYPES.STRING) {
                cid = <string>receiverOrCid;
            } else {
                cid = (<IReceiver>receiverOrCid).cid;
            }
        }

        this._eventStorage[cid] = this._eventStorage[cid] || [];

        return this._eventStorage[cid];
    }

    private static createEventGroup<CallbackParam>(callback: ISignalCallback<CallbackParam>,
                                    receiver?: IReceiver,
                                    once?: boolean): EventGroup<CallbackParam> {
        let res: EventGroup<CallbackParam> = new EventGroup(callback, once);

        if (receiver) {
            res.receiver = receiver;
        }

        return res;
    }

    private static removeCallbackFromEventGroups<CallbackParam>(eventGroups: TEventGroups<CallbackParam>,
                                                    callback: ISignalCallback<CallbackParam>): boolean {
        let removedCount = 0;
        let length = eventGroups.length;

        for (let i = length; i--; ) {
            let c = eventGroups[i].callback;

            if (c === callback || c.originalCallback === callback) {
                eventGroups.splice(i, 1);

                removedCount++;
            }
        }

        return removedCount === length;
    }
}
