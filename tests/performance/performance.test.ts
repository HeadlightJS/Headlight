declare let require: Function;
declare let __dirname: string;

/* tslint:disable */
let fs = require('fs'),
    refs = JSON.parse(fs.readFileSync(__dirname + '/reference.json'));
/* tslint:enable */

module Perform {
    'use strict';

    export function test(testName: string,
                         callback: () => void): number {
        let timeStart: number = Date.now(),
            time: number;

        callback();

        time = Date.now() - timeStart;

        if ((!refs[testName]) || (time <= (refs[testName] * 1.1))) {
            console.log('OK. ', testName + ':', time, 'ms' , '<=', refs[testName] * 1.1, 'ms');

            return 0;
        }

        console.error('WRN!',testName + ':', time, 'ms', '>', refs[testName] * 1.1, 'ms');

        return 1;
    }
}
