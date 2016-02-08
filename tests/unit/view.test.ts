/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('View.', () => {
    let assert = chai.assert;

    it('create', () => {
        let view = new Headlight.View();
        assert.instanceOf(view, Headlight.View);
    });

    it('tagName', () => {

        class MyView extends Headlight.View {

            public tagName(): string {
                return 'SPAN';
            }

        }

        let view = new MyView();
        assert.equal(view.tagName(), view.el.tagName);

    });

    it('className', () => {

        class MyView extends Headlight.View {

            public className(): string {
                return 'test-class';
            }

        }

        let view = new MyView({});
        assert.equal(view.className(), view.el.className);

    });

    it('id', () => {

        class MyView extends Headlight.View {

            public id(): string {
                return 'test-id';
            }

        }

        let view = new MyView({});
        assert.equal(view.el.id, view.id());

    });

    it('cidPrefix', () => {

        class MyView extends Headlight.View {

            public cidPrefix(): string {
                return 'view';
            }

        }

        let view = new MyView({});
        assert.equal(0, view.cid.indexOf(view.cidPrefix()));

    });

    it('setElement', () => {

        class MyView extends Headlight.View {

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
            }

        }

        let element = document.createElement('DIV');
        let view = new MyView({
            element: element
        });
        assert.equal(view.el, element);

    });

    it('$', () => {

        let className = 'test';

        class MyView extends Headlight.View {

            public findResult: HTMLElement;

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
                this.findResult = this.$(`.${className}`)[0];
            }

        }

        let el = document.createElement('DIV');
        let child = document.createElement('span');
        child.classList.add(className);
        el.appendChild(child);

        let view = new MyView({
            element: el
        });

        assert.equal(child, view.findResult);

    });

    it('events', (): void => {

        let className = 'test';
        let el = document.createElement('DIV');
        let wrap = document.createElement('DIV');
        let child = document.createElement('span');
        let clickTarget = document.createElement('I');
        child.appendChild(wrap);
        child.appendChild((() => {
            let elem = document.createElement('span');
            elem.classList.add(className);
            return elem;
        })());
        wrap.appendChild(clickTarget);

        let event = document.createEvent('Event');
        event.initEvent('click', true, true);


        class MyView extends Headlight.View {

            public clickedChild: boolean;
            public rootClicked: boolean;

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
            }

            public events(): Array<Headlight.IEventHash> {
                return [
                    {
                        event: 'click',
                        selector: `.${className}`,
                        handler: this._onClickChild
                    },
                    {
                        event: 'click',
                        handler: this._onClickRoot,
                        selector: ''
                    }
                ];
            }

            private _onClickRoot(): void {
                this.rootClicked = true;
            }

            private _onClickChild(localEvent: MouseEvent, element: HTMLElement): void {
                if (localEvent && localEvent.type === 'click' &&
                    element && element === child) {
                    this.clickedChild = true;
                }
            }

        }

        child.classList.add(className);
        el.appendChild(child);

        let view = new MyView({
            element: el
        });

        clickTarget.dispatchEvent(event);

        assert.equal(view.clickedChild, true);
        assert.equal(view.rootClicked, true);
    });

    describe('off', () => {

        let className = 'test';

        class MyView extends Headlight.View {

            public clickRootCount: number = 0;
            public clickChildCount: number = 0;
            public mouseDownCount: number = 0;

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
            }

            public events(): Array<Headlight.IEventHash> {
                return [
                    {
                        event: 'click',
                        selector: `.${className}`,
                        handler: this._onClickChild
                    },
                    {
                        event: 'click',
                        handler: this._onClickRoot,
                        selector: ''
                    },
                    {
                        event: 'mousedown',
                        handler: this._onMouseDown,
                        selector: ''
                    }
                ];
            }

            public stop(eventName?: string): void {
                this.off(eventName);
            }

            public stopChild(): void {
                this.off('click', this._onClickChild);
                this.off('mousedown', this._onMouseDown);
            }

            private _onClickRoot(): void {
                this.clickRootCount++;
            }

            private _onClickChild(): void {
                this.clickChildCount++;
            }

            private _onMouseDown(): void {
                this.mouseDownCount++;
            }

        }

        let elements: HTMLElement;
        let events = {
            click: null,
            mousedown: null
        };

        let beforeEach = () => {

            elements = document.createElement('DIV');
            let child = document.createElement('span');
            let clickTarget = document.createElement('I');
            child.appendChild(clickTarget);
            elements.appendChild(child);
            child.classList.add(className);

            events.click = document.createEvent('Event');
            events.click.initEvent('click', true, true);

            events.mousedown = document.createEvent('Event');
            events.mousedown.initEvent('mousedown', true, true);

        };

        it('off all', (): void => {

            beforeEach();
            let view = new MyView({
                element: elements
            });

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            view.stop();

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            assert.equal(view.clickChildCount, 1);
            assert.equal(view.clickRootCount, 1);
            assert.equal(view.mouseDownCount, 1);

        });

        it('off clicks', () => {

            beforeEach();
            let view = new MyView({
                element: elements
            });

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            view.stop('click');

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            assert.equal(view.clickChildCount, 1);
            assert.equal(view.clickRootCount, 1);
            assert.equal(view.mouseDownCount, 2);

        });

        it('off one handler', () => {

            beforeEach();
            let view = new MyView({
                element: elements
            });

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            view.stopChild();

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            assert.equal(view.clickChildCount, 1);
            assert.equal(view.clickRootCount, 2);
            assert.equal(view.mouseDownCount, 1);

        });

    });

    describe('remove', () => {

        class MyView extends Headlight.View {

            public clickRootCount: number = 0;
            public clickChildCount: number = 0;
            public mouseDownCount: number = 0;

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
            }

            public events(): Array<Headlight.IEventHash> {
                return [
                    {
                        event: 'click',
                        handler: this._onClickChild,
                        selector: ''
                    },
                    {
                        event: 'click',
                        handler: this._onClickRoot,
                        selector: ''
                    },
                    {
                        event: 'mousedown',
                        handler: this._onMouseDown,
                        selector: ''
                    }
                ];
            }

            public stop(eventName?: string): void {
                this.off(eventName);
            }

            public stopChild(): void {
                this.off('click', this._onClickChild);
            }

            private _onClickRoot(): void {
                this.clickRootCount++;
            }

            private _onClickChild(): void {
                this.clickChildCount++;
            }

            private _onMouseDown(): void {
                this.mouseDownCount++;
            }

        }

        class FakeElement {

            public eventsData: {[event: string]: Array<Function>} = {};
            public removed: boolean = false;
            public childerns: Array<any> = [];

            public get parentNode(): {removeChild: Function, appendChild: Function} {
                return {
                    removeChild: (): void => {
                        this.removed = true;
                    },
                    appendChild: (element: any): void => {
                        this.childerns.push(element);
                    }
                };
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

        }

        let element: FakeElement = new FakeElement();

        it('remove stop handlers', (): void => {

            let view = new MyView({
                element: <any>element
            });

            view.remove();

            let events = {
                'click': 'click',
                'mousedown': 'mousedown'
            };

            assert.equal(element.eventsData[events.click].length, 0);
            assert.equal(element.eventsData[events.mousedown].length, 0);
            assert.equal(element.removed, true);

        });

    });

});
