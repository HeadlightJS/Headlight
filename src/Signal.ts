module Headlight {
    'use strict';

    export interface ISignal<T> {
        add(callback: T): void;
        addOnce(callback: T): void;
        remove(callback: T): void;
        removeAll(): void;
        dispatch(): void;
        enable(): void;
        disable(): void;
    }

    interface IReceiver extends Function {
        once?: boolean;
    }

    export class Signal<T extends IReceiver> implements ISignal<T> {
        private callbacks: Array<T> = [];
        private isEnabled: boolean = true;

        constructor() {

        }

        public add(callback: T): void {
            if (!this.hasReceiver(callback)) {
                this.callbacks.push(callback);
            }
        }

        public addOnce(callback: T): void {
            if (!this.hasReceiver(callback)) {
                callback.once = true;
                this.callbacks.push(callback);
            }
        }

        public remove(callback: T): void {
            if (this.hasReceiver(callback)) {
                this.callbacks.splice(this.callbacks.indexOf(callback), 1);
            }
        }

        public removeAll(): void {
            this.callbacks = [];
        }

        public dispatch(): void {
            if (this.isEnabled) {
                this.callbacks.forEach((callback: T) => {
                    callback();

                    if (callback.once) {
                        this.remove(callback);
                    }
                });
            } // TODO: Throw an error?
        }

        public enable(): void {
            this.isEnabled = true;
        }

        public disable(): void {
            this.isEnabled = false;
        }

        private hasReceiver(callback: any): boolean {
            return this.callbacks.indexOf(callback) !== -1;
        }
    }
}
