/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../src/Base.ts"/>
///<reference path="../../src/Signal.ts"/>
///<reference path="../../src/Receiver.ts"/>

describe('Receiver.', () => {
    interface ISimpleReceiver extends Headlight.IReceiver {
        count: number;
        callback(): void;
    }

    let assert = chai.assert;
    let receiver: ISimpleReceiver;

    class SimpleReceiver extends Headlight.Receiver implements ISimpleReceiver {
        public count: number = 0;

        public callback(): void {
            this.count++;
        }
    }

    beforeEach(() => {
        receiver = new SimpleReceiver();
    });

    it('Creates properly', () => {
        assert.equal('r', receiver.cid[0]);
    });

    it('Receive signal.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 2);
    });

    it('Receive signal once.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receiveOnce(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 2);
        assert.equal(receiver.getSignals().length, 1);
    });

    it('Stop receiving.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal2.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 2);

        receiver.stopReceiving();

        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 0);
    });

    it('Stop receiving very signal.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();

        receiver.stopReceiving(signal);

        signal.dispatch();
        signal2.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 1);
        assert.equal(receiver.getSignals()[0], signal2);
    });

    it('Stop receiving very callback.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();

        receiver.stopReceiving(receiver.callback);

        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 1);
        assert.equal(receiver.getSignals().length, 0);
    });

    it('Stop receiving very callback and very signal.', () => {
        let signal = new Headlight.Signal<void>();
        let signal2 = new Headlight.Signal<void>();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal2.dispatch();

        receiver.stopReceiving(signal, receiver.callback);

        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 1);
        assert.equal(receiver.getSignals()[0], signal2);
    });

    it('Removing anything which hasn`t been added doesn`t throw Error.', () => {
        let signal = new Headlight.Signal<void>();

        assert.doesNotThrow(() => {
            receiver.stopReceiving(signal, receiver.callback);
            receiver.stopReceiving(receiver.callback);
            receiver.stopReceiving(signal);
        }, Error, 'Removing is OK.');
    });
});
