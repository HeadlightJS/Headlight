/// <reference path="../typings/tsd.d.ts" />
///<reference path="../src/Base.ts"/>
///<reference path="../src/Signal.ts"/>
///<reference path="../src/Receiver.ts"/>

describe('Signal.', () => {
    let assert = chai.assert;
    let signal: Headlight.ISignal;

    class Handler {
        public count: number = 0;

        public callback(): void {
            this.count++;
        }

        public static gc(callback: Function, ctx: any): Function {
            return function (): void {
                callback.call(ctx);
            };
        }
    }

    beforeEach(() => {
        signal = new Headlight.Signal();
    });

    it('Adds new callback function and dispach signal', () => {
        let h = new Handler();

        signal.add(Handler.gc(h.callback, h));
        signal.dispatch();
        signal.dispatch();

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
            r = new Headlight.Receiver();

        signal.add(Handler.gc(h.callback, h), r);

        assert.equal(signal.getReceivers().length, 1);

        signal.add(Handler.gc(h2.callback, h2));
        signal.dispatch();
        signal.remove(r);
        signal.dispatch();

        assert.equal(signal.getReceivers().length, 0);

        assert.equal(h.count, 1, 'Callback function should be called 1 time.');
        assert.equal(h2.count, 2, 'Callback2 function should be called 2 time.');
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
            r = new Headlight.Receiver(),
            r2 = new Headlight.Receiver();

        signal.add(callback, r);
        signal.add(callback2, r);
        signal.add(callback3);
        signal.add(callback4, r2);

        assert.equal(signal.getReceivers().length, 2);

        signal.dispatch();
        signal.remove(callback2, r);
        signal.remove(callback4);
        signal.dispatch();

        assert.equal(signal.getReceivers().length, 1);

        assert.equal(h.count, 2, 'Callback function should be called 2 time.');
        assert.equal(h2.count, 1, 'Callback2 function should be called 1 time.');
        assert.equal(h3.count, 2, 'Callback3 function should be called 2 time.');
        assert.equal(h4.count, 1, 'Callback4 function should be called 1 time.');
    });

    it('Remove all callback functions.', () => {
        let h = new Handler(),
            h2 = new Handler(),
            r = new Headlight.Receiver();

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

    it('Disables signal and enabling after some time', () => {
        let h = new Handler();

        signal.add(Handler.gc(h.callback, h));
        signal.dispatch();
        signal.disable();
        signal.dispatch();
        signal.enable();
        signal.dispatch();

        assert.equal(h.count, 2, 'Callback function should be called 2 times.');
    });

    it('Removing callback which hasn`t been added.', () => {
        let h = new Handler();
        let callback = Handler.gc(h.callback, h);
        let r = new Headlight.Receiver();


        assert.doesNotThrow(() => {
            signal.remove(callback);
            signal.remove(r);
            signal.remove(callback, r);
        }, Error, 'Removing is OK.');
    });
});


