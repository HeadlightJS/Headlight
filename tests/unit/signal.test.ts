/// <reference path="../../typings/tsd.d.ts" />

import {ISignal, ISignalCallback} from '../../src/signal/signal.d';
import {Signal} from '../../src/signal/Signal';
import {Receiver} from '../../src/receiver/Receiver';

describe('Signal.', () => {
    let assert = chai.assert;
    let signal: ISignal<string>;

    class Handler {
        public count: number = 0;
        public name: string;

        public callback(name?: string): void {
            this.count++;
            this.name = name;
        }

        public static gc(callback: ISignalCallback<any>, ctx: any):
            ISignalCallback<any> {

            return function (param?: string): void {
                callback.call(ctx, param);
            };
        }
    }

    beforeEach(() => {
        signal = new Signal<any>();
    });

    it('Creates properly', () => {
        assert.equal('s', signal.cid[0]);
    });

    it('Adds new callback function and dispach signal', () => {
        let h = new Handler();
        const NAME = 'Joe';

        signal.add(Handler.gc(h.callback, h));
        signal.dispatch();
        signal.dispatch(NAME);

        assert.equal(h.name, NAME);
        assert.equal(h.count, 2, 'Callback function should be called 2 times.');
    });

    it('Adds new callback function for single use and dispach signal', () => {
        let h = new Handler();

        signal.addOnce(Handler.gc(h.callback, h));
        signal.dispatch();
        signal.dispatch();

        assert.equal(h.count, 1, 'Callback function should be called 1 time.');
    });

    it('Adds two new callback functions and dispach signal', () => {
        let h = new Handler();
        let h2 = new Handler();

        signal.add(Handler.gc(h.callback, h));
        signal.dispatch();
        signal.add(Handler.gc(h2.callback, h2));
        signal.dispatch();
        signal.dispatch();

        assert.equal(h.count, 3, 'Callback function should be called 3 times.');
        assert.equal(h2.count, 2, 'Callback2 function should be called 2 times.');
    });

    it('Remove callback function by callback', () => {
        let h = new Handler(),
            callback = Handler.gc(h.callback, h);

        signal.add(callback);
        signal.dispatch();
        signal.remove(callback);
        signal.dispatch();

        assert.equal(h.count, 1, 'Callback2 function should be called 1 time.');
    });

    it('Remove callback function by receiver.', () => {
        let h = new Handler(),
            h2 = new Handler(),
            h3 = new Handler(),
            r = new Receiver();

        signal.add(Handler.gc(h.callback, h), r);
        signal.add(Handler.gc(h2.callback, h2), r);

        assert.equal(signal.getReceivers().length, 1);

        signal.add(Handler.gc(h2.callback, h2));
        signal.dispatch();

        signal.add(Handler.gc(h3.callback, h3), r);

        signal.remove(r);
        signal.dispatch();

        assert.equal(signal.getReceivers().length, 0);

        assert.equal(h.count, 1, 'Callback function should be called 1 time.');
        assert.equal(h2.count, 3, 'Callback2 function should be called 2 time.');
        assert.equal(h3.count, 0, 'Callback0 function should be called 0 time.');
    });

    it('Remove very callback function of very receiver.', () => {
        let h = new Handler(),
            h2 = new Handler(),
            h3 = new Handler(),
            h4 = new Handler(),
            callback = Handler.gc(h.callback, h),
            callback2 = Handler.gc(h2.callback, h2),
            callback3 = Handler.gc(h3.callback, h3),
            callback4 = Handler.gc(h4.callback, h4),
            r = new Receiver(),
            r2 = new Receiver();

        signal.add(callback2, r);
        signal.add(callback, r);
        signal.add(callback2);
        signal.add(callback3);
        signal.add(callback4, r2);

        assert.equal(signal.getReceivers().length, 2);

        signal.dispatch();

        assert.equal(h.count, 1, 'Callback function should be called 1 time.');
        assert.equal(h2.count, 2, 'Callback2 function should be called 2 time.');
        assert.equal(h3.count, 1, 'Callback3 function should be called 1 time.');
        assert.equal(h4.count, 1, 'Callback4 function should be called 1 time.');

        signal.remove(callback2, r);
        signal.remove(callback4);
        signal.dispatch();

        assert.equal(signal.getReceivers().length, 1);

        assert.equal(h.count, 2, 'Callback function should be called 2 time.');
        assert.equal(h2.count, 3, 'Callback2 function should be called 1 time.');
        assert.equal(h3.count, 2, 'Callback3 function should be called 2 time.');

        assert.equal(h4.count, 1, 'Callback4 function should be called 1 time.');
    });

    it('Remove all callback functions.', () => {
        let h = new Handler(),
            h2 = new Handler(),
            r = new Receiver();

        signal.add(Handler.gc(h.callback, h), r);
        signal.dispatch();
        signal.add(Handler.gc(h2.callback, h2));

        assert.equal(signal.getReceivers().length, 1);

        signal.dispatch();
        signal.remove();
        signal.dispatch();

        assert.equal(signal.getReceivers().length, 0);
        assert.equal(h.count, 2, 'Callback function should be called 2 times.');
        assert.equal(h2.count, 1, 'Callback2 function should be called 1 time.');
    });

    it('Removing anything which hasn`t been added doesn`t throw Error.', () => {
        let h = new Handler();
        let callback = Handler.gc(h.callback, h);
        let r = new Receiver();


        assert.doesNotThrow(() => {
            signal.remove(callback);
            signal.remove(r);
            signal.remove(callback, r);
        }, Error, 'Removing is OK.');
    });
});


