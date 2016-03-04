///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export class View extends Receiver {

        protected el: HTMLElement;
        private __listeningEvents: IListeningHash = {};

        constructor(options: View.IOptions) {
            super();
            this.__createElement();
            this.__initEvents();
        }

        public cidPrefix(): string {
            return 'v';
        }

        public remove(): void {
            this.stopReceiving();
            this.off();
            if (this.el.parentNode) {
                this.el.parentNode.removeChild(this.el);
            }
        }

        protected tagName(): string {
            return 'DIV';
        }

        protected className(): string {
            return '';
        }

        protected id(): string {
            return '';
        }

        protected events(): Array<View.IEventHash> {
            return [];
        }

        protected $(selector: string): HTMLElement[] {
            return Array.prototype.slice.call(this.el.querySelectorAll(selector));
        }

        protected setElement(element: HTMLElement): View {
            let oldEl = this.el;
            this.el = element;
            this.__resetHandlers(oldEl);
            return this;
        }

        protected on(eventName: string, selector: string|void, handler: View.IDomHandler, context?: any): View {

            if (!this.__listeningEvents[eventName]) {
                this.__addTypeHandler(eventName);
            }

            this.__listeningEvents[eventName].listeners.push({
                selector: selector,
                context: context,
                handler: handler
            });

            return this;
        }

        protected off(eventName?: string, handler?: View.IDomHandler): View {

            if (!eventName) {
                Object.keys(this.__listeningEvents).forEach((localEventName: string) => {
                    this.el.removeEventListener(localEventName, this.__listeningEvents[localEventName].handler);
                    delete this.__listeningEvents[localEventName];
                });
                return this;
            }

            if (eventName in this.__listeningEvents) {

                let listData = this.__listeningEvents[eventName];

                if (!handler) {
                    this.el.removeEventListener(eventName, listData.handler);
                    delete this.__listeningEvents[eventName];
                    return this;
                }

                listData.listeners = listData.listeners.filter((listenerData: IListener): boolean => {
                    return listenerData.handler !== handler;
                });

                if (!listData.listeners.length) {
                    this.el.removeEventListener(eventName, listData.handler);
                    delete this.__listeningEvents[eventName];
                }

            }

            return this;
        }

        private __addTypeHandler(eventName: string): void {
            this.__listeningEvents[eventName] = {
                listeners: [],
                handler: (event: any): void => {
                    this.__startEvent(event, eventName);
                }
            };
        }

        private __resetHandlers(oldElem: HTMLElement): void {
            Object.keys(this.__listeningEvents).forEach((name: string): void => {
                oldElem.removeEventListener(name, this.__listeningEvents[name].handler);
                this.el.addEventListener(name, this.__listeningEvents[name].handler, false);
            });
        }

        private __startEvent(event: any, eventName: string): void {
            this.__listeningEvents[eventName].listeners.forEach((listenerData: IListener) => {
                if (!listenerData.selector) {
                    listenerData.handler.call(listenerData.context, event, this.el);
                } else {
                    this.$(<string>listenerData.selector).some((element: HTMLElement): boolean => {
                        if (event.target === element || View.__hasInElement(this.el, element, event.target)) {
                            listenerData.handler.call(listenerData.context, event, element);
                            return true;
                        }
                    });
                }
            });
        }

        private __createElement(): void {
            this.el = document.createElement(this.tagName());
            let className = this.className();
            let id = this.id();
            if (className) {
                this.el.classList.add(className);
            }
            if (id) {
                this.el.id = id;
            }
        }

        private __initEvents(): void {
            let events = this.events();
            events.forEach((eventData: View.IEventHash): void => {
                this.on(eventData.event, eventData.selector, eventData.handler, eventData.context || this);
            });
        }

        private static __hasInElement(searchRoot: HTMLElement, parent: HTMLElement, child: HTMLElement): boolean {
            let node = child.parentNode;
            while (node !== searchRoot) {
                if (node === parent) {
                    return true;
                }
                node = node.parentNode;
            }
            return false;
        }

    }

    export module View {
        'use strict';

        export interface IDomHandler {
            (event?: MouseEvent|KeyboardEvent|Event|TouchEvent, target?: HTMLElement): void;
        }

        export interface IEventHash {
            event: string;
            selector: string;
            handler: IDomHandler;
            context?: any;
        }

        export interface IOptions {

        }
    }

    interface IListeningHash {
        [event: string]: {
            listeners: Array<IListener>;
            handler: (event: any) => void;
        };
    }

    interface IListener {
        selector: string|void;
        context: any;
        handler: View.IDomHandler;
    }

}
