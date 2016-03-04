/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>
///<reference path="./common/receiver.methods.test.ts"/>

describe('Receiver.', () => {
    class SimpleReceiver extends Headlight.Receiver {

    }

    let assert = chai.assert;
    let receiver = new SimpleReceiver();

    it('Creates properly', () => {
        assert.equal('r', receiver.cid[0]);
    });

    common.receiverTest(SimpleReceiver);
});
