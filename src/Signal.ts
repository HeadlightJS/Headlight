/////<reference path="Base.ts"/>
/////<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

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

    interface IEventGroup<CallbackParam> extends IBase {
        callback: ISignalCallback<CallbackParam>;
        receiver?: IReceiver;
        once?: boolean;
    }

    interface IEventStorage<CallbackParam> {
        common: Array<IEventGroup<CallbackParam>>;
        [key: string]: Array<IEventGroup<CallbackParam>>;
    }

    /**
     * Signal is special class for creating events in your app.
     */
    export class Signal<CallbackParam> extends Base implements ISignal<CallbackParam> {
        private eventStorage: IEventStorage<CallbackParam>;
        private isEnabled: boolean = true;

        constructor() {
            super();

            this.resetEventStorage();
        }

        public add(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver, once?: boolean): string {
            let eventGroup = Signal.createEventGroup<CallbackParam>(callback, receiver, once);

            this.getEventGroups(receiver).push(eventGroup);

            if (receiver) {
                receiver.addSignal(this);
            }

            return eventGroup.cid;
        }

        public addOnce(callback: ISignalCallback<CallbackParam>, receiver?: IReceiver): string {
            return this.add(callback, receiver, true);
        }

        public remove(callbackOrReceiver?: ISignalCallback<CallbackParam> | IReceiver, receiver?: IReceiver): void {
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

                        if (Signal.removeCallbackFromEventGroups<CallbackParam>(groups,
                                <ISignalCallback<CallbackParam>>callbackOrReceiver) && r) {
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
                        <ISignalCallback<CallbackParam>>callbackOrReceiver)) {

                    receiver.removeSignal(this);
                }
            }
        }

        public dispatch(param?: CallbackParam): void {
            if (this.isEnabled) {
                let cids = Object.keys(this.eventStorage);

                for (let i = cids.length; i--; ) {
                    let eventGroups = this.getEventGroups(cids[i]);

                    for (let j = eventGroups.length; j--; ) {
                        eventGroups[j].callback.call(eventGroups[j].receiver || this, param);

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

        private resetEventStorage(): ISignal<CallbackParam> {
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

        private getEventGroups(receiverOrCid?: IReceiver | string): Array<IEventGroup<CallbackParam>> {
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

        private static createEventGroup<CallbackParam>(callback: ISignalCallback<CallbackParam>,
                                        receiver?: IReceiver,
                                        once?: boolean): IEventGroup<CallbackParam> {
            let res: IEventGroup<CallbackParam> = {
                cid: Base.generateCid('e'),
                callback: callback,
                once: once
            };

            if (receiver) {
                res.receiver = receiver;
            }

            return res;
        }

        private static removeCallbackFromEventGroups<CallbackParam>(eventGroups: Array<IEventGroup<CallbackParam>>,
                                                     callback: ISignalCallback<CallbackParam>): boolean {
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
