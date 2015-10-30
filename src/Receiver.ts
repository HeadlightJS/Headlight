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
    }

    export class Receiver extends Base implements IReceiver {
        private signals: ISignalCache;

        public receive(signal: ISignal, callback: ISignalCallback): IReceiver {
            signal.add(callback, this);

            return this.addSignal(signal);
        }

        public receiveOnce(signal: ISignal, callback: ISignalCallback): IReceiver {
            this.signals[signal.cid] = signal;

            return this;
        }

        public stopReceiving(): IReceiver {
            return this;
        }

        protected cidPrefix(): string {
            return 'r';
        }

        private addSignal(signal: ISignal): IReceiver {
            this.signals[signal.cid] = signal;

            return this;
        }

        private remove(signal: ISignal): IReceiver {
            this.signals[signal.cid] = undefined;

            return this;
        }
    }
}
