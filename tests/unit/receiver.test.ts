/// <reference path="../../typings/tsd.d.ts" />

import {Receiver} from '../../src/receiver/Receiver';
import {receiverTest} from './common/receiver.methods.test';

describe('Receiver.', () => {
    class SimpleReceiver extends Receiver {

    }

    let assert = chai.assert;
    let receiver = new SimpleReceiver();

    it('Creates properly', () => {
        assert.equal('r', receiver.cid[0]);
    });

    receiverTest(SimpleReceiver);
});
