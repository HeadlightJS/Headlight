///<reference path="interface.d.ts"/>

module Headlight {
    'use strict';

    export class EventGroup<CallbackParam> extends Base implements IEventGroup<CallbackParam> {
        public callback: ISignalCallback<CallbackParam>;
        public receiver: IReceiver;
        public once: boolean;

        constructor(callback: ISignalCallback<CallbackParam>, once?: boolean) {
            super();

            this.callback = callback;
            this.once = once || false;
        }

        protected cidPrefix(): string {
            return 'e';
        }
    }
}
