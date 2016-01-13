///<reference path="Base.ts"/>
///<reference path="EventGroup.ts"/>

module Headlight {
    'use strict';

    export interface IEventStorage<CallbackParam> {
        common: Array<IEventGroup<CallbackParam>>;
        [key: string]: Array<IEventGroup<CallbackParam>>;
    }

    export interface ISignal<CallbackParam> extends IBase {
        add(callback: Signal.ISignalCallback<CallbackParam>, receiver?: IReceiver): void;
        addOnce(callback: Signal.ISignalCallback<CallbackParam>, receiver?: IReceiver): void;
        remove(): void;
        remove(receiver: IReceiver): void;
        remove(callback: Signal.ISignalCallback<CallbackParam>): void;
        remove(callback: Signal.ISignalCallback<CallbackParam>, receiver: IReceiver): void;
        dispatch(param?: CallbackParam): void;
        getReceivers(): Array<IReceiver>;
    }

    /**
     * Signal is special class for creating events in your app.
     */
    export class Signal<CallbackParam> extends Base implements ISignal<CallbackParam> {
        private eventStorage: IEventStorage<CallbackParam>;

        constructor() {
            super();

            this.resetEventStorage();
        }

        public add(callback: Signal.ISignalCallback<CallbackParam>, receiver?: IReceiver, once?: boolean): string {
            let eventGroup = Signal.createEventGroup<CallbackParam>(callback, receiver, once);

            this.getEventGroups(receiver).push(eventGroup);

            if (receiver) {
                receiver.addSignal(this);
            }

            return eventGroup.cid;
        }

        public addOnce(callback: Signal.ISignalCallback<CallbackParam>, receiver?: IReceiver): string {
            return this.add(callback, receiver, true);
        }

        public remove(callbackOrReceiver?: Signal.ISignalCallback<CallbackParam> | IReceiver,
                      receiver?: IReceiver): void {

            if (callbackOrReceiver === undefined && receiver === undefined) {
                this.resetEventStorage();
            } else if (callbackOrReceiver && receiver === undefined) {
                if (typeof callbackOrReceiver === BASE_TYPES.FUNCTION) {
                    let cids = Object.keys(this.eventStorage);

                    for (let i = cids.length; i--; ) {
                        let groups = this.getEventGroups(cids[i]),
                            r: IReceiver;

                        if (groups.length) {
                            r = groups[0].receiver;
                        }

                        if (Signal.removeCallbackFromEventGroups<CallbackParam>(groups,
                                <Signal.ISignalCallback<CallbackParam>>callbackOrReceiver) && r) {
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
                        <Signal.ISignalCallback<CallbackParam>>callbackOrReceiver)) {

                    receiver.removeSignal(this);
                }
            }
        }

        public dispatch(param?: CallbackParam): void {
            let cids = Object.keys(this.eventStorage);

            for (let i = cids.length; i--;) {
                let eventGroups = this.getEventGroups(cids[i]);

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
                if (typeof receiverOrCid === BASE_TYPES.STRING) {
                    cid = <string>receiverOrCid;
                } else {
                    cid = (<IReceiver>receiverOrCid).cid;
                }
            }

            if (!this.eventStorage[cid]) {
                this.eventStorage[cid] = [];
            }

            return this.eventStorage[cid];
        }

        private static createEventGroup<CallbackParam>(callback: Signal.ISignalCallback<CallbackParam>,
                                        receiver?: IReceiver,
                                        once?: boolean): IEventGroup<CallbackParam> {
            let res: IEventGroup<CallbackParam> = new EventGroup(callback, once);

            if (receiver) {
                res.receiver = receiver;
            }

            return res;
        }

        private static removeCallbackFromEventGroups<CallbackParam>(eventGroups: Array<IEventGroup<CallbackParam>>,
                                                     callback: Signal.ISignalCallback<CallbackParam>): boolean {
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

    export module Signal {
        export interface ISignalCallback<CallbackParam> extends Function {
            (param?: CallbackParam): void;
            once?: boolean;
        }

        export interface ISignalCache {
            [signalCid: string]: ISignal<any>;
        }
    }
}
