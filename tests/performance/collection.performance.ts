///<reference path="../../src/Model.ts"/>
///<reference path="../../src/Collection.ts"/>
///<reference path="performance.test.ts"/>

module Perform {
    'use strict';

    /* tslint:disable */
    let Backbone = require('backbone');
    /* tslint:enable */

    interface ISampleModel {
        propString: string;
        propString2: string;
        propNumber: number;
        propNumber2: number;
        propBoolean: boolean;
        propBoolean2: boolean;
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

    class SampleCollection extends Headlight.Collection<ISampleModel> {
        protected model(): typeof SampleModel {
            return SampleModel;
        }
    }

    let BackboneModel = Backbone.Model.extend({});

    let BackboneCollection = Backbone.Collection.extend({
        model: BackboneModel,
    });

    let items = [],
        models = [],
        backboneModels = [];

    for (let i = 0; i < 10; i++) {
        items.push({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        });
        models.push(new SampleModel({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        }));
        backboneModels.push(new BackboneModel({
            propString: 'olo',
            propString2: 'ala',
            propNumber: 3,
            propNumber2: 4,
            propBoolean: true,
            propBoolean2: false
        }));
    }

    test(
        1000,
        'Creating collection from objects',
        () => {
            let c: SampleCollection = new SampleCollection(items);
        },
        'Backbone',
        () => {
            let c: any = new BackboneCollection(items);
        }
    );

    test(
        1000,
        'Creating collection from models',
        () => {
            let c: SampleCollection = new SampleCollection(models);
        },
        'Backbone',
        () => {
            let c: any = new BackboneCollection(backboneModels);
        }
    );
}
