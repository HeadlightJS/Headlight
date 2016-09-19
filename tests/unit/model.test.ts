/// <reference path="../../typings/tsd.d.ts" />

import {Model} from '../../src/model/Model';
import {Person, IPerson, PERSON_NAME, PERSON_SURNAME, PERSON_AGE, SON_NAME, SON_SURNAME, SON_AGE,
    MAIN_PERSON} from './Person';
import {IEventParam, ISignalListenerParam} from '../../src/model/model.d';
import {Signal} from '../../src/signal/Signal';
import {Receiver} from '../../src/receiver/Receiver';
import {receiverTest} from './common/receiver.methods.test';

let dProperty = Model.decorators.observable,
    dComputedProperty = Model.decorators.computed;

describe('Model.', () => {
    let assert = chai.assert;

    type TEventsPersonParam = IEventParam<IPerson>;
    type TChangePersonPropParam = ISignalListenerParam<IPerson>;

    class M extends Model<{}> implements Model<{}> {
        constructor(args: {}) {
            super(args);
        }
        
        @dProperty()
        get CID(): string {
            return this.cid;
        }
    }

    let person: Person;



    beforeEach(() => {
        person = new Person(MAIN_PERSON);
    });

    it('Creates properly', () => {
        assert.instanceOf(person, Receiver);
        assert.instanceOf(person.signal, Signal);
        assert.equal('m', person.cid[0]);
    });

    describe('Fields and computeds.', () => {
        it('Inits fields with computeds.', () => {
            assert.equal(person.name, PERSON_NAME);
            assert.equal(person.surname, PERSON_SURNAME);
            assert.equal(person.age, PERSON_AGE);
            assert.equal(person.fullname, PERSON_NAME + ' ' + PERSON_SURNAME);
            assert.instanceOf(person.son, Person);
        });

        it('Change computed field.', () => {
            const NEW_NAME = 'Elena.',
                OLD_FULL_NAME = PERSON_NAME + ' ' + PERSON_SURNAME;

            person.name = NEW_NAME;

            assert.equal(person.fullname, NEW_NAME + ' ' + PERSON_SURNAME);

            person.fullname = OLD_FULL_NAME;

            assert.equal(person.name, PERSON_NAME);
            assert.equal(person.surname, PERSON_SURNAME);
        });
    });


    describe('Signals.', () => {
        it('Creating.', () => {
            assert.instanceOf(person.signal, Signal);
        });

        describe('Dispatching.', () => {
            let changeObj: TEventsPersonParam;

            const NEW_NAME = 'Helen';

            beforeEach(() => {
                changeObj = undefined;
            });

            function checkDispatching(flag?: boolean): void {
                person.name = PERSON_NAME;

                assert.isUndefined(changeObj, 'Setting same value to a field should`t provoke change signal.');

                person.name = NEW_NAME;
                
                assert.deepEqual(changeObj, {
                    model: person,
                    change: {
                        name: {
                            value: person.name,
                            previous: PERSON_NAME 
                        },
                        nameUpperCase: {
                            value: person.name.toUpperCase(),
                            previous: PERSON_NAME.toUpperCase() 
                        },
                        fullname: {
                            value: person.name + ' ' + PERSON_SURNAME,
                            previous: PERSON_NAME + ' ' + PERSON_SURNAME 
                        },
                        fullnameUpperCase: {
                            value: (person.name + ' ' + PERSON_SURNAME).toUpperCase(),
                            previous: (PERSON_NAME + ' ' + PERSON_SURNAME).toUpperCase() 
                        }
                    }
                }, 'Setting new value to a field should provoke change signal.');

                // assert.deepEqual(changeObj, {
                //     model: person,
                //     events: {
                //         change: ['fullnameUpperCase', 'fullname', 'nameUpperCase', 'name'].sort()
                //     },
                //     values: {
                //         name: person.name,
                //         nameUpperCase: person.name.toUpperCase(),
                //         fullname: person.name + ' ' + PERSON_SURNAME,
                //         fullnameUpperCase: (person.name + ' ' + PERSON_SURNAME).toUpperCase()
                //     },
                //     previous: {
                //         name: PERSON_NAME,
                //         nameUpperCase: PERSON_NAME.toUpperCase(),
                //         fullname: PERSON_NAME + ' ' + PERSON_SURNAME,
                //         fullnameUpperCase: (PERSON_NAME + ' ' + PERSON_SURNAME).toUpperCase()
                //     }
                // }, 'Setting new value to a field should provoke change signal.');
            }

            describe('Start listeting to signals.', () => {
                it ('Listen to signals via .on().', () => {
                    person.on.change({
                        callback: (args: TEventsPersonParam): void => {
                            changeObj = args;
                        }
                    });

                    checkDispatching();

                    person.name = PERSON_NAME;

                    changeObj = undefined;

                    checkDispatching();
                });

                it ('Listen to signals via .once().', () => {
                    person.once.change({
                        callback: (args: TEventsPersonParam): void => {
                            changeObj = args;
                        }
                    });

                    checkDispatching();

                    changeObj = undefined;

                    person.name = PERSON_NAME;

                    assert.isUndefined(changeObj, 'Handler should be called only once.');
                });

                it ('Listen to filtered signals.', () => {
                    let arg,
                        arg2,
                        arg3;
                        
                    person.on.change({
                        callback: (args: TEventsPersonParam): void => {
                            changeObj = args;
                        },
                        events: {
                            name: true
                        }
                    });
                    
                    person.on.change({
                        callback: (args: TEventsPersonParam): void => {
                            arg = args;
                        },
                        events: {
                            fullname: true
                        }
                    });
                    
                    person.on.change({
                        callback: (args: TEventsPersonParam): void => {
                            arg2 = args;
                        },
                        events: {
                            surname: true,
                            fullname: true
                        }
                    });
                    
                    person.on.change({
                        callback: (args: TEventsPersonParam): void => {
                            arg3 = args;
                        },
                        events: {
                            age: true,
                            fullname: true
                        }
                    });
                    
                    let prevFullname = person.fullname;
                    let prevSurname = person.surname;

                    person.surname = PERSON_NAME;
                    
                    //person.age = 123;

                    assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
                    assert.isObject(arg);
                    assert.equal(arg.model, person);
                    
                    assert.deepEqual(arg.change, {
                        fullname: {
                            value: person.fullname,
                            previous: prevFullname
                        }
                    });

                    assert.isObject(arg2);
                    assert.equal(arg2.model, person);
                    
                    assert.deepEqual(arg2.change, {
                        fullname: {
                            value: person.fullname,
                            previous: prevFullname
                        },
                        surname: {
                            value: person.surname,
                            previous: prevSurname
                        }
                    });
                    
                    assert.isObject(arg3);
                    assert.equal(arg3.model, person);
                    assert.deepEqual(arg3.change, {
                        fullname: {
                            value: person.fullname,
                            previous: prevFullname
                        }
                    });
                });

                it ('Listen to filtered signals via .once().', () => {
                    let arg,
                        arg2;

                    person.once.change({
                        callback: (args: TEventsPersonParam): void => {
                            changeObj = args;
                        },
                        events: {
                            name: true
                        }
                    });
                    
                    person.once.change({
                        callback: (args: TEventsPersonParam): void => {
                            arg = args;
                        },
                        events: {
                            fullname: true
                        }
                    });
                    
                    person.once.change({
                        callback: (args: TEventsPersonParam): void => {
                            arg2 = args;
                        },
                        events: {
                            surname: true,
                            fullname: true
                        }
                    });
                    
                    let prevFullname = person.fullname;
                    let prevSurname = person.surname;

                    person.surname = PERSON_NAME;

                    assert.isUndefined(changeObj, 'Handler should be called only once for change of `name` prop.');
                    assert.isObject(arg);
                    assert.equal(arg.model, person);
                    assert.deepEqual(arg.change, {
                        fullname: {
                            value: person.fullname,
                            previous: prevFullname
                        }
                    });

                    assert.isObject(arg2);
                    assert.equal(arg2.model, person);
                    assert.deepEqual(arg2.change, {
                        fullname: {
                            value: person.fullname,
                            previous: prevFullname
                        },
                        surname: {
                            value: person.surname,
                            previous: prevSurname
                        }
                    });
                });

                it ('Listen to signals via Receiver#receive().', () => {
                    person.receive<TEventsPersonParam>(
                        person.signal, (args: TEventsPersonParam): void => {
                            changeObj = args;
                        });

                    checkDispatching(true);

                    person.name = PERSON_NAME;

                    changeObj = undefined;

                    checkDispatching(true);
                });

                it ('Listen to signals via Receiver#receiveOnce().', () => {
                    person.receiveOnce<TEventsPersonParam>(
                        person.signal, (args: TEventsPersonParam): void => {
                            changeObj = args;
                        });


                    checkDispatching();

                    changeObj = undefined;

                    person.name = PERSON_NAME;

                    assert.isUndefined(changeObj, 'Handler should be called only once.');
                });

                it ('Listen to filtered signals via Receiver#receive().', () => {
                    person.receive<TEventsPersonParam>(person.signal,
                        Model.filter<IPerson>({change: {
                            name: true
                        }}, (args: TEventsPersonParam): void => {
                            changeObj = args;
                        })
                    );

                    person.surname = PERSON_NAME;

                    assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
                });

                it ('Listen to filtered signals via Receiver#receiveOnce().', () => {
                    person.receiveOnce<TEventsPersonParam>(person.signal,
                        Model.filter<IPerson>({change: {
                            name: true
                        }}, (args: TEventsPersonParam): void => {
                            changeObj = args;
                        })
                    );

                    person.surname = PERSON_NAME;

                    assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
                });
            });

            describe('Stop listeting to signals', () => {
                let changeObj2: TEventsPersonParam,
                    changeObj3: TEventsPersonParam,
                    changeObj4: TEventsPersonParam,
                    handler1 = (args: TEventsPersonParam): void => {
                        changeObj = args;
                    },
                    handler2 = (args: TEventsPersonParam): void => {
                        changeObj2 = args;
                    },
                    handler3 = (args: TEventsPersonParam): void => {
                        changeObj3 = args;
                    },
                    handler4 = (args: TEventsPersonParam): void => {
                        changeObj4 = args;
                    };


                beforeEach(() => {
                    changeObj2 = undefined;
                    changeObj3 = undefined;
                    changeObj4 = undefined;
                });

                it('All handlers', () => {
                    person.on.change({
                        callback: handler1
                    });
                    person.on.change({
                        callback: handler2
                    });

                    person.name = NEW_NAME;

                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);

                    person.off.change();

                    changeObj = undefined;
                    changeObj2 = undefined;

                    person.name = PERSON_NAME;

                    assert.isUndefined(changeObj);
                    assert.isUndefined(changeObj2);
                });

                it('The very handler', () => {
                    person.on.change({
                        callback: handler1
                    });
                    person.on.change({
                        callback: handler2
                    });

                    person.name = NEW_NAME;

                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);

                    person.off.change(handler2);

                    changeObj = undefined;
                    changeObj2 = undefined;

                    person.name = PERSON_NAME;

                    assert.isObject(changeObj);
                    assert.isUndefined(changeObj2);
                });

                it('Handlers of the very receiver', () => {
                    let person2 = new Person(MAIN_PERSON);
                    
                    person.on.change({
                        callback: handler1,
                        receiver: person
                    });
                    
                    person.on.change({
                        callback: handler2,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler3,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler4
                    });

                    person.name = NEW_NAME;

                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);
                    assert.isObject(changeObj3);
                    assert.isObject(changeObj4);

                    person.off.change(person2);

                    changeObj = undefined;
                    changeObj2 = undefined;
                    changeObj3 = undefined;
                    changeObj4 = undefined;

                    person.name = PERSON_NAME;

                    assert.isObject(changeObj);
                    assert.isUndefined(changeObj2);
                    assert.isUndefined(changeObj3);
                    assert.isObject(changeObj4);
                });

                it('Very Handler of the very receiver', () => {
                    let person2 = new Person(MAIN_PERSON);

                    person.on.change({
                        callback: handler1,
                        receiver: person
                    });
                    
                    person.on.change({
                        callback: handler2,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler3,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler4
                    });

                    person.name = NEW_NAME;

                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);
                    assert.isObject(changeObj3);
                    assert.isObject(changeObj4);

                    person.off.change(handler2, person2);

                    changeObj = undefined;
                    changeObj2 = undefined;
                    changeObj3 = undefined;
                    changeObj4 = undefined;

                    person.name = PERSON_NAME;

                    assert.isObject(changeObj);
                    assert.isUndefined(changeObj2);
                    assert.isObject(changeObj3);
                    assert.isObject(changeObj4);
                });

                it('Filtered handler', () => {
                    let person2 = new Person(MAIN_PERSON);

                    let count = 0,
                        newHandler = () => {
                            count++;
                        };
                        
                    person.on.change({
                        callback: handler1,
                        receiver: person
                    });
                    
                    person.on.change({
                        callback: handler2,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler3,
                        receiver: person2
                    });
                    
                    person.on.change({
                        callback: handler4
                    });    

                    person.on.change({
                        callback: Model.filter<IPerson>({change: {
                            name: true
                        }}, newHandler),
                        receiver: person
                    });
                    //person.on.change(Model.filter<IPerson>(person.PROPS.name, newHandler), person);
                    person.on.change({
                        callback: Model.filter<IPerson>({change: {
                            name: true
                        }}, newHandler),
                        receiver: person2
                    });
                    //person.on.change(Model.filter<IPerson>(person.PROPS.name, newHandler), person2);
                    person.on.change({
                        callback: handler2,
                        receiver: person2
                    });
                    //person.on.change(handler2, person2);
                    person.on.change({
                        callback: handler3,
                        receiver: person2
                    });
                    //person.on.change(handler3, person2);
                    person.on.change({
                        callback: newHandler
                    });
                    //person.on.change(newHandler);
                    person.on.change({
                        callback: Model.filter<IPerson>({change: {
                            name: true
                        }}, handler1)
                    });
                    //person.on.change(Model.filter<IPerson>(person.PROPS.name, handler1));

                    person.name = NEW_NAME;

                    assert.equal(count, 3);
                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);
                    assert.isObject(changeObj3);

                    person.off.change(newHandler);

                    count = 0;
                    changeObj = undefined;
                    changeObj2 = undefined;
                    changeObj3 = undefined;

                    person.name = PERSON_NAME;

                    assert.isObject(changeObj);
                    assert.isObject(changeObj2);
                    assert.isObject(changeObj3);
                    assert.equal(count, 0);
                });
            });

        });
    });

    describe('Transactions.', () => {
        let changeObj: TEventsPersonParam,
            tChangeObj: TEventsPersonParam,
            computedCallbackCount = 0,
            mainCallbackCount = 0;

        const NEW_NAME = 'Helen';
        const NEW_SURNAME = 'Petrova';

        beforeEach(() => {
            changeObj = undefined;
            tChangeObj = undefined;
            computedCallbackCount = 0;
            mainCallbackCount = 0;
        });

        it('Performing transaction.', () => {
            person.on.change({
                callback: (args: TEventsPersonParam): void => {
                    changeObj = args;
                    mainCallbackCount++;
                }
            });

            person.performTransaction((pers: Person) => {
                pers.name = NEW_NAME;
                pers.surname = NEW_SURNAME;

                assert.isUndefined(changeObj, 'Change handler shouldn`t be called in transaction.');

            });

            assert.isObject(changeObj, 'Prop handler should be called after transaction');
            assert.equal(mainCallbackCount, 1);
        });

        it('Performing silent transaction.', () => {
            person.on.change({
                callback: (args: TEventsPersonParam): void => {
                    changeObj = args;
                    mainCallbackCount++;
                }
            });

            person.performSilentTransaction((pers: Person) => {
                pers.name = NEW_NAME;
                pers.surname = NEW_SURNAME;

                assert.isUndefined(changeObj, 'Change handler shouldn`t be called in transaction.');

            });

            assert.isUndefined(changeObj, 'Prop handler shouldn`t be called after silent transaction');
        });
    });

    it('Get JSON.', () => {
        let child = {
            name: SON_NAME,
            surname: SON_SURNAME,
            age: SON_AGE,
            patronymic: undefined,
            fullname: SON_NAME + ' ' + SON_SURNAME,
            nameUpperCase: SON_NAME.toUpperCase(),
            fullnameUpperCase: (SON_NAME + ' ' + SON_SURNAME).toUpperCase(),
            son: undefined
        }; 

        assert.deepEqual(person.toJSON(), {
            name: PERSON_NAME,
            surname: PERSON_SURNAME,
            age: PERSON_AGE,
            patronymic: undefined,
            fullname: PERSON_NAME + ' ' + PERSON_SURNAME,
            nameUpperCase: PERSON_NAME.toUpperCase(),
            fullnameUpperCase: (PERSON_NAME + ' ' + PERSON_SURNAME).toUpperCase(),
            son: {
                name: SON_NAME,
                surname: SON_SURNAME,
                age: SON_AGE,
                patronymic: undefined,
                fullname: SON_NAME + ' ' + SON_SURNAME,
                nameUpperCase: SON_NAME.toUpperCase(),
                fullnameUpperCase: (SON_NAME + ' ' + SON_SURNAME).toUpperCase(),
                son: undefined,
                child: undefined
            },
            child: {
                name: SON_NAME,
                surname: SON_SURNAME,
                age: SON_AGE,
                patronymic: undefined,
                fullname: SON_NAME + ' ' + SON_SURNAME,
                nameUpperCase: SON_NAME.toUpperCase(),
                fullnameUpperCase: (SON_NAME + ' ' + SON_SURNAME).toUpperCase(),
                son: undefined,
                child: undefined
            }
        });
    });

    it('#keys()', () => {
        assert.deepEqual(person.keys(),
            ['name', 'surname', 'age', 'patronymic', 'son', 'child','fullname', 'nameUpperCase', 'fullnameUpperCase']);
    });

    describe('Acts as Receiver', () => {
        receiverTest(Person);
    });
});

