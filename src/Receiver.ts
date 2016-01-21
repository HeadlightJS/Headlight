///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export interface IReceiver extends IBase {
        receive<CallbackParam>(signal: ISignal<CallbackParam>,
                               callback: Signal.ISignalCallback<CallbackParam>): void;
        receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                   callback: Signal.ISignalCallback<CallbackParam>): void;

        stopReceiving(): void;
        stopReceiving(signal: ISignal<any>): void;
        stopReceiving(callback: Signal.ISignalCallback<any>): void;
        stopReceiving<CallbackParam>(signal: ISignal<CallbackParam>,
                                     callback: Signal.ISignalCallback<CallbackParam>): void;

        addSignal(signal: ISignal<any>): void;
        removeSignal(signal: ISignal<any>): void;

        getSignals(): Array<ISignal<any>>;
    }

    export class Receiver extends Base implements IReceiver {
        private _signals: Signal.ISignalCache = {};

        public receive<CallbackParam>(signal: ISignal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): void {
            signal.add(callback, this);

            this.addSignal(signal);
        }

        public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): void {
            signal.addOnce(callback, this);

            this.addSignal(signal);
        }

        public stopReceiving<CallbackParam>(
            signalOrCallback?: ISignal<CallbackParam> | Signal.ISignalCallback<CallbackParam>,
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
                    let s = <ISignal<CallbackParam>>signalOrCallback;

                    s.remove(this);
                }
            } else {
                let s = <ISignal<CallbackParam>>signalOrCallback;

                s.remove(callback, this);
            }
        }

        public addSignal(signal: ISignal<any>): void {
            this._signals[signal.cid] = signal;
        }

        public removeSignal(signal: ISignal<any>): void {
            if (this.hasSignal(signal)) {
                delete this._signals[signal.cid];

                signal.remove(this);
            }
        }

        public hasSignal(signal: ISignal<any>): boolean {
            return signal.cid in this._signals;
        }

        public getSignals(): Array<ISignal<any>> {
            let cids = Object.keys(this._signals),
                res: Array<ISignal<any>> = [];

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
