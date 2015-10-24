///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    export interface IView {

    }

    export class View implements IView {
        protected el: HTMLElement = document.createElement('div');

        constructor() {

        }

        public $(selector: string): NodeListOf<Element> {
            return this.el.querySelectorAll(selector);
        }
    }
}
