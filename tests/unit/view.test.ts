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

            protected initProps(): this {
                return this;
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

            protected initProps(): this {
                return this;
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

            protected initProps(): this {
                return this;
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

            protected initProps(): this {
                return this;
            }

        }

        let view = new MyView({});
        assert.equal(0, view.cid.indexOf(view.cidPrefix()));

    });

});
