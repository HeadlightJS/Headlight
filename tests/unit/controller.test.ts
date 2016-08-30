/// <reference path="../../typings/tsd.d.ts" />

import {Controller, IViewFunc} from '../../src/controller/Controller';

describe('Controller', () => {
    let assert = chai.assert;

    class Child extends Controller<{}, {}, {}> {

        protected view: IViewFunc<{}>;
        protected el: Element;
        protected children: {};

        constructor() {
            super({});
            this.children = null;
        }

        protected getViewData(): {} {
            return {};
        }

    }

    class MyController extends Controller<{}, {}, {child: Child}> {

        public view: IViewFunc<{}>;
        public el: Element;
        public children: {child: Child};
        public parent: HTMLElement;

        constructor() {
            super({});
            this.children = {
                child: new Child()
            };

            if (this.el) {
                this.parent = document.createElement('div');
                this.parent.appendChild(this.el);
            }
        }

        protected getViewData(): {} {
            return {};
        }

    }

    let controller;

    describe('without view', () => {

        beforeEach(() => {
            MyController.prototype.view = null;
            controller = new MyController();
        });

        it('create', () => {

            assert.instanceOf(controller, Controller);
            assert.equal(controller.el, undefined);
            assert.isObject(controller.children);
            assert.instanceOf(controller.children.child, Child);

        });

        it('remove', () => {

            controller.remove();
            assert.equal(controller.child, null);

        });

    });

    describe('with view', () => {

        beforeEach(() => {
            MyController.prototype.view = () => {
                return document.createElement('div');
            };
            controller = new MyController();
        });

        it('create', () => {

            assert.instanceOf(controller, Controller);
            assert.equal(controller.el.tagName, 'DIV');
            assert.isObject(controller.children);
            assert.instanceOf(controller.children.child, Child);
            assert.equal(controller.parent.childNodes[0], controller.el);

        });

        it('remove', () => {

            controller.remove();
            assert.equal(controller.child, null);
            assert.equal(controller.parent.childNodes.length, 0);

        });

    });

});
