/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('View.', () => {
    let assert = chai.assert;

    it('create', () => {
        let view = new Headlight.View({});
        assert.instanceOf(view, Headlight.View);
    });

    it('tagName', () => {

        class MyView extends Headlight.View {

            public tagName(): string {
                return 'SPAN';
            }

        }

        let view = new MyView({});
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

    it('events', () => {

        let className = 'test';
        let el = document.createElement('DIV');
        let child = document.createElement('span');
        let clickTarget = document.createElement('I');
        child.appendChild(clickTarget);

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

});
