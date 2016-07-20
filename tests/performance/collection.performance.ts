/// <reference path="../../typings/tsd.d.ts" />

import {IModel} from '../../src/model/model.d';
import {Model} from '../../src/model/Model';
import {Collection} from '../../src/collection/Collection';
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

class SampleCollection extends Collection<SampleModel> {
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
