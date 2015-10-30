/////<reference path="Base.ts"/>
/////<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    interface ISignalCache {
        [signalCid: string]: ISignal;
    }

    export interface IReceiver extends IBase {
        receive(signal: ISignal, callback: ISignalCallback): IReceiver;
        receiveOnce(signal: ISignal, callback: ISignalCallback): IReceiver;

        stopReceiving(): IReceiver;
        stopReceiving(signal: ISignal): IReceiver;
        stopReceiving(callback: ISignalCallback): IReceiver;
        stopReceiving(signal: ISignal, callback: ISignalCallback): IReceiver;

        addSignal(signal: ISignal): IReceiver;
        removeSignal(signal: ISignal): IReceiver;

        getSignals(): Array<ISignal>;
    }

    export class Receiver extends Base implements IReceiver {
        private signals: ISignalCache = {};

        public receive(signal: ISignal, callback: ISignalCallback): IReceiver {
            signal.add(callback, this);

            return this.addSignal(signal);
        }

        public receiveOnce(signal: ISignal, callback: ISignalCallback): IReceiver {
            signal.addOnce(callback, this);

            return this.addSignal(signal);
        }

        public stopReceiving(signalOrCallback?: ISignal | ISignalCallback, callback?: ISignalCallback): IReceiver {
            if (signalOrCallback === undefined && callback === undefined) {
                this.resetSignals();
            } else if (callback === undefined) {
                if (typeof signalOrCallback === 'function') {
                    let cids = Object.keys(this.signals),
                        c = <ISignalCallback>signalOrCallback;

                    for (let i = cids.length; i--; ) {
                        this.signals[cids[i]].remove(c, this);
                    }
                } else {
                    let s = <ISignal>signalOrCallback;

                    s.remove(this);
                }
            } else {
                let s = <ISignal>signalOrCallback;

                s.remove(callback, this);
            }

            return this;
        }

        public addSignal(signal: ISignal): IReceiver {
            this.signals[signal.cid] = signal;

            return this;
        }

        public removeSignal(signal: ISignal): IReceiver {
            if (this.hasSignal(signal)) {
                delete this.signals[signal.cid];

                signal.remove(this);
            }

            return this;
        }

        public hasSignal(signal: ISignal): boolean {
            return signal.cid in this.signals;
        }

        public getSignals(): Array<ISignal> {
            let cids = Object.keys(this.signals),
                res: Array<ISignal> = [];

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
