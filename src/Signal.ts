///<reference path="Base.ts"/>
///<reference path="EventGroup.ts"/>

module Headlight {
    'use strict';

    export interface IEventStorage<CallbackParam> {
        common: Array<EventGroup<CallbackParam>>;
        [key: string]: Array<EventGroup<CallbackParam>>;
    }

    /**
     * Signal is special class for creating events in your app.
     */
    export class Signal<CallbackParam> extends Base  {
        private eventStorage: IEventStorage<CallbackParam>;

        constructor() {
            super();

            this._resetEventStorage();
        }

        public add(callback: Signal.ISignalCallback<CallbackParam>, receiver?: Receiver, once?: boolean): string {
            let eventGroup = Signal.createEventGroup<CallbackParam>(callback, receiver, once);

            this._getEventGroups(receiver).push(eventGroup);

            if (receiver) {
                receiver.addSignal(this);
            }

            return eventGroup.cid;
        }

        public addOnce(callback: Signal.ISignalCallback<CallbackParam>, receiver?: Receiver): string {
            return this.add(callback, receiver, true);
        }

        public remove(callbackOrReceiver?: Signal.ISignalCallback<CallbackParam> | Receiver,
                      receiver?: Receiver): void {

            if (callbackOrReceiver === undefined && receiver === undefined) {
                this._resetEventStorage();
            } else if (callbackOrReceiver && receiver === undefined) {
                if (typeof callbackOrReceiver === BASE_TYPES.FUNCTION) {
                    let cids = Object.keys(this.eventStorage);

                    for (let i = cids.length; i--; ) {
                        let groups = this._getEventGroups(cids[i]),
                            r: Receiver;

                        if (groups.length) {
                            r = groups[0].receiver;
                        }

                        if (Signal.removeCallbackFromEventGroups<CallbackParam>(groups,
                                <Signal.ISignalCallback<CallbackParam>>callbackOrReceiver) && r) {
                            r.removeSignal(this);
                        }
                    }
                } else {
                    let r = <Receiver>callbackOrReceiver;

                    delete this.eventStorage[r.cid];

                    r.removeSignal(this);
                }
            } else {
                if (Signal.removeCallbackFromEventGroups(
                        this._getEventGroups(receiver.cid),
                        <Signal.ISignalCallback<CallbackParam>>callbackOrReceiver)) {

                    receiver.removeSignal(this);
                }
            }
        }

        public dispatch(param?: CallbackParam): void {
            let cids = Object.keys(this.eventStorage);

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

        public getReceivers(): Array<Receiver> {
            let receivers: Array<Receiver> = [];
            let cids = Object.keys(this.eventStorage);

            for (let i = cids.length; i--; ) {
                let eventGroups = this._getEventGroups(cids[i]);

                if (eventGroups[0] && eventGroups[0].receiver) {
                    receivers.push(eventGroups[0].receiver);
                }
            }

            return receivers;
        }

        protected cidPrefix(): string {
            return 's';
        }

        private _resetEventStorage(): Signal<CallbackParam> {
            if (this.eventStorage) {
                let cids = Object.keys(this.eventStorage);

                for (let i = cids.length; i--; ) {
                    let eventGroups = this._getEventGroups(cids[i]);

                    if (eventGroups[0] && eventGroups[0].receiver) {
                        eventGroups[0].receiver.removeSignal(this);
                    }
                }
            }

            this.eventStorage = {
                common: []
            };

            return this;
        }

        private _getEventGroups(receiverOrCid?: Receiver | string): Array<EventGroup<CallbackParam>> {
            let cid = 'common';

            if (receiverOrCid !== undefined) {
                if (typeof receiverOrCid === BASE_TYPES.STRING) {
                    cid = <string>receiverOrCid;
                } else {
                    cid = (<Receiver>receiverOrCid).cid;
                }
            }

            if (!this.eventStorage[cid]) {
                this.eventStorage[cid] = [];
            }

            return this.eventStorage[cid];
        }

        private static createEventGroup<CallbackParam>(callback: Signal.ISignalCallback<CallbackParam>,
                                        receiver?: Receiver,
                                        once?: boolean): EventGroup<CallbackParam> {
            let res: EventGroup<CallbackParam> = new EventGroup(callback, once);

            if (receiver) {
                res.receiver = receiver;
            }

            return res;
        }

        private static removeCallbackFromEventGroups<CallbackParam>(eventGroups: Array<EventGroup<CallbackParam>>,
                                                     callback: Signal.ISignalCallback<CallbackParam>): boolean {
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

    export module Signal {
        export interface ISignalCallback<CallbackParam> extends Function {
            (param?: CallbackParam): void;
            once?: boolean;
            originalCallback?: ISignalCallback<CallbackParam>;
        }

        export interface ISignalCache {
            [signalCid: string]: Signal<any>;
        }
    }
}
