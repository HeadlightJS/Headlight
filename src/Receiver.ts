///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export class Receiver extends Base {
        private _signals: Signal.ISignalCache = {};

        public receive<CallbackParam>(signal: Signal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): void {
            signal.add(callback, this);

            this.addSignal(signal);
        }

        public receiveOnce<CallbackParam>(signal: Signal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): void {
            signal.addOnce(callback, this);

            this.addSignal(signal);
        }

        public stopReceiving<CallbackParam>(
            signalOrCallback?: Signal<CallbackParam> | Signal.ISignalCallback<CallbackParam>,
            callback?: Signal.ISignalCallback<CallbackParam>): void {
            
            if (signalOrCallback === undefined && callback === undefined) {
                this.resetSignals();
            } else if (callback === undefined) {
                if (typeof signalOrCallback === BASE_TYPES.FUNCTION) {
                    let cids = Object.keys(this._signals),
                        c = <Signal.ISignalCallback<CallbackParam>>signalOrCallback;

                    for (let i = cids.length; i--; ) {
                        this._signals[cids[i]].remove(c, this);
                    }
                } else {
                    let s = <Signal<CallbackParam>>signalOrCallback;

                    s.remove(this);
                }
            } else {
                let s = <Signal<CallbackParam>>signalOrCallback;

                s.remove(callback, this);
            }
        }

        public addSignal(signal: Signal<any>): void {
            this._signals[signal.cid] = signal;
        }

        public removeSignal(signal: Signal<any>): void {
            if (this.hasSignal(signal)) {
                delete this._signals[signal.cid];

                signal.remove(this);
            }
        }

        public hasSignal(signal: Signal<any>): boolean {
            return signal.cid in this._signals;
        }

        public getSignals(): Array<Signal<any>> {
            let cids = Object.keys(this._signals),
                res: Array<Signal<any>> = [];

            for (let i = cids.length; i--; ) {
                res.push(this._signals[cids[i]]);
            }

            return res;
        }

        public resetSignals(): void {
            let cids = Object.keys(this._signals);

            for (let i = cids.length; i--; ) {
                this._signals[cids[i]].remove(this);
            }

            this._signals = {};
        }

        protected cidPrefix(): string {
            return 'r';
        }
    }
}
