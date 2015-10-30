/// <reference path="../typings/tsd.d.ts" />
///<reference path="../src/Base.ts"/>
///<reference path="../src/Signal.ts"/>
///<reference path="../src/Receiver.ts"/>

describe('Receiver.', () => {
    interface ISimpleReceiver extends Headlight.IReceiver {
        count: number;
        callback(): ISimpleReceiver;
    }

    let assert = chai.assert;
    let receiver: ISimpleReceiver;

    class SimpleReceiver extends Headlight.Receiver implements ISimpleReceiver {
        public count: number = 0;

        public callback(): ISimpleReceiver {
            this.count++;

            return this;
        }
    }

    beforeEach(() => {
        receiver = new SimpleReceiver();
    });

    it('Receive signal.', () => {
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

        receiver.receive(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 3);
        assert.equal(receiver.getSignals().length, 2);
    });

    it('Receive signal once.', () => {
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

        receiver.receiveOnce(signal, receiver.callback);
        receiver.receive(signal2, receiver.callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(receiver.count, 2);
        assert.equal(receiver.getSignals().length, 1);
    });

    it('Stop receiving.', () => {
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

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
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

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
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

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
        let signal = new Headlight.Signal();
        let signal2 = new Headlight.Signal();

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
});
