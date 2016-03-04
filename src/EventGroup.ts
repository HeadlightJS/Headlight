///<reference path="Signal.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export class EventGroup<CallbackParam> extends Base {
        public callback: Signal.ISignalCallback<CallbackParam>;
        public receiver: Receiver;
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
