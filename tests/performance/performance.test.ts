///<reference path="../../src/Base.ts"/>

declare let process: any;

module Perform {
    'use strict';

    export const enum EXIT_CODES {
        OK,
        ERROR
    }

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
        testName: string;
        callback: () => void;
        referenceTestName: string;
        referenceCallbackOrNumber: (() => void) | number;
    }

    export let result: EXIT_CODES = EXIT_CODES.OK;
    export let tests: Array<ITest> = [];

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
            console.log(`${C.FgGreen}${index} of ${tests.length}:\tOK\t ${testName} ${word} ${referenceTestName}: ${C.FgCyan}${testTime}${C.FgGreen} ms vs ${C.FgCyan}${referenceTestTime}${C.FgGreen} ms.${C.Reset}`);
            /* tslint:enable */
        };

        export let error = function error(index: number,
                                          testName: string,
                                          testTime: number,
                                          referenceTestName: string,
                                          referenceTestTime: number): void {

            let ratio = parseFloat((testTime / referenceTestTime).toFixed(2));

            /* tslint:disable */
            console.log(`${C.FgRed}${index} of ${tests.length}:\tERROR\t ${testName} is ${C.FgYellow}${ratio}${C.FgRed} times slower than ${referenceTestName}: ${C.FgYellow}${testTime}${C.FgRed} ms vs ${C.FgYellow}${referenceTestTime}${C.FgRed} ms.${C.Reset}`);
            /* tslint:enable */
        };
    }

    export function test(testName: string,
                         callback: () => void,
                         referenceTestName: string,
                         referenceCallbackOrNumber: (() => void) | number): void {

        tests.push({
            testName: testName,
            callback: callback,
            referenceTestName: referenceTestName,
            referenceCallbackOrNumber: referenceCallbackOrNumber
        });
    }

    export function start(): void {
        for (let i = 0; i < tests.length; i++) {
            let test = tests[i],
                index = i + 1,
                timeStart: number = Date.now(),
                time: number,
                timeReference: number = <number>test.referenceCallbackOrNumber;

            test.callback();

            time = Date.now() - timeStart;

            if (typeof test.referenceCallbackOrNumber === Headlight.BASE_TYPES.FUNCTION) {
                timeStart = Date.now();

                (<() => void>test.referenceCallbackOrNumber)();

                timeReference = Date.now() - timeStart;
            }

            if (time <= timeReference) {
                log.ok(index, test.testName, time, test.referenceTestName, timeReference);
            } else {
                log.error(index, test.testName, time, test.referenceTestName, timeReference);

                result = EXIT_CODES.ERROR;
            }
        }

        process.exit(result);
    };
}
