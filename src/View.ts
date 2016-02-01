///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export interface IView extends IBase {
        el: HTMLElement;
        cidPrefix(): string;
        tagName(): string;
        className(): string;
        id(): string;
    }

    export interface IDomHandler {
        (event?: MouseEvent|KeyboardEvent|Event|TouchEvent, target?: HTMLElement): void;
    }

    export interface IEventHash {
        event: string;
        selector: string;
        handler: IDomHandler;
        context?: any;
    }

    export interface IViewOptions {

    }

    export abstract class BaseView extends Base {

        public el: HTMLElement;
        private __listeningEvents: IListeningHash = {};

        constructor(options: IViewOptions) {
            super();
            this.__createElement();
            this.initProps(options);
            this.__initEvents();
        }

        protected abstract initProps(options?: IViewOptions): BaseView

        public cidPrefix(): string {
            return 'v';
        }

        public tagName(): string {
            return 'DIV';
        }

        public className(): string {
            return '';
        }

        public id(): string {
            return '';
        }

        protected events(): Array<IEventHash> {
            return [];
        }

        protected $(selector: string): HTMLElement[] {
            return Array.prototype.slice.call(this.el.querySelectorAll(selector));
        }

        protected setElement(element: HTMLElement): BaseView {
            let parent = this.el.parentNode;
            this.el = element;
            if (parent) {
                parent.appendChild(this.el);
            }
            return this;
        }

        protected on(eventName: string, selector: string|void, handler: IDomHandler, context?: any): BaseView {

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

        protected off(eventName?: string, handler?: IDomHandler): BaseView {

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
                    return listenerData.handler === handler;
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
            this.el = document.createElement(this.tagName() || 'DIV');
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
            events.forEach((eventData: IEventHash): void => {
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

    export class View extends BaseView implements IView {

        protected initProps(): this {
            return this;
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
        handler: IDomHandler;
    }

}
