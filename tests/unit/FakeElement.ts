module fakeElement {
    'use strict';

    export class FakeElement {

        public tagName: string;
        public eventsData: {[event: string]: Array<Function>} = {};
        public parentNode: FakeElement = null;
        public className: string = '';
        public classList: ClassList = new ClassList(this);

        public childs: Array<FakeElement> = [];

        constructor(tagName: string) {
            this.tagName = tagName.toUpperCase();
        }

        public querySelector(selector: string): FakeElement {
            return this.querySelectorAll(selector)[0] || null;
        }

        public querySelectorAll(selector: string): Array<FakeElement> {
            let selectors = FakeElement._parseSelector(selector);
            return this._find(selectors);
        }

        public appendChild(node: FakeElement): void {
            let nodeParent = node.parentNode;
            if (nodeParent) {
                nodeParent.removeChild(node);
            }
            node.parentNode = this;
            this.childs.push(node);
        }

        public removeChild(node: FakeElement): void {
            let index = this.childs.indexOf(node);
            if (index !== -1) {
                this.childs.splice(index, 1);
                node.parentNode = null;
            }
        }

        public addEventListener(eventName: string, handler: Function): void {

            if (!this.eventsData[eventName]) {
                this.eventsData[eventName] = [];
            }

            this.eventsData[eventName].push(handler);
        }

        public removeEventListener(eventName: string, handler: Function): void {

            if (!this.eventsData[eventName]) {
                return null;
            }

            this.eventsData[eventName] = this.eventsData[eventName]
                .filter((myHandler: Function): boolean => myHandler !== handler);
        }

        public dispatchEvent(event: Event): void {
            event.target = <any>this;
            this._trigger(event);
            FakeElement._startParentEvent(this.parentNode, event);
        }

        private _trigger(event: Event): void {
            if (this.eventsData[event.type]) {
                this.eventsData[event.type].forEach((handler: Function) => {
                    handler.call(this, event);
                });
            }
        }

        private _find(selectors: Array<ISelector>): Array<FakeElement> {
            let result = [];
            let find = (element: FakeElement) => {
                if (FakeElement._isTrueSelectors(selectors, element)) {
                    result.push(element);
                }
                if (element.childs && element.childs.length) {
                    element.childs.forEach(find);
                }
            };
            find(this);
            return result;
        }

        /* tslint:disable **/
        public static createEvent(): any {
            return {
                target: null,
                initEvent: function (type: string) {
                    this.type = type;
                }
            };
        }
        /* tslint:enable **/

        private static _isTrueSelectors(selectors: Array<ISelector>, element: FakeElement): boolean {
            return selectors.every((selector: ISelector) => {
                let state = true;
                if (state && selector.tagName) {
                    state = selector.tagName.toLowerCase() === element.tagName.toLowerCase();
                }
                if (state && selector.classList.length) {
                    let elementClasses = element.className.split(/\s+/);
                    state = selector.classList.every((className: string) => {
                        return elementClasses.indexOf(className) !== -1;
                    });
                }
                return state;
            });
        }

        private static _startParentEvent(parent: FakeElement, event: Event): void {
            if (parent) {
                parent._trigger(event);
                FakeElement._startParentEvent(parent.parentNode, event);
            }
        }

        private static _parseSelector(originSelector: string): ISelector[] {
            return originSelector.split(/\s+/).map((selector: string) => {
                let dotIndex = selector.indexOf('.');
                if (dotIndex === -1) {
                    return {
                        tagName: selector,
                        classList: []
                    };
                } else {
                    return {
                        tagName: selector.substr(0, dotIndex),
                        classList: selector.substr(dotIndex, selector.length)
                            .split('.').filter((name: string) => !!name)
                    };
                }
            });
        }

    }

    interface ISelector {
        tagName: string;
        classList: Array<string>;
    }

}
