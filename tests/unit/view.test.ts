/// <reference path='FakeElement.ts' />
/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('View.', () => {
    let FakeElement: typeof fakeElement.FakeElement = fakeElement.FakeElement;
    let assert = chai.assert;

    it('create', () => {
        let view = new Headlight.View({});
        assert.instanceOf(view, Headlight.View);
    });

    it('tagName', () => {

        class MyView extends Headlight.View {

            public el: HTMLElement;

            public tagName(): string {
                return 'SPAN';
            }

        }

        let view = new MyView({});
        assert.equal(view.tagName(), view.el.tagName);

    });

    it('className', () => {

        class MyView extends Headlight.View {

            public el: HTMLElement;

            public className(): string {
                return 'test-class';
            }

        }

        let view = new MyView({});
        assert.equal(view.className(), view.el.className);

    });

    it('id', () => {

        class MyView extends Headlight.View {

            public el: HTMLElement;

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

            public el: HTMLElement;

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
        let el = new FakeElement('DIV');
        let wrap = new FakeElement('DIV');
        let child = new FakeElement('span');
        let clickTarget = new FakeElement('I');
        wrap.appendChild(child);
        child.appendChild((() => {
            let elem = new FakeElement('span');
            elem.classList.add(className);
            return elem;
        })());
        wrap.appendChild((() => {
            let elem = new FakeElement('img');
            elem.classList.add(className);
            return elem;
        })());
        child.classList.add(className);
        child.appendChild(clickTarget);
        el.appendChild(wrap);

        let event: any = {
            type: 'click',
            target: null
        };

        class MyView extends Headlight.View {

            public clickedChild: boolean;
            public rootClicked: boolean;

            constructor(options: {element: HTMLElement}) {
                super(options);
                this.setElement(options.element);
            }

            public events(): Array<Headlight.View.IEventHash> {
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
                    element && element === <any>child) {
                    this.clickedChild = true;
                }
            }

        }

        let view = new MyView({
            element: <any>el
        });

        clickTarget.dispatchEvent(event);
        wrap.querySelector('img').dispatchEvent(event);

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

            public events(): Array<Headlight.View.IEventHash> {
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

            public offCustom(): void {
                this.off('some');
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

        let elements: fakeElement.FakeElement;
        let events = {
            click: null,
            mousedown: null
        };

        let beforeEach = () => {

            elements = new FakeElement('DIV');
            let child = new FakeElement('span');
            let clickTarget = new FakeElement('I');
            child.appendChild(clickTarget);
            elements.appendChild(child);
            child.classList.add(className);

            events.click = FakeElement.createEvent();
            events.click.initEvent('click', true, true);

            events.mousedown = FakeElement.createEvent();
            events.mousedown.initEvent('mousedown', true, true);

        };

        it('off all', (): void => {

            beforeEach();
            let view = new MyView({
                element: <any>elements
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
                element: <any>elements
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
                element: <any>elements
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

        it('off some event', () => {

            beforeEach();
            let view = new MyView({
                element: <any>elements
            });

            view.offCustom();

            elements.querySelector('i').dispatchEvent(events.click);
            elements.querySelector('i').dispatchEvent(events.mousedown);

            assert.equal(view.clickChildCount, 1);
            assert.equal(view.clickRootCount, 1);
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

            public events(): Array<Headlight.View.IEventHash> {
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

        let elParent = new FakeElement('DIV');
        let element = new FakeElement('DIV');

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
            assert.equal(element.parentNode, null);

        });

        it('remove with parent', () => {

            elParent.appendChild(element);

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
            assert.equal(element.parentNode, null);

        });

    });

    describe('Acts as Receiver', () => {
        common.receiverTest(Headlight.View);
    });

});
