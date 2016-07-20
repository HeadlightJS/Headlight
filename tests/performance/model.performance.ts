/// <reference path="../../typings/tsd.d.ts" />

import {Model} from '../../src/model/Model';
import {test} from './performance';

let dProperty = Model.dProperty,
    dComputedProperty = Model.dComputedProperty;

declare let Backbone: any;

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

class SampleModel extends Model<ISampleModel> implements ISampleModel {
    @dProperty()
    propString: string;

    @dProperty()
    propString2: string;

    @dProperty()
    propNumber: number;

    @dProperty()
    propNumber2: number;

    @dProperty()
    propBoolean: boolean;

    @dProperty()
    propBoolean2: boolean;
}

class SampleModelWithComputeds extends Model<ISampleModel> implements ISampleModel {
    @dProperty()
    propString: string;

    @dProperty()
    propString2: string;

    @dProperty()
    propNumber: number;

    @dProperty()
    propNumber2: number;

    @dProperty()
    propBoolean: boolean;

    @dProperty()
    propBoolean2: boolean;


    @dComputedProperty(['propString', 'propString2'])
    get computedString(): string {
        return this.propString + ' ' + this.propString2;
    }

    set computedString(value: string) {
        let arr = value.split(' ');

        this.propString = arr[0];
        this.propString2 = arr[1];
    }

    @dComputedProperty(['propNumber', 'propNumber2'])
    get computedNumber(): number {
        return this.propNumber * this.propNumber2;
    }

    @dComputedProperty(['propBoolean', 'propBoolean2'])
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

test(
    10000,
    'Creating models without computeds',
    () => {
        let m: SampleModel = new SampleModel({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        });
    },
    'Backbone',
    () => {
        let m: any = new BackboneModel({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        });
    }
);

test(
    10000,
    'Creating models with computeds',
    () => {
        let m: SampleModelWithComputeds = new SampleModelWithComputeds({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        });
    },
    'Ribs',
    () => {
        let m: any = new RibsModelWithComputeds({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        });
    }
);
