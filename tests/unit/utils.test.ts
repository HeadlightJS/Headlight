/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('utils.', () => {
    let assert = chai.assert;

    it('isString', () => {
        
        assert.equal(Headlight.utils.isString(''), true);
        /* tslint:disable */
        assert.equal(Headlight.utils.isString(new String('123')), true);
        /* tslint:enable */
        assert.equal(Headlight.utils.isString(1), false);
        
    });
    
    it('isNumber', () => {

        assert.equal(Headlight.utils.isNumber(1), true);
        /* tslint:disable */
        assert.equal(Headlight.utils.isNumber(new Number(123)), true);
        /* tslint:enable */
        assert.equal(Headlight.utils.isNumber('1'), false);
        
    });

    it('isArray', () => {

        assert.equal(Headlight.utils.isArray([]), true);
        assert.equal(Headlight.utils.isArray({}), false);

    });

    it('isNaN', () => {

        assert.equal(Headlight.utils.isNaN(NaN), true);
        assert.equal(Headlight.utils.isNaN(0), false);
        assert.equal(Headlight.utils.isNaN({}), false);

    });
    
    it('notEmpty', () => {

        assert.equal(Headlight.utils.notEmpty(0), true);
        assert.equal(Headlight.utils.notEmpty(''), true);
        assert.equal(Headlight.utils.notEmpty(null), false);
        assert.equal(Headlight.utils.notEmpty(undefined), false);
        
    });
    
    it('isObject', () => {

        assert.equal(Headlight.utils.isObject({}), true);
        assert.equal(Headlight.utils.isObject([]), false);
        assert.equal(Headlight.utils.isObject(1), false);
        
    });

    it('isNull', () => {

        assert.equal(Headlight.utils.isNull(null), true);
        assert.equal(Headlight.utils.isNull(undefined), false);

    });

    it('isUndefined', () => {

        assert.equal(Headlight.utils.isUndefined(undefined), true);
        assert.equal(Headlight.utils.isUndefined(null), false);

    });

    it('clone', () => {

        let object = {id: 1};
        let arr = [1];

        let cloneObject = Headlight.utils.clone(object);
        let cloneArr = Headlight.utils.clone(arr);

        assert.equal(Headlight.utils.clone(0), 0);
        assert.equal(Headlight.utils.clone('1'), '1');
        assert.equal(object === cloneObject, false);
        assert.equal(arr === cloneArr, false);
        assert.equal(Headlight.utils.isArray(cloneArr), true);
        assert.equal(cloneArr[0], arr[0]);
        assert.equal(cloneObject.id, object.id);

    });

});
