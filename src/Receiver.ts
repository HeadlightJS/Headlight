///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export interface IReceiver extends IBase {
        receive<CallbackParam>(signal: ISignal<CallbackParam>,
                               callback: Signal.ISignalCallback<CallbackParam>): IReceiver;
        receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                   callback: Signal.ISignalCallback<CallbackParam>): IReceiver;

        stopReceiving(): IReceiver;
        stopReceiving(signal: ISignal<any>): IReceiver;
        stopReceiving(callback: Signal.ISignalCallback<any>): IReceiver;
        stopReceiving<CallbackParam>(signal: ISignal<CallbackParam>,
                                     callback: Signal.ISignalCallback<CallbackParam>): IReceiver;

        addSignal(signal: ISignal<any>): IReceiver;
        removeSignal(signal: ISignal<any>): IReceiver;

        getSignals(): Array<ISignal<any>>;
    }

    export class Receiver extends Base implements IReceiver {
        private _signals: Signal.ISignalCache = {};

        public receive<CallbackParam>(signal: ISignal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): IReceiver {
            signal.add(callback, this);

            return this.addSignal(signal);
        }

        public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): IReceiver {
            signal.addOnce(callback, this);

            return this.addSignal(signal);
        }

        public stopReceiving<CallbackParam>(
            signalOrCallback?: ISignal<CallbackParam> | Signal.ISignalCallback<CallbackParam>,
            callback?: Signal.ISignalCallback<CallbackParam>): IReceiver {
            
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

            return this;
        }

        public addSignal(signal: ISignal<any>): IReceiver {
            this._signals[signal.cid] = signal;

            return this;
        }

        public removeSignal(signal: ISignal<any>): IReceiver {
            if (this.hasSignal(signal)) {
                delete this._signals[signal.cid];

                signal.remove(this);
            }

            return this;
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

        protected cidPrefix(): string {
            return 'r';
        }

        private resetSignals(): IReceiver {
            let cids = Object.keys(this._signals);

            for (let i = cids.length; i--; ) {
                this._signals[cids[i]].remove(this);
            }

            this._signals = {};

            return this;
        }
    }
}
