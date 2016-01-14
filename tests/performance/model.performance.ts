///<reference path="../../src/Model.ts"/>
///<reference path="performance.test.ts"/>

module Perform {
    'use strict';

    interface ISampleModel {
        propString: string;
        propString2: string;
        propNumber: number;
        propNumber2: number;
        propBoolean: boolean;
        propBoolean2: boolean;

        computedString?: string;
        computedNumber?: number;
        computedBoolean?: boolean;
    }

    class SampleModel extends Headlight.Model<ISampleModel> implements ISampleModel {
        @Headlight.dProperty
        propString: string;

        @Headlight.dProperty
        propString2: string;

        @Headlight.dProperty
        propNumber: number;

        @Headlight.dProperty
        propNumber2: number;

        @Headlight.dProperty
        propBoolean: boolean;

        @Headlight.dProperty
        propBoolean2: boolean;


        @Headlight.dProperty(['propString', 'propString2'])
        get computedString(): string {
            return this.propString + ' ' + this.propString2;
        }

        set computedString(value: string) {
            let arr = value.split(' ');

            this.propString = arr[0];
            this.propString2 = arr[1];
        }

        @Headlight.dProperty(['propNumber', 'propNumber2'])
        get computedNumber(): number {
            return this.propNumber * this.propNumber2;
        }

        @Headlight.dProperty(['propBoolean', 'propBoolean2'])
        get computedBoolean(): boolean {
            return this.propBoolean || this.propBoolean2;
        }
    }

    const ITERATION_COUNT = 100000;

    test('Creating ' + ITERATION_COUNT + ' models with computeds', () => {
        let m: SampleModel;

        for (let i = ITERATION_COUNT; i--;) {
            m = new SampleModel({
                propString: 'olo',
                propString2: 'ala',
                propNumber: 3,
                propNumber2: 4,
                propBoolean: true,
                propBoolean2: false
            });
        }
    });
}
