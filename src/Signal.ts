/////<reference path="Base.ts"/>
/////<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ISignalCallback extends Function {
        once?: boolean;
    }

    export interface ISignal extends IBase {
        add(callback: ISignalCallback, receiver?: IReceiver): void;
        addOnce(callback: ISignalCallback, receiver?: IReceiver): void;
        remove(): void;
        remove(receiver: IReceiver): void;
        remove(callback: ISignalCallback): void;
        remove(callback: ISignalCallback, receiver: IReceiver): void;
        dispatch(): void;
        enable(): void;
        disable(): void;
        getReceivers(): Array<IReceiver>;
    }

    interface IEventGroup extends IBase {
        callback: ISignalCallback;
        receiver?: IReceiver;
        once?: boolean;
    }

    interface IEventStorage {
        common: Array<IEventGroup>;
        [key: string]: Array<IEventGroup>;
    }

    /**
     * Signal is special class for creating events in your app.
     */
    export class Signal extends Base implements ISignal {
        private eventStorage: IEventStorage;
        private isEnabled: boolean = true;

        constructor() {
            super();

            this.resetEventStorage();
        }

        public add(callback: ISignalCallback, receiver?: IReceiver, once?: boolean): string {
            let eventGroup = Signal.createEventGroup(callback, receiver, once);

            this.getEventGroups(receiver).push(eventGroup);

            if (receiver) {
                receiver.addSignal(this);
            }

            return eventGroup.cid;
        }

        public addOnce(callback: ISignalCallback, receiver?: IReceiver): string {
            return this.add(callback, receiver, true);
        }

        public remove(callbackOrReceiver?: ISignalCallback | IReceiver, receiver?: IReceiver): void {
            if (callbackOrReceiver === undefined && receiver === undefined) {
                this.resetEventStorage();
            } else if (callbackOrReceiver && receiver === undefined) {
                if (typeof callbackOrReceiver === 'function') {
                    let cids = Object.keys(this.eventStorage);

                    for (let i = cids.length; i--; ) {
                        let groups = this.getEventGroups(cids[i]),
                            r: IReceiver;

                        if (groups.length) {
                            r = groups[0].receiver;
                        }

                        if (Signal.removeCallbackFromEventGroups(groups, <ISignalCallback>callbackOrReceiver) && r) {
                            r.removeSignal(this);
                        }
                    }
                } else {
                    let r = <IReceiver>callbackOrReceiver;

                    delete this.eventStorage[r.cid];

                    r.removeSignal(this);
                }
            } else {
                if (Signal.removeCallbackFromEventGroups(
                        this.getEventGroups(receiver.cid),
                        <ISignalCallback>callbackOrReceiver)) {

                    receiver.removeSignal(this);
                }
            }
        }

        public dispatch(): void {
            if (this.isEnabled) {
                let cids = Object.keys(this.eventStorage);

                for (let i = cids.length; i--; ) {
                    let eventGroups = this.getEventGroups(cids[i]);

                    for (let j = eventGroups.length; j--; ) {
                        eventGroups[j].callback.call(eventGroups[j].receiver || this);

                        if (eventGroups[j].once) {
                            this.remove(eventGroups[j].callback, eventGroups[j].receiver);
                        }
                    }
                }
            } // TODO: Throw an error?
        }

        public enable(): void {
            this.isEnabled = true;
        }

        public disable(): void {
            this.isEnabled = false;
        }

        public getReceivers(): Array<IReceiver> {
            let receivers: Array<IReceiver> = [];
            let cids = Object.keys(this.eventStorage);

            for (let i = cids.length; i--; ) {
                let eventGroups = this.getEventGroups(cids[i]);

                if (eventGroups[0] && eventGroups[0].receiver) {
                    receivers.push(eventGroups[0].receiver);
                }
            }

            return receivers;
        }

        protected cidPrefix(): string {
            return 's';
        }

        private resetEventStorage(): ISignal {
            if (this.eventStorage) {
                let cids = Object.keys(this.eventStorage);

                for (let i = cids.length; i--; ) {
                    let eventGroups = this.getEventGroups(cids[i]);

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

        private getEventGroups(receiverOrCid?: IReceiver | string): Array<IEventGroup> {
            let cid = 'common';

            if (receiverOrCid !== undefined) {
                if (typeof receiverOrCid === 'string') {
                    cid = receiverOrCid;
                } else {
                    cid = receiverOrCid.cid;
                }
            }

            if (!this.eventStorage[cid]) {
                this.eventStorage[cid] = [];
            }

            return this.eventStorage[cid];
        }

        private static createEventGroup(callback: ISignalCallback,
                                        receiver?: IReceiver,
                                        once?: boolean): IEventGroup {
            let res: IEventGroup = {
                cid: Base.generateCid('e'),
                callback: callback,
                once: once
            };

            if (receiver) {
                res.receiver = receiver;
            }

            return res;
        }

        private static removeCallbackFromEventGroups(eventGroups: Array<IEventGroup>,
                                                     callback: ISignalCallback): boolean {
            let removedCount = 0;
            let length = eventGroups.length;

            for (let i = length; i--; ) {
                if (eventGroups[i].callback === callback) {
                    eventGroups.splice(i);

                    removedCount++;
                }
            }

            return removedCount === length;
        }
    }
}
