//module Headlight {
//    'use strict';
//
//    export interface IDomLite {
//        add(selector: string): IDomLite;
//        add(collection: Array<HTMLElement>): IDomLite;
//        addClass(className: string): IDomLite;
//        removeClass(className: string): IDomLite;
//        toggleClass(className: string, state?: boolean): IDomLite;
//    }
//
//    export class DomLite extends Array<HTMLElement> implements IDomLite {
//
//        constructor(selector: string|Array<HTMLElement>) {
//            super();
//            this.add(selector);
//        }
//
//        public add(elements: string|Array<HTMLElement>): IDomLite {
//            if (typeof elements === 'string') {
//                this.__addBySelector(<string>elements);
//            } else {
//                this.__addByArray(<Array<HTMLElement>>elements);
//            }
//            return this;
//        }
//
//        public addClass(className: string): IDomLite {
//            className.split(/\s+/).forEach((classNameItem: string): void => {
//                this.forEach(function (element: HTMLElement): void {
//                    element.classList.add(classNameItem);
//                });
//            });
//            return this;
//        }
//
//        public removeClass(className: string): IDomLite {
//            className.split(/\s+/).forEach((classNameItem: string): void => {
//                this.forEach(function (element: HTMLElement): void {
//                    element.classList.remove(classNameItem);
//                });
//            });
//            return this;
//        }
//
//        public toggleClass(className: string, state?: boolean): IDomLite {
//            switch (state) {
//                case true:
//                    return this.addClass(className);
//                case false:
//                    return this.removeClass(className);
//                default:
//                    this.forEach((element: HTMLElement): void => {
//                        if (element.classList.contains(className)) {
//                            element.classList.remove(className);
//                        } else {
//                            element.classList.add(className);
//                        }
//                    });
//                    return this;
//            }
//        }
//
//        private __addBySelector(selector: string): void {
//            this.__addByArray(Array.prototype.slice.call(document.querySelectorAll(selector)));
//        }
//
//        private __addByArray(elements: Array<HTMLElement>): void {
//            elements.forEach((element: HTMLElement): void => {
//                this.push(element);
//            });
//        }
//
//    }
//
//}
