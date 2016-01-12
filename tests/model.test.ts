/// <reference path="../typings/tsd.d.ts" />
///<reference path="../src/interface.d.ts"/>
///<reference path="../src/Base.ts"/>
///<reference path="../src/Model.ts"/>

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

            let props = Headlight.Model.keys(person);

            for (var i = 0; i < props.length; i++) {
                assert.instanceOf(person.signals[props[i]], Headlight.Signal);
            }
        });

        describe('Dispatching.', () => {
            let mainChangeObj: Headlight.IChangeModelFieldParam<IPerson>,
                changeObj: Headlight.IChangeModelFieldParam<IPerson>,
                computedChangeObj: Headlight.IChangeModelFieldParam<IPerson>;

            const NEW_NAME = 'Helen';

            beforeEach(() => {
                mainChangeObj = undefined;
                changeObj = undefined;
                computedChangeObj = undefined;
            });

            function checkDispatching(): void {
                person.name = PERSON_NAME;

                assert.isUndefined(mainChangeObj, 'Setting same value to a field should`t provoke change signal.');
                assert.isUndefined(changeObj, 'Setting same value to a field should`t provoke change signal.');
                assert.isUndefined(computedChangeObj,
                    'Setting same value to a dependence field should`t provoke change signal.');

                person.name = NEW_NAME;

                assert.deepEqual(mainChangeObj, {
                    model: person
                }, 'Setting new value to a field should provoke change signal.');


                assert.deepEqual(changeObj, {
                    model: person,
                    value: person.name,
                    previous: PERSON_NAME
                }, 'Setting new value to a field should provoke change signal.');

                assert.deepEqual(computedChangeObj, {
                    model: person,
                    value: person.name + ' ' + PERSON_SURNAME,
                    previous: PERSON_NAME + ' ' + PERSON_SURNAME
                }, 'Setting new value to a dependence field should provoke change signal.');
            }

            it ('Listen to signals via .on().', () => {
                person.on.change((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    mainChangeObj = args;
                });
                person.on[person.PROPS.name]((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    changeObj = args;
                });
                person.on[person.PROPS.fullname]((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    computedChangeObj = args;
                });

                checkDispatching();

                person.name = PERSON_NAME;

                mainChangeObj = undefined;
                changeObj = undefined;
                computedChangeObj = undefined;

                checkDispatching();
            });

            it ('Listen to signals via .once().', () => {
                person.once.change((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    mainChangeObj = args;
                });
                person.once[person.PROPS.name]((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    changeObj = args;
                });
                person.once[person.PROPS.fullname]((args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                    computedChangeObj = args;
                });

                checkDispatching();

                mainChangeObj = undefined;
                changeObj = undefined;
                computedChangeObj = undefined;

                person.name = PERSON_NAME;

                assert.isUndefined(mainChangeObj, 'Handler should be called only once.');
                assert.isUndefined(changeObj, 'Handler should be called only once.');
                assert.isUndefined(computedChangeObj, 'Handler should be called only once.');
            });

            it ('Listen to signals via Receiver#receive().', () => {
                person.receive<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals.change, (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        mainChangeObj = args;
                    });

                person.receive<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals[person.PROPS.name],
                    (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        changeObj = args;
                    });

                person.receive<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals[person.PROPS.fullname],
                    (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        computedChangeObj = args;
                    });

                checkDispatching();

                person.name = PERSON_NAME;

                mainChangeObj = undefined;
                changeObj = undefined;
                computedChangeObj = undefined;

                checkDispatching();
            });

            it ('Listen to signals via Receiver#receiveOnce().', () => {
                person.receiveOnce<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals.change, (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        mainChangeObj = args;
                    });

                person.receiveOnce<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals[person.PROPS.name],
                    (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        changeObj = args;
                    });

                person.receiveOnce<Headlight.IChangeModelFieldParam<IPerson>>(
                    person.signals[person.PROPS.fullname],
                    (args: Headlight.IChangeModelFieldParam<IPerson>): void => {
                        computedChangeObj = args;
                    });

                checkDispatching();

                mainChangeObj = undefined;
                changeObj = undefined;
                computedChangeObj = undefined;

                person.name = PERSON_NAME;

                assert.isUndefined(mainChangeObj, 'Handler should be called only once.');
                assert.isUndefined(changeObj, 'Handler should be called only once.');
                assert.isUndefined(computedChangeObj, 'Handler should be called only once.');
            });
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
