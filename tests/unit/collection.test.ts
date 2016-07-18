/// <reference path="../../typings/tsd.d.ts" />

import {Model} from '../../src/model/Model';
import {Collection} from '../../src/collection/Collection';
import {ICollection, 
    IEventAddParam, IEventRemoveParam, IEventSortParam, IEventChangeParam} from '../../src/collection/collection.d';
import {receiverTest} from './common/receiver.methods.test';

let dProperty = Model.dProperty,
    dComputedProperty = Model.dComputedProperty;

describe('Collection.', () => {
    let assert = chai.assert;

    interface IPerson {
        id?: number;
        name: string;
        surname: string;
        age: number;

        fullname?: string;
    }

    class Person extends Model<IPerson> implements IPerson {
        public idAttribute: string = 'name';

        @dProperty()
        name: string;

        @dProperty()
        surname: string;

        @dProperty()
        age: number;

        @dComputedProperty(function (): Array<string> {
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

        constructor(args: IPerson) {
            super(args);
        }

    }

    class Family extends Collection<Person> {
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
        annaModel: Person,
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
        annaModel = new Person(anna);
        family = new Family([annaModel, oleg]);
    });

    it('Creates properly.', () => {
        assert.instanceOf(new Family(), Collection);
        assert.instanceOf(family, Array);
        assert.equal('c', family.cid[0]);
        assert.equal(family.length, 2);

        assert.throws(() => {
            family.push(new Model({}));
        });
        
        assert.equal(family.length, 2);
    });

    describe('Array methods', () => {
        function checkForInstanceOfModel(collection: ICollection<any>): void {
            for (let i = 0; i < collection.length; i++) {
                assert.instanceOf(collection[i], Model);
                assert.instanceOf(collection[i], Person);
            }
        }

        it('#toString()', () => {
            assert.deepEqual(family.toString(), '[' + JSON.stringify((new Person(anna)).toJSON()) + ','
            + JSON.stringify((new Person(oleg)).toJSON()) + ']');
        });
        
        describe('#concat()', () => {
            function check(fam: ICollection<Person>, newFamily: ICollection<Person>): void {
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
        
        describe('#has()', () => {
            it('Checks model', () => {
                assert.isTrue(family.has(family[0]));
                assert.isTrue(family.has(family[0].cid));
                
                assert.isFalse(family.has(new Person(boris)));
            });
        });
        
        describe('#add()', () => {
            it('Pushes raw objects', () => {
                family.add(boris);

                assert.deepEqual(family.toJSON(), [anna, oleg, boris]);
                checkForInstanceOfModel(family);
            });
            
            it('Pushes array of raw objects', () => {
                family.add([boris, helen]);

                assert.deepEqual(family.toJSON(), [anna, oleg, boris, helen]);
                checkForInstanceOfModel(family);
            });
            
            it('Dispatches `add` signal', () => {
                let addObject: IEventAddParam<IPerson>;

                family.on.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.add(boris);

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris]);
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
                let addObject: IEventAddParam<IPerson>;

                family.on.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.push(boris, new Person(helen));

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris, helen]);
            });
        });

        describe('#pop()', () => {
            it('works', () => {
                let p = family.pop();

                assert.deepEqual((<Model<IPerson>>p).toJSON(), oleg);

                p = family.pop();

                assert.deepEqual((<Model<IPerson>>p).toJSON(), anna);
                assert.equal(family.length, 0);

                p = family.pop();

                assert.isUndefined(p);
            });

            it('Dispatches `remove` signal', () => {
                let removeObject: IEventRemoveParam<IPerson>;

                family.on.remove({
                    callback: (args: IEventRemoveParam<IPerson>) => {
                        removeObject = args;
                    }
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.update.remove, Collection);
                assert.deepEqual(removeObject.update.remove.toJSON(), [oleg]);
            });
        });

        describe('#join()', () => {
            it('works', () => {
                const SEPARATOR = '*';


                let string = '';

                for (let i = 0; i < family.length; i++) {
                    string += JSON.stringify((<Model<IPerson>>family[i]).toJSON());

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
                let evtObject: IEventSortParam<IPerson>;

                family.on.sort({
                    callback: (args: IEventSortParam<IPerson>) => {
                        evtObject = args;
                    }
                });

                family.reverse();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.isTrue(evtObject.sort);
            });
        });

        describe('#shift()', () => {
            it('works', () => {
                let p = <Model<IPerson>>family.shift();

                assert.deepEqual(p.toJSON(), anna);

                p = <Model<IPerson>>family.shift();

                assert.deepEqual(p.toJSON(), oleg);
                assert.equal(family.length, 0);

                p = <Model<IPerson>>family.shift();

                assert.isUndefined(p);
            });

            it('Dispatches `remove` signal', () => {
                let removeObject: IEventRemoveParam<IPerson>;

                family.on.remove({
                    callback: (args: IEventRemoveParam<IPerson>) => {
                        removeObject = args;
                    }
                });

                family.shift();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.update.remove, Collection);
                assert.deepEqual(removeObject.update.remove.toJSON(), [anna]);
            });
        });

        describe('#slice()', () => {
            it('works', () => {
                family.push(boris, helen);

                let newCollection = family.slice(0, 2);

                assert.instanceOf(newCollection, Collection);
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
                let evtObject: IEventSortParam<IPerson>;

                family.on.sort({
                    callback: (args: IEventSortParam<IPerson>) => {
                        evtObject = args;
                    }
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.isTrue(evtObject.sort);
            });
        });

        describe('#splice()', () => {
            it('Removes items', () => {
                let col = family.splice(1, 1);

                assert.deepEqual(family.toJSON(), [anna]);
                assert.deepEqual(col.toJSON(), [oleg]);

                checkForInstanceOfModel(family);
                checkForInstanceOfModel(col);
                
                family.add([family[0], family[0], family[0]]);
                
                family.splice(0, 1);
                
                assert.equal(family.length, 3);
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
                let addObject: IEventAddParam<IPerson>,
                    removeObject: IEventRemoveParam<IPerson>;

                family.on.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.on.remove({
                    callback: (args: IEventRemoveParam<IPerson>) => {
                        removeObject = args;
                    }
                });

                let col = family.splice(1, 1, boris);

                assert.isObject(addObject);
                assert.isObject(removeObject);

                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris]);

                assert.equal(removeObject.collection, family);
                assert.equal(removeObject.update.remove, col);
                assert.deepEqual(removeObject.update.remove.toJSON(), [oleg]);
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
                let addObject: IEventAddParam<IPerson>;

                family.on.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.unshift(boris, new Person(helen));

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris, helen]);
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
        
        describe('#get()', () => {
            it('gets by id', () => {
                assert.equal(family.get('Anna'), annaModel);   
            });
            
            it('gets by cid', () => {
                assert.equal(family.get(annaModel.cid), annaModel);   
            });
            
            it('returns undefined if model was not found', () => {
                assert.isUndefined(family.get('dssfdf'));   
            });    
        });

    });

    describe('Dispatches signals', () => {
        describe('change', () => {
            it('on', () => {
                let evtObject: IEventChangeParam<IPerson>,
                    count = 0;

                family.on.change({
                    callback: (param: IEventChangeParam<IPerson>) => {
                        evtObject = param;
                        count++;
                    }
                });

                family[0].name = 'olo';

                let nameProp = {},
                    fullnameProp = {};
                
                nameProp[family[0].cid] = {
                    value: 'olo',
                    previous: 'Anna'
                };
                fullnameProp[family[0].cid] = {
                    value: 'olo Ivanova',
                    previous: 'Anna Ivanova'
                };
                
                let values = {
                    name: nameProp,
                    fullname: fullnameProp
                };

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.deepEqual(evtObject.change, values);

                evtObject = undefined;
                count = 0;

                family[0].name = 'aza';

                assert.isObject(evtObject);
                assert.equal(count, 1, 'Dispatching change signal should be made only once.');

                evtObject = undefined;
                count = 0;

                family.push(family[0]);

                family[0].name = 'olo';

                assert.equal(count, 1, 'Dispatching change signal should be made only once.');
            });

            it('once', () => {
                let evtObject: IEventChangeParam<IPerson>,
                    count = 0;

                family.once.change({
                    callback: (param: IEventChangeParam<IPerson>) => {
                        evtObject = param;
                        count++;
                    }
                });

                family[0].name = 'olo';

                let nameProp = {},
                    fullnameProp = {};
                
                nameProp[family[0].cid] = {
                    value: 'olo',
                    previous: 'Anna'
                };
                fullnameProp[family[0].cid] = {
                    value: 'olo Ivanova',
                    previous: 'Anna Ivanova'
                };
                
                let values = {
                    name: nameProp,
                    fullname: fullnameProp
                };

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.deepEqual(evtObject.change, values);

                evtObject = undefined;
                count = 0;

                family[0].name = 'aza';

                assert.isUndefined(evtObject);
            });

            it('Stops dispatching after removing from collection.', () => {
                let evtObject: IEventChangeParam<IPerson>,
                    m = family[0],
                    count = 0;

                family.on.change({
                    callback: (param: IEventChangeParam<IPerson>) => {
                        evtObject = param;
                        count++;
                    }
                });

                m.name = 'olo';

                assert.isObject(evtObject);
                assert.equal(count, 1);

                evtObject = undefined;

                family.shift();

                m.name = 'aza';

                assert.isUndefined(evtObject);
                assert.equal(count, 1, 'Dispatching change signal should be made only once.');
            });
            
            it ('Dispatches filtered signals.', () => {
                let evtObject: IEventChangeParam<IPerson>,
                    evtObject2: IEventChangeParam<IPerson>,
                    count = 0;

                family.on.change({
                    callback: (param: IEventChangeParam<IPerson>) => {
                        evtObject = param;
                        count++;
                    }, 
                    events: {
                        name: true
                    }  
                });
                
                family.on.change({
                    callback: Collection.filter({
                        change: {
                            surname: true
                        }
                    }, (param: IEventChangeParam<IPerson>) => {
                        evtObject2 = param;
                    })
                });
                
                let prevName = family[0].name;

                family[0].name = 'olo';
                family[0].surname = 'aaa';
                
                let nameProp = {};
                
                nameProp[family[0].cid] = {
                    value: family[0].name,
                    previous: prevName
                }; 

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.deepEqual(evtObject.change, {
                    name: nameProp
                });
                assert.equal(count, 1);
                assert.isObject(evtObject2);
                
                evtObject = undefined;

                family[0].name = 'aza';

                assert.isObject(evtObject);
            });
            
            it ('Dispatches filtered signals once.', () => {
                let evtObject: IEventChangeParam<IPerson>,
                    count = 0;

                family.once.change({
                    callback: (param: IEventChangeParam<IPerson>) => {
                        evtObject = param;
                        count++;
                    }, 
                    events: {
                        name: true
                    }  
                });

                family[0].name = 'olo';

                assert.isObject(evtObject);
                assert.equal(count, 1);
                
                evtObject = undefined;

                family[0].name = 'aza';

                assert.isUndefined(evtObject);
                assert.equal(count, 1);
            });
        });

        describe('add', () => {
            it('on', () => {
                let addObject: IEventAddParam<IPerson>;
                
                family.on.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.push(boris);

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris]);

                addObject = undefined;

                family.push(new Person(helen));

                assert.deepEqual(addObject.update.add.toJSON(), [helen]);
            });

            it('once', () => {
                let addObject: IEventAddParam<IPerson>;
                
                family.once.add({
                    callback: (args: IEventAddParam<IPerson>) => {
                        addObject = args;
                    }
                });

                family.push(boris);

                assert.isObject(addObject);
                assert.equal(addObject.collection, family);
                assert.instanceOf(addObject.update.add, Collection);
                assert.deepEqual(addObject.update.add.toJSON(), [boris]);

                addObject = undefined;

                family.push(new Person(helen));

                assert.isUndefined(addObject);
            });
        });

        describe('remove', () => {
            it('on', () => {
                let removeObject: IEventRemoveParam<IPerson>;
                
                family.on.remove({
                    callback: (args: IEventRemoveParam<IPerson>) => {
                        removeObject = args;
                    }
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.update.remove, Collection);
                assert.deepEqual(removeObject.update.remove.toJSON(), [oleg]);

                removeObject = undefined;

                family.pop();

                assert.deepEqual(removeObject.update.remove.toJSON(), [anna]);
            });

            it('once', () => {
                let removeObject: IEventRemoveParam<IPerson>;

                family.once.remove({
                    callback: (args: IEventRemoveParam<IPerson>) => {
                        removeObject = args;
                    }
                });

                family.pop();

                assert.isObject(removeObject);
                assert.equal(removeObject.collection, family);
                assert.instanceOf(removeObject.update.remove, Collection);
                assert.deepEqual(removeObject.update.remove.toJSON(), [oleg]);

                removeObject = undefined;

                family.pop();

                assert.isUndefined(removeObject);
            });
        });

        describe('sort', () => {
            it('on', () => {
                let evtObject: IEventSortParam<IPerson>;
                
                family.on.sort({
                    callback: (args: IEventSortParam<IPerson>) => {
                        evtObject = args;
                    }
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.isTrue(evtObject.sort);

                evtObject = undefined;

                family.sort();

                assert.isObject(evtObject);
            });

            it('once', () => {
                let evtObject: IEventSortParam<IPerson>;

                family.once.sort({
                    callback: (args: IEventSortParam<IPerson>) => {
                        evtObject = args;
                    }
                });

                family.sort();

                assert.isObject(evtObject);
                assert.equal(evtObject.collection, family);
                assert.isTrue(evtObject.sort);

                evtObject = undefined;

                family.sort();

                assert.isUndefined(evtObject);
            });
        });
    });
    
    describe('Transactions.', () => {
        let mainCallbackCount = 0,
            evtObj: any,
            evtObj2: any,
            evtObj3: any,
            evtObj4: any,
            evtObj5: any;
            
        
        beforeEach(() => {
            mainCallbackCount = 0;
            evtObj = undefined;
            evtObj2 = undefined;
            evtObj3 = undefined;
            evtObj4 = undefined;
            evtObj5 = undefined;
        });
        
        it('Performing transaction.', () => {
            family.on.change({
                callback: (arg: any) => {
                    mainCallbackCount++;
                    evtObj = arg;
                } 
            });
            
            family.on.update({
                callback: (arg: any) => {
                    evtObj2 = arg;
                }
                
            });
            
            family.once.update({
                callback: (arg: any) => {
                    evtObj3 = arg;
                }
                
            });
            
            family.on.any({
                callback: (arg: any) => {
                    evtObj4 = arg;
                }
            });
            
            family.once.any({
                callback: (arg: any) => {
                    evtObj5 = arg;
                }
            });
            
            family.performTransaction((col: Family) => {
                col[0].name = '1121';
                
                col.push([boris]);
                
                col.pop();
                
                col.sort();
                
                assert.equal(mainCallbackCount, 0);
            });
            
            assert.isObject(evtObj.change);
            assert.isObject(evtObj.change.name);
            assert.isObject(evtObj.change.fullname);
            assert.isTrue(evtObj.sort);
            assert.equal(mainCallbackCount, 1);
            
            evtObj = undefined;
            
            family.performTransaction((col: Family) => {
                col.push([boris]);
                
                col[0].name = 'asdasd';
            });
            
            assert.isObject(evtObj.change);
        });
        
        it('Performing silent transaction.', () => {
            family.on.change({
                callback: (arg: any) => {
                    mainCallbackCount++;
                    evtObj = arg;
                }
                
            });
            
            family.performSilentTransaction((col: any) => {
                col[0].name = '1121';
                
                assert.equal(mainCallbackCount, 0);
            });
            
            assert.equal(mainCallbackCount, 0);
        });
    });
    
    describe('Acts as Receiver', () => {
        receiverTest(Family);
    });

});
