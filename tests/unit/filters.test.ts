/// <reference path="../../typings/tsd.d.ts" />

import {filters} from '../../src/filters';


describe('filters.', () => {
    let assert = chai.assert;

    describe('not', () => {

        it('with processor', () => {

            let filter = filters.not((data: any) => {
                if (data === 2) {
                    return false;
                }
                return !!data;
            });

            assert.equal(filter(1), false);
            assert.equal(filter(2), true);
            assert.equal(filter(0), true);

        });

        it('without processor', () => {

            let filter = filters.not();

            assert.equal(filter(1), false);
            assert.equal(filter(2), false);
            assert.equal(filter(0), true);

        });

    });

    describe('json', () => {

        it('with options', () => {

            let replacerOk = false;
            let spaceOk = false;
            let originStringify = JSON.stringify;

            let myStringify = (value: any, replacer: any, space: any) => {
                if (replacer === null) {
                    replacerOk = true;
                }
                if (space === 4) {
                    spaceOk = true;
                }
                return originStringify.call(JSON, value, replacer, space);
            };
            JSON.stringify = <any>myStringify;

            let filter = filters.json({
                replacer: null,
                space: 4,
                noCatch: true
            });

            let result = filter({id: 1});

            assert.equal(typeof result, 'string');
            assert.equal(replacerOk, true);
            assert.equal(spaceOk, true);

            JSON.stringify = originStringify;
        });

        it('without options', () => {

            let filter = filters.json();

            let result = filter({
                toJSON: function (): any {
                    throw new Error();
                },
                toString: function (): any {
                    return '[my stringify]';
                }
            });

            assert.equal(result, '[my stringify]');

        });

    });

    describe('contains', () => {

        let testArr = [
            {
                id: 1,
                checked: false
            },
            {
                id: 2,
                checked: true
            },
            <any>4,
            <any>0,
            {
                id: 3,
                checked: false
            },
            {
                id: 4,
                checked: true
            }
        ];

        it('one key', () => {

            let filtered = testArr.filter(filters.contains({checked: true}));

            assert.equal(filtered.length, 2);
            assert.equal(filtered[0].id, 2);
            assert.equal(filtered[1].id, 4);

        });

        it('two key', () => {

            let filtered = testArr.filter(filters.contains({checked: false, id: 1}));

            assert.equal(filtered.length, 1);
            assert.equal(filtered[0].id, 1);

        });

    });

    describe('equal', () => {

        it('strict', () => {
            let filter = filters.equal(5, true);
            assert.equal(filter(5), true);
            assert.equal(filter(4), false);
            assert.equal(filter('5'), true);
        });

        it('no strict', () => {
            let filter = filters.equal(5);
            assert.equal(filter(5), true);
            assert.equal(filter(4), false);
            assert.equal(filter('5'), false);
        });

    });

    it('date', () => {

        //23.03.2016 10:57:59
        let timeStamp = 1458719879416;
        let date = new Date();
        let offset = Math.abs(date.getHours() - date.getUTCHours());
        let toLen = (data: number): number|string => {
            if (data.toString().length < 2) {
                return '0' + data;
            }
            return data;
        };

        let filter = filters.date('YYYY, YY, MM, M, DD, D, HH, H, mm, m, ss, s');
        let result = `2016, 16, 03, 3, 23, 23, ${toLen(7 + offset)}, ${7 + offset}, 57, 57, 59, 59`;

        assert.equal(filter(timeStamp), result);
        assert.equal(filter(new Date(timeStamp)), result);

        filter = filters.date('DD.MM.YYYY HH:mm:ss');
        result = `23.03.2016 ${toLen(7 + offset)}:57:59`;

        assert.equal(filter(timeStamp), result);
        assert.equal(filter(new Date(timeStamp)), result);

    });

    describe('notEmpty', () => {

        it('without options', () => {

            let filter = filters.notEmpty();

            assert.equal(filter(1), true);
            assert.equal(filter(0), false);

            let filter2 = filters.notEmpty({});

            assert.equal(filter2('1'), true);
            assert.equal(filter2(''), false);

        });

        let forTest = [
            {
                key: 'hasValue',
                trueValue: [0, ''],
                falseValue: [null, undefined]
            },
            {
                key: 'number',
                trueValue: [0, NaN],
                falseValue: [null, '', undefined]
            },
            {
                key: 'string',
                trueValue: [''],
                falseValue: [null, undefined, 0]
            },
            {
                key: 'null',
                trueValue: [null],
                falseValue: [undefined, 0, '']
            },
            {
                key: 'undefined',
                trueValue: [undefined],
                falseValue: [null, 0, '']
            },
            {
                key: 'number|string',
                trueValue: [0, ''],
                falseValue: [null, undefined]
            },
            {
                key: 'null|undefined',
                trueValue: [null, undefined],
                falseValue: [0, '']
            },
            {
                key: 'null|undefined|string',
                trueValue: [null, undefined, ''],
                falseValue: [0]
            },
            {
                key: 'null|undefined|number',
                trueValue: [null, undefined, 0],
                falseValue: ['']
            }
        ];

        forTest.forEach((testData: any) => {

            it(`${testData.key}`, () => {

                let options = {};
                let keys = testData.key.split('|');
                
                keys.forEach((key: string) => {
                    options[key] = true;
                });

                let filter = filters.notEmpty(options);
                
                testData.trueValue.push([]);
                testData.trueValue.push({});
                
                let check = (value: any, target: boolean) => {
                    assert.equal(filter(value), target);
                    /* tslint:disable */
                    if (typeof value === 'string') {
                        assert.equal(filter(new String(value)), true);
                    }
                    if (typeof value === 'number') {
                        assert.equal(filter(new Number(value)), true);
                    } 
                    /* tslint:enable */
                };
                
                testData.trueValue.forEach((value: any) => {
                    check(value, true);                                        
                });
                
                testData.falseValue.forEach((value: any) => {
                    check(value, false);
                });
                

            });

        });

    });

    describe('notEqual', () => {

        it('strict', () => {

            let filter = filters.notEqual(5);

            assert.equal(filter(5), false);
            assert.equal(filter('5'), true);
            assert.equal(filter(1), true);

        });

        it('notStrict', () => {

            let filter = filters.notEqual(5, true);

            assert.equal(filter(5), false);
            assert.equal(filter('5'), false);
            assert.equal(filter(1), true);

        });

    });

    it('notContains', () => {

        let filter = filters.notContains({
            id: 1
        });

        assert.equal(filter({id: 1}), false);
        assert.equal(filter({id: 2}), true);

    });

    it('notContains (example remove listener)', () => {

        let handler = () => {
            return 2;
        };
        let listeners = [
            {
                handler: (): any => {
                    return 1;
                },
                context: 1
            }, {
                handler: handler,
                context: 2
            }, {
                handler: (): any => {
                    return 1;
                },
                context: 3
            }
        ];

        let filter = filters.notContains({handler: handler});
        let result = listeners.filter(filter);

        assert.equal(result.length, 2);
        assert.equal(result.some((data: any) => data.handler === handler), false);

    });

});
