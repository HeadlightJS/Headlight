/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

import Collection = Headlight.Collection;
describe('Collection.', () => {
    let assert = chai.assert;

    interface IPerson {
        name: string;
        surname: string;
        age: number;
    }

    class Person extends Headlight.Model<IPerson> implements Headlight.IModel<IPerson>, IPerson {
        constructor(args: IPerson) {
            super(args);
        }

        @Headlight.dProperty
        name: string;

        @Headlight.dProperty
        surname: string;

        @Headlight.dProperty
        age: number;
    }

    class Family extends Headlight.Collection<IPerson> {
        protected model(): typeof Person {
            return Person;
        }
    }

    let family: Family,
        anna: IPerson = {
            name: 'Anna',
            surname: 'Ivanova',
            age: 38
        },
        oleg: IPerson = {
            name: 'Oleg',
            surname: 'Ivanov',
            age: 41
        },
        boris: IPerson = {
            name: 'Boris',
            surname: 'Ivanov',
            age: 13
        },
        helen: IPerson = {
            name: 'Helen',
            surname: 'Ivanova',
            age: 11
        };

    beforeEach(() => {
        family = new Family([anna, oleg]);
    });

    it('Creates properly.', () => {
        assert.instanceOf(family, Array);
        assert.equal('c', family.cid[0]);
        assert.equal(family.length, 2);
    });

    describe('Array methods', () => {
        describe('#concat()', () => {
            function check(fam: Headlight.ICollection<IPerson>, newFamily: Headlight.ICollection<IPerson>): void {
                assert.notEqual(fam, newFamily);

                assert.equal(fam.length, 2);
                assert.equal(newFamily.length, 4);

                let newFamilyJSON = newFamily.toJSON();

                assert.deepEqual(newFamilyJSON, [anna, oleg, boris, helen]);
            }

            it('Concatenates with raw objects.', () => {
                check(family, family.concat(boris, helen));
            });

            it('Concatenates with models.', () => {
                check(family, family.concat(new Person(boris), new Person(helen)));
            });

            it('Concatenates with raw objects and models.', () => {
                check(family, family.concat(boris, new Person(helen)));
            });

            it('Concatenates with Array\<raw object\>.', () => {
                check(family, family.concat([boris, helen]));
            });

            it('Concatenates with Array\<Model\>.', () => {
                check(family, family.concat([new Person(boris), new Person(helen)]));
            });

            it('Concatenates with Array\<Model | raw object\>.', () => {
                check(family, family.concat([boris, new Person(helen)]));
            });

            it('Concatenates with Collection.', () => {
                check(family, family.concat(new Family([boris, helen])));
            });

            it('Concatenates with Array\<raw object\> and Collection', () => {
                check(family, family.concat([boris], new Family([helen])));
            });

            it('Concatenates with raw object and Collection', () => {
                check(family, family.concat(boris, new Family([helen])));
            });

            it('Concatenates with raw object and Array<raw object>', () => {
                check(family, family.concat(boris, [helen]));
            });
        });
    });

});
