/// <reference path="../../../typings/tsd.d.ts" />

import {Receiver, IFunc} from '../../../src/receiver/Receiver';
import {Signal} from '../../../src/signal/Signal';
import {Person, MAIN_PERSON, IPerson} from '../Person';

let assert = chai.assert;
let receiver: Receiver,
    count: number,
    callback = () => {
        count++;
    };

export function receiverTest(Receiver: any): void {
    'use strict';

    beforeEach(() => {
        receiver = new (<typeof Receiver>Receiver)();
        count = 0;
    });

    it('Receive listen to model.', () => {

        let person = new Person(MAIN_PERSON);
        let cnt = 0;
        receiver.listen((p: IFunc<IPerson>) => p(person).name, (name: string) => {
            assert.equal(typeof name, 'string');
            cnt++;
        });

        person.name = 'Vasia';

        assert.equal(cnt, 1);

    });

    it('Receive signal.', () => {
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

        receiver.receive(signal, callback);
        receiver.receive(signal2, callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(count, 3);
        assert.equal(receiver.getSignals().length, 2);
    });

    it('Receive signal once.', () => {
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

        receiver.receiveOnce(signal, callback);
        receiver.receive(signal2, callback);

        signal.dispatch();
        signal.dispatch();
        signal2.dispatch();

        assert.equal(count, 2);
        assert.equal(receiver.getSignals().length, 1);
    });

    it('Stop receiving.', () => {
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

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
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

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
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

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
        let signal = new Signal<void>();
        let signal2 = new Signal<void>();

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
        let signal = new Signal<void>();

        assert.doesNotThrow(() => {
            receiver.stopReceiving(signal, callback);
            receiver.stopReceiving(callback);
            receiver.stopReceiving(signal);
        }, Error, 'Removing is OK.');
    });
}