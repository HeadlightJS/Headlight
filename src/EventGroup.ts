///<reference path="Signal.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface IEventGroup<CallbackParam> extends IBase {
        callback: Signal.ISignalCallback<CallbackParam>;
        receiver?: IReceiver;
        once?: boolean;
    }

    export class EventGroup<CallbackParam> extends Base implements IEventGroup<CallbackParam> {
        public callback: Signal.ISignalCallback<CallbackParam>;
        public receiver: IReceiver;
        public once: boolean;

        constructor(callback: Signal.ISignalCallback<CallbackParam>, once?: boolean) {
            super();

            this.callback = callback;
            this.once = once || false;
        }

        protected cidPrefix(): string {
            return 'e';
        }
    }
}
