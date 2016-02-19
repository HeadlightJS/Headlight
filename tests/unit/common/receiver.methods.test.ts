/// <reference path="../../../typings/tsd.d.ts" />
///<reference path="../../../dist/headlight.d.ts"/>

module common {
    'use strict';
    
    let assert = chai.assert;
    let receiver: Headlight.Receiver,
        count: number,
        callback = () => {
            count++;
        };

    export function receiverTest(Receiver: any): void {
        beforeEach(() => {
            receiver = new (<typeof Headlight.Receiver>Receiver)();
            count = 0;
        });

        it('Receive signal.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receive(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();
            signal.dispatch();
            signal2.dispatch();

            assert.equal(count, 3);
            assert.equal(receiver.getSignals().length, 2);
        });

        it('Receive signal once.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receiveOnce(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();
            signal.dispatch();
            signal2.dispatch();

            assert.equal(count, 2);
            assert.equal(receiver.getSignals().length, 1);
        });

        it('Stop receiving.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receive(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();
            signal2.dispatch();
            signal2.dispatch();

            assert.equal(count, 3);
            assert.equal(receiver.getSignals().length, 2);

            receiver.stopReceiving();

            signal.dispatch();
            signal2.dispatch();

            assert.equal(count, 3);
            assert.equal(receiver.getSignals().length, 0);
        });

        it('Stop receiving very signal.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receive(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();

            receiver.stopReceiving(signal);

            signal.dispatch();
            signal2.dispatch();
            signal2.dispatch();

            assert.equal(count, 3);
            assert.equal(receiver.getSignals().length, 1);
            assert.equal(receiver.getSignals()[0], signal2);
        });

        it('Stop receiving very callback.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receive(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();

            receiver.stopReceiving(callback);

            signal.dispatch();
            signal2.dispatch();

            assert.equal(count, 1);
            assert.equal(receiver.getSignals().length, 0);
        });

        it('Stop receiving very callback and very signal.', () => {
            let signal = new Headlight.Signal<void>();
            let signal2 = new Headlight.Signal<void>();

            receiver.receive(signal, callback);
            receiver.receive(signal2, callback);

            signal.dispatch();
            signal2.dispatch();

            receiver.stopReceiving(signal, callback);

            signal.dispatch();
            signal2.dispatch();

            assert.equal(count, 3);
            assert.equal(receiver.getSignals().length, 1);
            assert.equal(receiver.getSignals()[0], signal2);
        });

        it('Removing anything which hasn`t been added doesn`t throw Error.', () => {
            let signal = new Headlight.Signal<void>();

            assert.doesNotThrow(() => {
                receiver.stopReceiving(signal, callback);
                receiver.stopReceiving(callback);
                receiver.stopReceiving(signal);
            }, Error, 'Removing is OK.');
        });
    }
}

