///<reference path="../../src/Model.ts"/>
///<reference path="performance.test.ts"/>

declare let require: (str: string) => any;

/* tslint:disable */
let Backbone = require('backbone');
Backbone.Ribs = require('backbone.ribs');
/* tslint:enable */

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
    }

    class SampleModelWithComputeds extends Headlight.Model<ISampleModel> implements ISampleModel {
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

    let BackboneModel = Backbone.Model.extend({});

    let RibsModelWithComputeds = Backbone.Ribs.Model.extend({
        computeds: {
            computedString: {
                deps: ['propString', 'propString2'],
                get: function (propString: string, propString2: string): string {
                    return propString + ' ' + propString2;
                },
                set: function (value: any): any {
                    let arr = value.split(' ');

                    return {
                        propString: arr[0],
                        propString2: arr[1]
                    };
                }

            },

            computedNumber: {
                deps: ['propNumber', 'propNumber2'],
                get: function (propNumber: number, propNumber2: number): number {
                    return propNumber * propNumber2;
                }
            },

            computedBoolean: {
                deps: ['propBoolean', 'propBoolean2'],
                get: function (propBoolean: boolean, propBoolean2: boolean): boolean {
                    return propBoolean || propBoolean2;
                }
            }
        }
    });

    const ITERATION_COUNT = 100000;

    test(
        'Creating models without computeds',
        () => {
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
        },
        'Backbone',
        () => {
            let m: any;

            for (let i = ITERATION_COUNT; i--;) {
                m = new BackboneModel({
                    propString: 'olo',
                    propString2: 'ala',
                    propNumber: 3,
                    propNumber2: 4,
                    propBoolean: true,
                    propBoolean2: false
                });
            }
        }
    );

    test(
        'Creating models with computeds',
        () => {
            let m: SampleModelWithComputeds;

            for (let i = ITERATION_COUNT; i--;) {
                m = new SampleModelWithComputeds({
                    propString: 'olo',
                    propString2: 'ala',
                    propNumber: 3,
                    propNumber2: 4,
                    propBoolean: true,
                    propBoolean2: false
                });
            }
        },
        'Ribs',
        () => {
            let m: any;

            for (let i = ITERATION_COUNT; i--;) {
                m = new RibsModelWithComputeds({
                    propString: 'olo',
                    propString2: 'ala',
                    propNumber: 3,
                    propNumber2: 4,
                    propBoolean: true,
                    propBoolean2: false
                });
            }
        }
    );


    start();
}
