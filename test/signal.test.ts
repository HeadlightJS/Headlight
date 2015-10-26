/// <reference path="../typings/mocha/mocha.d.ts" />
///<reference path="../typings/chai/chai.d.ts"/>
///<reference path="../src/Signal"/>

let assert = chai.assert;

describe('Signal', () => {
    let signal:Headlight.ISignal<Function>;

    beforeEach(() => {
        signal = new Headlight.Signal();
    });

    describe('Receiving signal', () => {
        it('Adds new receiver function and dispach signal', () => {
            let count = 0,
                receiver = function ():void {
                    count++;
                };

            signal.add(receiver);
            signal.dispatch();
            signal.dispatch();

            assert.equal(count, 2, 'Receiver function should be called 2 times.');
        });

        it('Adds new receiver function for single use and dispach signal', () => {
            let count = 0,
                receiver = function ():void {
                    count++;
                };

            signal.addOnce(receiver);
            signal.dispatch();
            signal.dispatch();

            assert.equal(count, 1, 'Receiver function should be called 1 time.');
        });

        it('Adds two new receiver functions and dispach signal', () => {
            let count = 0,
                count2 = 0,
                receiver = function ():void {
                    count++;
                },
                receiver2 = function ():void {
                    count2++;
                };

            signal.add(receiver);
            signal.dispatch();
            signal.add(receiver2);
            signal.dispatch();
            signal.dispatch();

            assert.equal(count, 3, 'Receiver function should be called 3 times.');
            assert.equal(count2, 2, 'Receiver function should be called 2 times.');
        });

        it('Remove receiver function', () => {
            let count = 0,
                receiver = function ():void {
                    count++;
                };

            signal.add(receiver);
            signal.dispatch();
            signal.remove(receiver);
            signal.dispatch();

            assert.equal(count, 1, 'Receiver function should be called 1 time.');
        });

        it('Remove all receiver functions', () => {
            let count = 0,
                count2 = 0,
                receiver = function ():void {
                    count++;
                },
                receiver2 = function ():void {
                    count2++;
                };

            signal.add(receiver);
            signal.dispatch();
            signal.add(receiver2);
            signal.dispatch();
            signal.removeAll();
            signal.dispatch();

            assert.equal(count, 2, 'Receiver function should be called 2 times.');
            assert.equal(count2, 1, 'Receiver function should be called 1 time.');
        });

        it('Disables signal and enabling after some time', () => {
            let count = 0,
                receiver = function ():void {
                    count++;
                };

            signal.add(receiver);
            signal.dispatch();
            signal.disable();
            signal.dispatch();
            signal.enable();
            signal.dispatch();

            assert.equal(count, 2, 'Receiver function should be called 2 times.');
        });

    });
});


