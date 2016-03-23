/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('filters.', () => {
    let assert = chai.assert;
    
    it('not with processor', () => {
        
        let filter = Headlight.filters.not((data: any) => {
            if (data === 2) {
                return false;
            }
            return !!data;
        });
        
        assert.equal(filter(1), false);
        assert.equal(filter(2), true);
        assert.equal(filter(0), true);
        
    });
    
    it('not without processor', () => {

        let filter = Headlight.filters.not();

        assert.equal(filter(1), false);
        assert.equal(filter(2), false);
        assert.equal(filter(0), true);
        
    });
    
    it('json', () => {
        
        let originStringify = JSON.stringify;
        let replacerOk = false;
        let spaceOk = false;
        
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
        
        let filter = Headlight.filters.json(null, 4);
        let result = filter({id: 1});
        
        assert.equal(typeof result, 'string');
        assert.equal(replacerOk, true);
        assert.equal(spaceOk, true);
        
        result = filter({
            toJSON: function (): any {
                throw new Error();
            },
            toString: function (): any {
                return '[my stringify]';
            }
        });
        
        assert.equal(result, '[my stringify]');
        
        JSON.stringify = originStringify;
        
    });

    it('byObject', () => {

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

        let filtered = testArr.filter(Headlight.filters.byObject({checked: true}));

        assert.equal(filtered.length, 2);
        assert.equal(filtered[0].id, 2);
        assert.equal(filtered[1].id, 4);

        filtered = testArr.filter(Headlight.filters.byObject({checked: false, id: 1}));

        assert.equal(filtered.length, 1);
        assert.equal(filtered[0].id, 1);

    });

    it('equal', () => {

        let filter = Headlight.filters.equal(5);
        assert.equal(filter(5), true);
        assert.equal(filter(4), false);

    });

    it('date', () => {

        //23.03.2016 10:57:59
        let timeStamp = 1458719879416;

        let filter = Headlight.filters.date('YYYY, YY, MM, M, DD, D, HH, H, mm, m, ss, s');
        let result = '2016, 16, 03, 3, 23, 23, 10, 10, 57, 57, 59, 59';

        assert.equal(filter(timeStamp), result);
        assert.equal(filter(new Date(timeStamp)), result);

        filter = Headlight.filters.date('DD.MM.YYYY HH:mm:ss');
        result = '23.03.2016 10:57:59';

        assert.equal(filter(timeStamp), result);
        assert.equal(filter(new Date(timeStamp)), result);

    });
    
});
