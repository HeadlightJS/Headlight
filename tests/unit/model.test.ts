/// <reference path="../../typings/tsd.d.ts" />
///<reference path="../../dist/headlight.d.ts"/>

describe('Model.', () => {
    let assert = chai.assert;

    interface IPerson {
        name: string;
        surname: string;
        age: number;

        patronymic?: string;
        son?: IPerson;

        fullname?: string;
        nameUpperCase?: string;
    }

    type TChangePersonParam = Headlight.Model.IChangeParam<IPerson>;
    //type TChangePersonPropParam<T> = Headlight.Model.IChangePropParam<IPerson, T>;

    class Person extends Headlight.Model<IPerson> implements IPerson {
        constructor(args: IPerson) {
            super(args);
        }

        @Headlight.dProperty
        name: string;

        @Headlight.dProperty
        surname: string;

        @Headlight.dProperty
        age: number;

        @Headlight.dProperty
        patronymic: string;

        @Headlight.dProperty(Person)
        son: Person;

        @Headlight.dProperty((): Array<string> => {
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

        @Headlight.dProperty(['name'])
        get nameUpperCase(): string {
            return this.name.toUpperCase();
        }

    }

    let person: Person;

    const PERSON_NAME = 'Anna',
        PERSON_SURNAME = 'Ivanova',
        PERSON_AGE = 38,
        SON_NAME = 'Boris',
        SON_SURNAME = 'Ivanov',
        SON_AGE = 13,
        MAIN_PERSON = {
            name: PERSON_NAME,
            surname: PERSON_SURNAME,
            age: PERSON_AGE,
            son: {
                name: SON_NAME,
                surname: SON_SURNAME,
                age: SON_AGE
            }
        };

    beforeEach(() => {
        person = new Person(MAIN_PERSON);
    });

    it('Creates properly', () => {
        assert.instanceOf(person, Headlight.Receiver);
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
            assert.instanceOf(person.signals.change, Headlight.Signal);
        });

        describe('Dispatching.', () => {
            let changeObj: TChangePersonParam;

            const NEW_NAME = 'Helen';

            beforeEach(() => {
                changeObj = undefined;
            });

            function checkDispatching(): void {
                person.name = PERSON_NAME;

                assert.isUndefined(changeObj, 'Setting same value to a field should`t provoke change signal.');

                person.name = NEW_NAME;

                assert.deepEqual(changeObj, {
                    model: person,
                    values: {
                        name: person.name,
                        nameUpperCase: person.name.toUpperCase(),
                        fullname: person.name + ' ' + PERSON_SURNAME
                    },
                    previous: {
                        name: PERSON_NAME,
                        nameUpperCase: PERSON_NAME.toUpperCase(),
                        fullname: PERSON_NAME + ' ' + PERSON_SURNAME
                    }
                }, 'Setting new value to a field should provoke change signal.');
            }

            it ('Listen to signals via .on().', () => {
                person.on.change((args: TChangePersonParam): void => {
                    changeObj = args;
                });

                checkDispatching();

                person.name = PERSON_NAME;

                changeObj = undefined;

                checkDispatching();
            });

            it ('Listen to signals via .once().', () => {
                person.once.change((args: TChangePersonParam): void => {
                    changeObj = args;
                });

                checkDispatching();

                changeObj = undefined;

                person.name = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only once.');
            });

            it ('Listen to filtered signals.', () => {
                person.on.change(
                    Headlight.Model.filter<IPerson>(person.PROPS.name, (args: TChangePersonParam): void => {
                        changeObj = args;
                    })
                );

                person.surname = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
            });

            it ('Listen to filtered signals via .once().', () => {
                person.once.change(
                    Headlight.Model.filter<IPerson>(person.PROPS.name, (args: TChangePersonParam): void => {
                        changeObj = args;
                    })
                );

                person.surname = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only once for change of `name` prop.');
            });

            it ('Listen to signals via Receiver#receive().', () => {
                person.receive<TChangePersonParam>(
                    person.signals.change, (args: TChangePersonParam): void => {
                        changeObj = args;
                    });

                checkDispatching();

                person.name = PERSON_NAME;

                changeObj = undefined;

                checkDispatching();
            });

            it ('Listen to signals via Receiver#receiveOnce().', () => {
                person.receiveOnce<TChangePersonParam>(
                    person.signals.change, (args: TChangePersonParam): void => {
                        changeObj = args;
                    });


                checkDispatching();

                changeObj = undefined;

                person.name = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only once.');
            });

            it ('Listen to filtered signals via Receiver#receive().', () => {
                person.receive<TChangePersonParam>(person.signals.change,
                    Headlight.Model.filter<IPerson>(person.PROPS.name, (args: TChangePersonParam): void => {
                        changeObj = args;
                    })
                );

                person.surname = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
            });

            it ('Listen to filtered signals via Receiver#receiveOnce().', () => {
                person.receiveOnce<TChangePersonParam>(person.signals.change,
                    Headlight.Model.filter<IPerson>(person.PROPS.name, (args: TChangePersonParam): void => {
                        changeObj = args;
                    })
                );

                person.surname = PERSON_NAME;

                assert.isUndefined(changeObj, 'Handler should be called only for change of `name` prop.');
            });

        });
    });

    describe('Transactions.', () => {
        let changeObj: TChangePersonParam,
            tChangeObj: TChangePersonParam,
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
            person.on.change((args: TChangePersonParam): void => {
                changeObj = args;
                mainCallbackCount++;
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
            person.on.change((args: TChangePersonParam): void => {
                changeObj = args;
                mainCallbackCount++;
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
        assert.deepEqual(person.toJSON(), {
            name: PERSON_NAME,
            surname: PERSON_SURNAME,
            age: PERSON_AGE,
            patronymic: undefined,
            fullname: PERSON_NAME + ' ' + PERSON_SURNAME,
            nameUpperCase: PERSON_NAME.toUpperCase(),
            son: {
                name: SON_NAME,
                surname: SON_SURNAME,
                age: SON_AGE,
                patronymic: undefined,
                fullname: SON_NAME + ' ' + SON_SURNAME,
                nameUpperCase: SON_NAME.toUpperCase(),
                son: undefined
            }
        });
    });
});
