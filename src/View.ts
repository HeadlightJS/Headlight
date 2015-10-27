///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export interface IView {

        $(selector: string): NodeListOf<Element>;
        onDom(eventName: string, selector: string, handler: IHandler, context?: any): IView;
        offDom(eventName?: string, handler?: IHandler): IView;

    }

    enum EventData {event, selector}

    export class View implements IView {

        protected el: HTMLElement = document.createElement('div');
        private domEvents: IDomEvents = {};


        constructor() {
            this.initEvents();
        }

        public $(selector: string): NodeListOf<Element> {
            return this.el.querySelectorAll(selector);
        }

        public onDom(eventName: string, selector: string, handler: IHandler, context?: any): IView {

            if (!this.domEvents[eventName]) {
                this.domEvents[eventName] = [];
            }

            let originHandler = function (event: IUIEvent): any {
                if (View.checkTargetElement(selector, event.target)) {
                    return handler.call(context || event.target, event);
                }
            };

            this.domEvents[eventName].push({
                handler: handler,
                context: context,
                originHandler: originHandler
            });

            return this;
        }

        public offDom(eventName?: string, handler?: IHandler): IView {

            if (!eventName) {
                Object.keys(this.domEvents).forEach((myEventName: string): void => {
                    this.offDom(myEventName);
                });
                return this;
            }

            if (eventName in this.domEvents) {

                if (handler) {
                    this.domEvents[eventName].slice().forEach((handlerObj: IHandelrData) => {
                        this.offDom(eventName, handlerObj.handler);
                    });
                    return this;
                }

                this.offDomHandler(eventName, handler);
            }

            return this;
        }

        public remove(): void {
            this.offDom();
        }

        protected events(): IDomEventData {
            return {};
        }

        private offDomHandler(eventName: string, handelr: IHandler): void {

            let handlerData = this.getHandlerData(eventName, handelr);

            if (!handlerData) {
                return null;
            }

            this.domEvents[eventName] = this.domEvents[eventName].filter((localHandlerData: IHandelrData) => {
                return localHandlerData.handler === handlerData.handler;
            });
            this.el.removeEventListener(eventName, handlerData.originHandler, false);

        }

        private getHandlerData(eventName: string, handler: IHandler): IHandelrData {
            let resultHandlerData: IHandelrData = null;
            this.domEvents[eventName].some((handlerData: IHandelrData) => {
                if (handlerData.handler === handler) {
                    resultHandlerData = handlerData;
                    return true;
                }
            });
            return resultHandlerData;
        }

        private initEvents(): void {
            let events = this.events();

            Object.keys(events).forEach((eventAndSelector: string): void => {
                let eventAndSelectorArr = eventAndSelector.trim().split(' ');
                let event = eventAndSelectorArr[EventData.event].trim();
                let selector = eventAndSelectorArr[EventData.selector].trim();
                if (!event || !selector) {
                    throw new TypeError('Неверный формат подписки на события!');
                }
                this.onDom(event, selector, events[eventAndSelector], this);
            });

        }

        private static checkTargetElement(selector: string, element: IElement): boolean {
            return element.matches(selector);
        }
    }

    interface IDomEventData {
        [eventAndSelector: string]: IHandler;
    }

    interface IUIEvent extends Event {
        target: IElement;
    }

    interface IElement extends Element {
        matches(selector: string): boolean;
    }

    interface IDomEvents {
        [event: string]: Array<IHandelrData>;
    }

    interface IHandelrData {
        handler: IHandler;
        context?: any;
        originHandler: IHandler;
    }

    interface IHandler {
        (...args: Array<any>): any;
    }

}
