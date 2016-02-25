/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>
///<reference path="./common/receiver.methods.test.ts"/>

import Model = Headlight.Model;
describe('Collection.', () => {
    let assert = chai.assert;

    interface IPerson {
        name: string;
        surname: string;
        age: number;

        fullname?: string;
    }

    class Person extends Headlight.Model<IPerson> implements Headlight.Model<IPerson>, IPerson {
        constructor(args: IPerson) {
            super(args);
        }

        @Headlight.dProperty
        name: string;

        @Headlight.dProperty
        surname: string;

        @Headlight.dProperty
        age: number;

        @Headlight.dProperty(function (): Array<string> {
            return [
                this.PROPS.name,
                this.PROPS.surname
            ];
        })
        get fullname(): string {
            return this.name + ' ' + this.surname;
        }

        set fullname(fullname: string) {
            let arr = fullname.split(' ');

            this.name = arr[0];
            this.surname = arr[1];
        }
    }

    class M extends Headlight.Model<{}> implements Headlight.Model<{}> {
        constructor(args: {}) {
            super(args);
        }
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
            age: 38,
            fullname: 'Anna Ivanova'
        },
        oleg: IPerson = {
            name: 'Oleg',
            surname: 'Ivanov',
            age: 41,
            fullname: 'Oleg Ivanov'
        },
        boris: IPerson = {
            name: 'Boris',
            surname: 'Ivanov',
            age: 13,
            fullname: 'Boris Ivanov'
        },
        helen: IPerson = {
            name: 'Helen',
            surname: 'Ivanova',
            age: 11,
            fullname: 'Helen Ivanova'
        };

    beforeEach(() => {
        family = new Family([anna, oleg]);
    });

    it('Creates properly.', () => {

        assert.instanceOf(new Family(), Headlight.Collection);
        assert.instanceOf(family, Array);
        assert.equal('c', family.cid[0]);
        assert.equal(family.length, 2);

        assert.throws(() => {
            family.push(<any>(new M({})));
        });
    });

    describe('Array methods', () => {
        function checkForInstanceOfModel(collection: Headlight.Collection<any>): void {
            for (let i = 0; i < collection.length; i++) {
                assert.instanceOf(collection[i], Headlight.Model);
                assert.instanceOf(collection[i], Person);
            }
        }

        it('#toString()', () => {
            assert.deepEqual(family.toString(), '[' + JSON.stringify((new Person(anna)).toJSON()) + ','
            + JSON.stringify((new Person(oleg)).toJSON()) + ']');
        });
        
        describe('#concat()', () => {
            function check(fam: Headlight.Collection<IPerson>, newFamily: Headlight.Collection<IPerson>): void {
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

            it('Dispatches `add` signal', () => {
                let addObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.add((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    addObject = args;
                });

                family.push(boris, new Person(helen));

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.models, Headlight.Collection);
                assert.deepEqual(addObject.models.toJSON(), [boris, helen]);
            });
        });

        describe('#pop()', () => {
            it('works', () => {
                let p = family.pop();

                assert.deepEqual((<Headlight.Model<IPerson>>p).toJSON(), oleg);

                p = family.pop();

                assert.deepEqual((<Headlight.Model<IPerson>>p).toJSON(), anna);
                assert.equal(family.length, 0);

                p = family.pop();

                assert.isUndefined(p);
            });

            it('Dispatches `remove` signal', () => {
                let removeObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.remove((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    removeObject = args;
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.models, Headlight.Collection);
                assert.deepEqual(removeObject.models.toJSON(), [oleg]);
            });
        });

        describe('#join()', () => {
            it('works', () => {
                const SEPARATOR = '*';


                let string = '';

                for (let i = 0; i < family.length; i++) {
                    string += JSON.stringify((<Headlight.Model<IPerson>>family[i]).toJSON());

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

            it('Dispatches `sort` signal', () => {
                let evtObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.sort((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    evtObject = args;
                });

                family.reverse();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
            });
        });

        describe('#shift()', () => {
            it('works', () => {
                let p = <Headlight.Model<IPerson>>family.shift();

                assert.deepEqual(p.toJSON(), anna);

                p = <Headlight.Model<IPerson>>family.shift();

                assert.deepEqual(p.toJSON(), oleg);
                assert.equal(family.length, 0);

                p = <Headlight.Model<IPerson>>family.shift();

                assert.isUndefined(p);
            });

            it('Dispatches `remove` signal', () => {
                let removeObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.remove((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    removeObject = args;
                });

                family.shift();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.models, Headlight.Collection);
                assert.deepEqual(removeObject.models.toJSON(), [anna]);
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

            it('Dispatches `sort` signal', () => {
                let evtObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.sort((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    evtObject = args;
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
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

            it('Dispatches signals', () => {
                let addObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>,
                    removeObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.add((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    addObject = args;
                });

                family.on.remove((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    removeObject = args;
                });

                let col = family.splice(1, 1, boris);

                assert.isObject(addObject);
                assert.isObject(removeObject);

                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.models, Headlight.Collection);
                assert.deepEqual(addObject.models.toJSON(), [boris]);

                assert.equal(removeObject.collection, family);
                assert.equal(removeObject.models, col);
                assert.deepEqual(removeObject.models.toJSON(), [oleg]);
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

            it('Dispatches `add` signal', () => {
                let addObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.add((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    addObject = args;
                });

                family.unshift(boris, new Person(helen));

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.models, Headlight.Collection);
                assert.deepEqual(addObject.models.toJSON(), [boris, helen]);
            });
        });

        describe('#filter()', () => {
            it('works', () => {
                let a = {};

                let col = family.filter(function (value: Person,
                                                  index: number,
                                                  collection: Family): boolean {
                    assert.equal(this, a);
                    assert.instanceOf(value, Person);
                    assert.typeOf(index, 'number');
                    assert.equal(collection, family);

                    return value.age < 40;
                }, a);

                checkForInstanceOfModel(col);

                assert.deepEqual(col.toJSON(), [anna]);
            });
        });

    });

    describe('Dispatches signals', () => {
        describe('change', () => {
            it('on', () => {
                let evtObject: Headlight.Collection.ISignalCallbackChangeParam<IPerson>,
                count = 0;

                family.on.change((param: Headlight.Collection.ISignalCallbackChangeParam<IPerson>) => {
                    evtObject = param;
                    count++;
                });

                family.on.change((param: Headlight.Collection.ISignalCallbackChangeParam<IPerson>) => {
                    return;
                });

                (<IPerson>family[0]).name = 'olo';

                let newValues = {};
                let newPrevious = {};

                newValues[(<Model<IPerson>>family[0]).cid] = {name: 'olo', fullname: 'olo Ivanova'};
                newPrevious[(<Model<IPerson>>family[0]).cid] = {name: 'Anna', fullname: 'Anna Ivanova'};

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.instanceOf(evtObject.models, Headlight.Collection);
                assert.deepEqual(evtObject.values, newValues);
                assert.deepEqual(evtObject.previous, newPrevious);

                evtObject = undefined;

                (<IPerson>family[0]).name = 'aza';

                assert.isObject(evtObject);

                evtObject = undefined;
                count = 0;

                family.push(family[0]);

                (<IPerson>family[0]).name = 'olo';

                assert.equal(count, 1, 'Dispatching change signal should be made only once.');
            });

            it('once', () => {
                let evtObject: Headlight.Collection.ISignalCallbackChangeParam<IPerson>;

                family.once.change((param: Headlight.Collection.ISignalCallbackChangeParam<IPerson>) => {
                    evtObject = param;
                });

                family.once.change((param: Headlight.Collection.ISignalCallbackChangeParam<IPerson>) => {
                    return;
                });

                (<IPerson>family[0]).name = 'olo';

                let newValues = {};
                let newPrevious = {};

                newValues[(<Model<IPerson>>family[0]).cid] = {name: 'olo', fullname: 'olo Ivanova'};
                newPrevious[(<Model<IPerson>>family[0]).cid] = {name: 'Anna', fullname: 'Anna Ivanova'};

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.instanceOf(evtObject.models, Headlight.Collection);
                assert.deepEqual(evtObject.values, newValues);
                assert.deepEqual(evtObject.previous, newPrevious);

                evtObject = undefined;

                (<IPerson>family[0]).name = 'aza';

                assert.isUndefined(evtObject);
            });

            it('Stops dispatching after removing from collection.', () => {
                let evtObject: Headlight.Collection.ISignalCallbackChangeParam<IPerson>,
                    m = <IPerson>family[0];

                family.on.change((param: Headlight.Collection.ISignalCallbackChangeParam<IPerson>) => {
                    evtObject = param;
                });

                m.name = 'olo';

                assert.isObject(evtObject);

                evtObject = undefined;

                family.shift();

                m.name = 'aza';

                assert.isUndefined(evtObject);
            });
        });

        describe('add', () => {
            it('on', () => {
                let addObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.add((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    addObject = args;
                });

                family.push(boris);

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.models, Headlight.Collection);
                assert.deepEqual(addObject.models.toJSON(), [boris]);

                addObject = undefined;

                family.push(new Person(helen));

                assert.deepEqual(addObject.models.toJSON(), [helen]);
            });

            it('once', () => {
                let addObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.once.add((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    addObject = args;
                });

                family.push(boris);

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.models, Headlight.Collection);
                assert.deepEqual(addObject.models.toJSON(), [boris]);

                addObject = undefined;

                family.push(new Person(helen));

                assert.isUndefined(addObject);
            });
        });

        describe('remove', () => {
            it('on', () => {
                let removeObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.remove((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    removeObject = args;
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.models, Headlight.Collection);
                assert.deepEqual(removeObject.models.toJSON(), [oleg]);

                removeObject = undefined;

                family.pop();

                assert.deepEqual(removeObject.models.toJSON(), [anna]);
            });

            it('once', () => {
                let removeObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.once.remove((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    removeObject = args;
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.models, Headlight.Collection);
                assert.deepEqual(removeObject.models.toJSON(), [oleg]);

                removeObject = undefined;

                family.pop();

                assert.isUndefined(removeObject);
            });
        });

        describe('sort', () => {
            it('on', () => {
                let evtObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.on.sort((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    evtObject = args;
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);

                evtObject = undefined;

                family.sort();

                assert.isObject(evtObject);
            });

            it('once', () => {
                let evtObject: Headlight.Collection.ISignalCallbackModelsParam<IPerson>;

                family.once.sort((args: Headlight.Collection.ISignalCallbackModelsParam<IPerson>) => {
                    evtObject = args;
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);

                evtObject = undefined;

                family.sort();

                assert.isUndefined(evtObject);
            });
        });
    });

    describe('Acts as Receiver', () => {
        common.receiverTest(Family);
    });

});
