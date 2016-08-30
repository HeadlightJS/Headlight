/// <reference path="../../typings/tsd.d.ts" />

import {utils} from '../../src/utils';


describe('utils.', () => {
    let assert = chai.assert;

    it('isString', () => {
        
        assert.equal(utils.isString(''), true);
        /* tslint:disable */
        assert.equal(utils.isString(new String('123')), true);
        /* tslint:enable */
        assert.equal(utils.isString(1), false);
        
    });
    
    it('isNumber', () => {

        assert.equal(utils.isNumber(1), true);
        /* tslint:disable */
        assert.equal(utils.isNumber(new Number(123)), true);
        /* tslint:enable */
        assert.equal(utils.isNumber('1'), false);
        
    });

    it('isArray', () => {

        assert.equal(utils.isArray([]), true);
        assert.equal(utils.isArray({}), false);

    });

    it('isNaN', () => {

        assert.equal(utils.isNaN(NaN), true);
        assert.equal(utils.isNaN(0), false);
        assert.equal(utils.isNaN({}), false);

    });
    
    it('notEmpty', () => {

        assert.equal(utils.notEmpty(0), true);
        assert.equal(utils.notEmpty(''), true);
        assert.equal(utils.notEmpty(null), false);
        assert.equal(utils.notEmpty(undefined), false);
        
    });
    
    it('isObject', () => {

        assert.equal(utils.isObject({}), true);
        assert.equal(utils.isObject([]), false);
        assert.equal(utils.isObject(1), false);
        
    });

    it('isNull', () => {

        assert.equal(utils.isNull(null), true);
        assert.equal(utils.isNull(undefined), false);

    });

    it('isUndefined', () => {

        assert.equal(utils.isUndefined(undefined), true);
        assert.equal(utils.isUndefined(null), false);

    });

    it('clone', () => {

        let object = {id: 1};
        let arr = [1];

        let cloneObject = utils.clone(object);
        let cloneArr = utils.clone(arr);

        assert.equal(utils.clone(0), 0);
        assert.equal(utils.clone('1'), '1');
        assert.equal(object === cloneObject, false);
        assert.equal(arr === cloneArr, false);
        assert.equal(utils.isArray(cloneArr), true);
        assert.equal(cloneArr[0], arr[0]);
        assert.equal(cloneObject.id, object.id);

    });

});
