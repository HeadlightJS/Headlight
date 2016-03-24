///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export class View extends Receiver {

        protected el: HTMLElement;
        private __listeningEvents: IListeningHash = {};

        constructor(options?: View.IOptions) {
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

        public domUpdate(options?: View.IUpdateDomOptions): void {
            if (options && options.event) {
                this.__updateDomHandlers(options.event, options.handler);
            } else {
                Object.keys(this.__listeningEvents).forEach((eventName: string) => {
                    this.__updateDomHandlers(eventName, options && options.handler);
                });
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
            let eventData = this.__getEventsData();
            this.off();
            this.el = element;
            eventData.forEach(this.on, this);
            return this;
        }

        protected on(options: View.IEventHash): View {

            if (!this.__listeningEvents[options.event]) {
                this.__listeningEvents[options.event] = [];
            }

            let elements;
            let self = this;
            let originHandler = function (event: Event): any {
                return options.handler.call(options.context || self, event, this);
            };

            if (options.selector) {
                elements = this.$(options.selector);
            } else {
                elements = [this.el];
            }

            elements.forEach((element: HTMLElement) => {
                element.addEventListener(options.event, originHandler, false);
            });

            this.__listeningEvents[options.event].push({
                selector: options.selector,
                context: options.context,
                handler: options.handler,
                elements: elements,
                originHandler: originHandler
            });

            return this;
        }

        protected off(eventName?: string, handler?: View.IDomHandler): View {

            if (!eventName) {
                Object.keys(this.__listeningEvents).forEach((event: string) => {
                    this.off(event);
                });
            }

            let _events = this.__listeningEvents;

            if (_events[eventName]) {

                if (handler) {
                    this.__listeningEvents[eventName] = _events[eventName].filter((listener: IListener) => {
                        if (handler === listener.handler) {
                            listener.elements.forEach((element: HTMLElement) => {
                                element.removeEventListener(eventName, (<any>listener).originHandler);
                            });
                            return false;
                        } else {
                            return true;
                        }
                    });
                    if (!this.__listeningEvents[eventName].length) {
                        delete this.__listeningEvents[eventName];
                    }
                } else {
                    this.__listeningEvents[eventName].forEach((listener: IListener) => {
                        listener.elements.forEach((element: HTMLElement) => {
                            element.removeEventListener(eventName, (<any>listener).originHandler);
                        });
                    });
                    delete this.__listeningEvents[eventName];
                }
            }

            return this;
        }
        
        private __updateDomHandlers(event: string, handler?: View.IDomHandler): void {
            
            if (!this.__listeningEvents[event]) {
                return null;
            }
            
            this.__listeningEvents[event].forEach((listener: IListener) => {

                if (listener.selector && (!handler || listener.handler === handler)) {

                    let elements = this.$(<string>listener.selector);

                    listener.elements = listener.elements.filter((element: HTMLElement) => {
                        let index = elements.indexOf(element);
                        if (index === -1) {
                            element.removeEventListener(event, listener.originHandler, false);
                            return false;
                        } else {
                            elements.splice(index, 1);
                            return true;
                        }
                    });

                    elements.forEach((element: HTMLElement) => {
                        element.addEventListener(event, listener.originHandler, false);
                        listener.elements.push(element);
                    });

                }

            });
        }

        private __getEventsData(): Array<View.IEventHash> {
            let events = [];
            Object.keys(this.__listeningEvents).forEach((eventName: string) => {
                this.__listeningEvents[eventName].forEach((listener: IListener) => {
                    events.push({
                        event: eventName,
                        selector: listener.selector,
                        handler: listener.handler,
                        context: listener.context
                    });
                });
            });
            return events;
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
            events.forEach(this.on, this);
        }

    }

    export module View {
        'use strict';

        export interface IDomHandler extends Function {
            (event?: MouseEvent|KeyboardEvent|Event|TouchEvent, target?: HTMLElement): void;
        }
        
        export interface IUpdateDomOptions {
            event?: string;
            handler?: IDomHandler;
        }

        export interface IEventHash {
            event: string;
            selector?: string;
            handler: IDomHandler;
            context?: any;
        }

        export interface IOptions {

        }
    }

    interface IListeningHash {
        [event: string]: Array<IListener>;
    }

    interface IListener {
        selector: string|void;
        context: any;
        handler: View.IDomHandler;
        elements: Array<HTMLElement>;
        originHandler: EventListener;
    }

}
