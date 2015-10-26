module Headlight {
    'use strict';

    export interface ISignal<T> {
        add(receiver:T): void;
        addOnce(receiver:T): void;
        remove(receiver:T): void;
        removeAll(): void;
        dispatch(): void;
        enable(): void;
        disable(): void;
    }

    interface IReceiver extends Function {
        once?: boolean;
    }

    export class Signal<T extends IReceiver> implements ISignal<T> {
        private receivers:Array<T> = [];
        private isEnabled:boolean = true;


        public add(receiver:T):void {
            if (!this.hasReceiver(receiver)) {
                this.receivers.push(receiver);
            }
        }

        public addOnce(receiver:T):void {
            if (!this.hasReceiver(receiver)) {
                receiver.once = true;
                this.receivers.push(receiver);
            }
        }

        public remove(receiver:T):void {
            if (this.hasReceiver(receiver)) {
                this.receivers.splice(this.receivers.indexOf(receiver), 1);
            }
        }

        public removeAll():void {
            this.receivers = [];
        }

        public dispatch():void {
            if (this.isEnabled) {
                for (let receiver of this.receivers) {
                    receiver();

                    if (receiver.once) {
                        this.remove(receiver);
                    }
                }
            } // TODO: Throw an error?
        }

        public enable():void {
            this.isEnabled = true;
        }

        public disable():void {
            this.isEnabled = false;
        }

        private hasReceiver(receiver:any):boolean {
            return this.receivers.indexOf(receiver) !== -1;
        }
    }
}
