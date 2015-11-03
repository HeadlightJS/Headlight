///<reference path="Base.ts"/>
///<reference path="interface.d.ts"/>

module Headlight {
    'use strict';

    export class Receiver extends Base implements IReceiver {
        private signals: ISignalCache = {};

        public receive<CallbackParam>(signal: ISignal<CallbackParam>,
                                      callback: ISignalCallback<CallbackParam>): IReceiver {
            signal.add(callback, this);

            return this.addSignal(signal);
        }

        public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                          callback: ISignalCallback<CallbackParam>): IReceiver {
            signal.addOnce(callback, this);

            return this.addSignal(signal);
        }

        public stopReceiving<CallbackParam>(signalOrCallback?: ISignal<CallbackParam> | ISignalCallback<CallbackParam>,
                             callback?: ISignalCallback<CallbackParam>): IReceiver {
            if (signalOrCallback === undefined && callback === undefined) {
                this.resetSignals();
            } else if (callback === undefined) {
                if (typeof signalOrCallback === BASE_TYPES.FUNCTION) {
                    let cids = Object.keys(this.signals),
                        c = <ISignalCallback<CallbackParam>>signalOrCallback;

                    for (let i = cids.length; i--; ) {
                        this.signals[cids[i]].remove(c, this);
                    }
                } else {
                    let s = <ISignal<CallbackParam>>signalOrCallback;

                    s.remove(this);
                }
            } else {
                let s = <ISignal<CallbackParam>>signalOrCallback;

                s.remove(callback, this);
            }

            return this;
        }

        public addSignal(signal: ISignal<any>): IReceiver {
            this.signals[signal.cid] = signal;

            return this;
        }

        public removeSignal(signal: ISignal<any>): IReceiver {
            if (this.hasSignal(signal)) {
                delete this.signals[signal.cid];

                signal.remove(this);
            }

            return this;
        }

        public hasSignal(signal: ISignal<any>): boolean {
            return signal.cid in this.signals;
        }

        public getSignals(): Array<ISignal<any>> {
            let cids = Object.keys(this.signals),
                res: Array<ISignal<any>> = [];

            for (let i = cids.length; i--; ) {
                res.push(this.signals[cids[i]]);
            }

            return res;
        }

        protected cidPrefix(): string {
            return 'r';
        }

        private resetSignals(): IReceiver {
            let cids = Object.keys(this.signals);

            for (let i = cids.length; i--; ) {
                this.signals[cids[i]].remove(this);
            }

            this.signals = {};

            return this;
        }
    }
}
