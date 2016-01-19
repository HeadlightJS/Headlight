/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

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
        function checkForInstanceOfModel(collection: Headlight.ICollection<any>): void {
            for (let i = 0; i < collection.length; i++) {
                assert.instanceOf(collection[i], Headlight.Model);
                assert.instanceOf(collection[i], Person);
            }
        }
        
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
                checkForInstanceOfModel(family);
            });

            it('Concatenates with models.', () => {
                check(family, family.concat(new Person(boris), new Person(helen)));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with raw objects and models.', () => {
                check(family, family.concat(boris, new Person(helen)));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with Array\<raw object\>.', () => {
                check(family, family.concat([boris, helen]));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with Array\<Model\>.', () => {
                check(family, family.concat([new Person(boris), new Person(helen)]));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with Array\<Model | raw object\>.', () => {
                check(family, family.concat([boris, new Person(helen)]));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with Collection.', () => {
                check(family, family.concat(new Family([boris, helen])));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with Array\<raw object\> and Collection', () => {
                check(family, family.concat([boris], new Family([helen])));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with raw object and Collection', () => {
                check(family, family.concat(boris, new Family([helen])));
                checkForInstanceOfModel(family);
            });

            it('Concatenates with raw object and Array<raw object>', () => {
                check(family, family.concat(boris, [helen]));
                checkForInstanceOfModel(family);
            });
        });

        describe('#push()', () => {
            it('Pushes raw objects', () => {
                family.push(boris, helen);

                assert.deepEqual(family.toJSON(), [anna, oleg, boris, helen]);
                checkForInstanceOfModel(family);
            });

            it('Pushes models', () => {
                family.push(new Person(boris), new Person(helen));

                assert.deepEqual(family.toJSON(), [anna, oleg, boris, helen]);
                checkForInstanceOfModel(family);
            });

            it('Pushes raw objects and models', () => {
                family.push(boris, new Person(helen));

                assert.deepEqual(family.toJSON(), [anna, oleg, boris, helen]);
                checkForInstanceOfModel(family);
            });
        });

        describe('#pop()', () => {
            it('works', () => {
                let p = family.pop();

                assert.deepEqual(p.toJSON(), oleg);

                p = family.pop();

                assert.deepEqual(p.toJSON(), anna);
                assert.equal(family.length, 0);

                p = family.pop();

                assert.isUndefined(p);
            });
        });

        describe('#join()', () => {
            it('works', () => {
                const SEPARATOR = '*';


                let string = '';

                for (let i = 0; i < family.length; i++) {
                    string += JSON.stringify(family[i].toJSON());

                    if (i !== family.length - 1) {
                        string += SEPARATOR;
                    }
                }

                assert.equal(family.join(SEPARATOR), string);
            });
        });

        describe('#reverse()', () => {
            it('works', () => {
                let col = family.reverse();

                assert.equal(family, col);
                assert.deepEqual(col.toJSON(), [oleg, anna]);
            });
        });

        describe('#shift()', () => {
            it('works', () => {
                let p = family.shift();

                assert.deepEqual(p.toJSON(), anna);

                p = family.shift();

                assert.deepEqual(p.toJSON(), oleg);
                assert.equal(family.length, 0);

                p = family.pop();

                assert.isUndefined(p);
            });
        });

        describe('#slice()', () => {
            it('works', () => {
                family.push(boris, helen);

                let newCollection = family.slice(0, 2);

                assert.instanceOf(newCollection, Headlight.Collection);
                assert.deepEqual(newCollection.toJSON(), [anna, oleg]);

                newCollection = family.slice(2, 10);
                assert.deepEqual(newCollection.toJSON(), [boris, helen]);

                checkForInstanceOfModel(newCollection);
            });
        });

        describe('#sort()', () => {
            it('works', () => {
                let col = family.sort();

                assert.equal(family, col);
                assert.deepEqual(col.toJSON(), [anna, oleg]);

                family.sort((a: IPerson, b: IPerson) => {
                    return b.age - a.age;
                });

                assert.deepEqual(family.toJSON(), [oleg, anna]);
            });
        });

        describe('#splice()', () => {
            it('Removes items', () => {
                let col = family.splice(1, 1);

                assert.deepEqual(family.toJSON(), [anna]);
                assert.deepEqual(col.toJSON(), [oleg]);

                checkForInstanceOfModel(family);
                checkForInstanceOfModel(col);
            });

            it('Adds items', () => {
                let col = family.splice(1, 0, boris);

                assert.deepEqual(family.toJSON(), [anna, boris, oleg]);
                assert.equal(col.length, 0);

                checkForInstanceOfModel(family);
            });

            it('Adds and removes items', () => {
                let col = family.splice(1, 1, boris);

                assert.deepEqual(family.toJSON(), [anna, boris]);
                assert.deepEqual(col.toJSON(), [oleg]);

                checkForInstanceOfModel(family);
                checkForInstanceOfModel(col);
            });
        });

        describe('#unshift()', () => {
            it('Unshifts raw objects', () => {
                family.unshift(boris, helen);

                assert.deepEqual(family.toJSON(), [boris, helen, anna, oleg]);
                checkForInstanceOfModel(family);
            });

            it('Unshifts models', () => {
                family.unshift(new Person(boris), new Person(helen));

                assert.deepEqual(family.toJSON(), [boris, helen, anna, oleg]);
                checkForInstanceOfModel(family);
            });

            it('Unshifts raw objects and models', () => {
                family.unshift(boris, new Person(helen));

                assert.deepEqual(family.toJSON(), [boris, helen, anna, oleg]);
                checkForInstanceOfModel(family);
            });
        });



    });

});
