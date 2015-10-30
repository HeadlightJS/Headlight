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
        stopReceiving(signal: ISignal, callback: ISignalCallback): IReceiver;
        stopReceiving(signal: ISignal): IReceiver;
        stopReceiving(callback: ISignalCallback): IReceiver;

        addSignal(signal: ISignal): IReceiver;
        removeSignal(signal: ISignal): IReceiver;
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

        public stopReceiving(): IReceiver {
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

        protected cidPrefix(): string {
            return 'r';
        }

        private remove(signal: ISignal): IReceiver {
            this.signals[signal.cid] = undefined;

            return this;
        }
    }
}
