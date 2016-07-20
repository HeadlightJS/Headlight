/// <reference path="../../typings/tsd.d.ts" />

declare let process: any;
declare let Promise: any;
/* tslint:disable */
interface Promise<T> {
    then?: (resolve: (data: T) => void, reject?: (err: any) => void) => Promise<T>;
    catch?: (reject: (err: any) => void) => Promise<T>;
}
/* tslint:enable */

declare let require: (str: string) => any;

export const enum EXIT_CODES {
    OK,
    ERROR
}

let assert: any = chai.assert;

mocha.setup({ timeout: 500000 });

const C = {
    Reset: '\x1b[0m',
    Bright: '\x1b[1m',
    Dim: '\x1b[2m',
    Underscore: '\x1b[4m',
    Blink: '\x1b[5m',
    Reverse: '\x1b[7m',
    Hidden: '\x1b[8m',

    FgBlack: '\x1b[30m',
    FgRed: '\x1b[31m',
    FgGreen: '\x1b[32m',
    FgYellow: '\x1b[33m',
    FgBlue: '\x1b[34m',
    FgMagenta: '\x1b[35m',
    FgCyan: '\x1b[36m',
    FgWhite: '\x1b[37m',

    BgBlack: '\x1b[40m',
    BgRed: '\x1b[41m',
    BgGreen: '\x1b[42m',
    BgYellow: '\x1b[43m',
    BgBlue: '\x1b[44m',
    BgMagenta: '\x1b[45m',
    BgCyan: '\x1b[46m',
    BgWhite: '\x1b[47m'
};

export interface ITest {
    iterationsCount: number;
    testName: string;
    callback: () => void;
    referenceTestName: string;
    referenceCallbackOrNumber: (() => void) | number;
}

export let result: EXIT_CODES = EXIT_CODES.OK;
export let tests: Array<ITest> = [];
let testCount = 0;

module log {
    export let ok = function ok(index: number,
                                testName: string,
                                testTime: number,
                                referenceTestName: string,
                                referenceTestTime: number): void {

        let ratio = parseFloat((referenceTestTime / testTime).toFixed(2));

        let word = `${C.FgGreen}is ${C.FgCyan}${ratio}${C.FgGreen} times faster than`;

        if (ratio < 1.01) {
            word = 'equals';
        }

        /* tslint:disable */
        console.log(`${C.FgGreen}${index} of ${testCount}:\tOK\t ${testName} ${word} ${referenceTestName}: ${C.FgCyan}${testTime}${C.FgGreen} ms vs ${C.FgCyan}${referenceTestTime}${C.FgGreen} ms.${C.Reset}`);
        /* tslint:enable */
    };

    export let error = function error(index: number,
                                        testName: string,
                                        testTime: number,
                                        referenceTestName: string,
                                        referenceTestTime: number): void {

        let ratio = parseFloat((testTime / referenceTestTime).toFixed(2));

        /* tslint:disable */
        console.log(`${C.FgRed}${index} of ${testCount}:\tERROR\t ${testName} is ${C.FgYellow}${ratio}${C.FgRed} times slower than ${referenceTestName}: ${C.FgYellow}${testTime}${C.FgRed} ms vs ${C.FgYellow}${referenceTestTime}${C.FgRed} ms.${C.Reset}`);
        /* tslint:enable */
    };
}

export function test(iterationsCount: number,
                        testName: string,
                        callback: () => void,
                        referenceTestName: string,
                        referenceCallbackOrNumber: (() => void) | number): void {

    tests.push({
        iterationsCount: iterationsCount,
        testName: testName,
        callback: callback,
        referenceTestName: referenceTestName,
        referenceCallbackOrNumber: referenceCallbackOrNumber
    });

    testCount = tests.length;
}

const MEADIAN_ITERATIONS_COUNT = 21;

function getMedian(iterationsCount: number, callback: () => void): Promise<number> {
    return new Promise(function (resolve: (time: number) => void): void {
        let arr: Array<number> = [],
            j = 0;

        function iterate(): void {
            // process.stdout.write(
            //     `Testing in progress. Performing iteration ${j + 1} of ${MEADIAN_ITERATIONS_COUNT}...\r`);

            if (arr.length === MEADIAN_ITERATIONS_COUNT) {
                arr.sort();

                resolve((MEADIAN_ITERATIONS_COUNT % 2)
                    ? (arr[(MEADIAN_ITERATIONS_COUNT - 1) / 2] + arr[((MEADIAN_ITERATIONS_COUNT - 1) / 2) + 1]) / 2
                    : arr[MEADIAN_ITERATIONS_COUNT / 2]);

                return;
            }

            let timeStart: number = Date.now();

            for (let i = iterationsCount; i--;) {
                callback();
            }

            arr.push(Date.now() - timeStart);
            j++;

            setTimeout(iterate, 10);
        }

        setTimeout(iterate, 10);
    });
}

// interface IQueueItem {
//     done: Function;
//     fn: Function;
// }

let queue: Array<Function> = [];

export function start(): void {
    'use strict';
    let index = 0;

    function performTest(test: ITest): void {
        let time: number;

        index++;

        describe(`{index}`, () => {
            it(`{test.testName} vs {test.referenceTestName}`, function(done: Function): void {
                getMedian(test.iterationsCount, test.callback)
                    .then(function (res: number): Promise<number> {
                        time = res;

                        return getMedian(test.iterationsCount, <() => void>test.referenceCallbackOrNumber);
                    })
                    .then(function (timeReference: number): void {
                        

                        //process.stdout.write('                                                         \r');

                        
                        if (time <= timeReference) {
                            //log.ok(index, test.testName, time, test.referenceTestName, timeReference);
                        } else {
                            //log.error(index, test.testName, time, test.referenceTestName, timeReference);

                            result = EXIT_CODES.ERROR;
                        }

                        let nextTest: ITest = tests.shift();

                        if (nextTest) {
                            setTimeout(function (): void {
                                done();
                            }, 10);
                        } //else {
                            //process.exit(result);
                        //}
                    });
            });

            
        });

        
    }

    for (let i = 0; i < tests.length; i++) {
        let test = tests[i];

        it(`${test.testName} vs ${test.referenceTestName}`, (done: Function) => {
            let time: number;

            return getMedian(test.iterationsCount, test.callback)
                .then(function (res: number): Promise<number> {
                    time = res;

                    return getMedian(test.iterationsCount, <() => void>test.referenceCallbackOrNumber);
                })
                .then(function (timeReference: number): void {
                    console.log(`${test.testName} - ${time} vs ${test.referenceTestName} - ${timeReference}`);

                    assert.isAtMost(time , timeReference);
                    
                    done();
                })
                .catch(function (err: any): void {
                    done(err);
                });
        });

        
    }

    // setTimeout(function() {
    //     console.log(queue.length);
    // }, 1000);


    // function perform(fn: Function) {
    //     fn().then(() => {
    //         perform(queue.shift());
    //     });
    // }

    // perform(queue.shift());


    // setTimeout(function (): void {
    //     performTest(tests.shift());
    // }, 10);
};

