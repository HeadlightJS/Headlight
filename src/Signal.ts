/////<reference path="Base.ts"/>
/////<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ISignalCallback extends Function {
        once?: boolean;
    }

    export interface ISignal extends IBase {
        add(callback: ISignalCallback, receiver?: IReceiver): void;
        addOnce(callback: ISignalCallback): void;
        remove(): void;
        remove(receiver: IReceiver): void;
        remove(callback: ISignalCallback): void;
        remove(callback: ISignalCallback, receiver: IReceiver): void;
        dispatch(): void;
        enable(): void;
        disable(): void;
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

            this.resetEventGrops();
        }

        public add(callback: ISignalCallback, receiver?: IReceiver, once?: boolean): string {
            let eventGroup = Signal.createEventGroup(callback, receiver, once);

            this.getEventGroups(receiver).push(eventGroup);

            return eventGroup.cid;
        }

        public addOnce(callback: ISignalCallback, receiver?: IReceiver): string {
            return this.add(callback, receiver, true);
        }

        public remove(callbackOrReceiver?: ISignalCallback | IReceiver, receiver?: IReceiver): void {
            if (callbackOrReceiver === undefined && receiver === undefined) {
                this.resetEventGrops();
            } else if (callbackOrReceiver && receiver === undefined) {
                if (typeof callbackOrReceiver === 'function') {
                    let cids = Object.keys(this.eventStorage);

                    for (let i = cids.length; i--; ) {
                        Signal.removeCallbackFromEventGroups(this.getEventGroups(cids[i]),
                            <ISignalCallback>callbackOrReceiver);
                    }
                } else {
                    let r = <IReceiver>callbackOrReceiver;

                    delete this.eventStorage[r.cid];
                }
            } else {
                Signal.removeCallbackFromEventGroups(
                    this.getEventGroups(receiver.cid),
                    <ISignalCallback>callbackOrReceiver);
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
                            eventGroups.splice(j);
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

        private resetEventGrops(): ISignal {
            this.eventStorage = {
                common: []
            };

            return this;
        }

        protected cidPrefix(): string {
            return 's';
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

        private static removeCallbackFromEventGroups(eventGroups: Array<IEventGroup>, callback: ISignalCallback): void {
            for (let i = eventGroups.length; i--; ) {
                if (eventGroups[i].callback === callback) {
                    eventGroups.splice(i);
                }
            }
        }
    }
}
