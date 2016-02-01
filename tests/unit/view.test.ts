/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('View.', () => {
    let expect = chai.expect;

    it('create', () => {
        let view = new Headlight.View({$placeholder: null});
        expect(view instanceof Headlight.View).to.be.true;
    });

});