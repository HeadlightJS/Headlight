/// <reference path="../typings/tsd.d.ts" />
///<reference path="../src/Base.ts"/>
///<reference path="../src/Model.ts"/>

describe('Model.', () => {
    let assert = chai.assert;

    interface IPersonSchema {
        name: string;
        surname: string;
        age: number;

        patronymic?: string;
        partner?: IPersonSchema;

        fullname?: string;
    }

    interface IPerson extends Headlight.IModel<IPersonSchema>, IPersonSchema {
        partner?: IPerson;
    }

    class Person extends Headlight.Model<IPersonSchema> implements IPerson {
        constructor(args: IPersonSchema) {
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
        partner: IPerson;

        @Headlight.dProperty
        get fullname(): string {
            return this.name + ' ' + this.surname;
        }

        set fullname(fullname: string) {
            let arr = fullname.split(' ');

            this.name = arr[0];
            this.surname = arr[1];
        }
    }

    let person: IPerson;

    const PERSON_NAME = 'Anna',
        PERSON_SURNAME = 'Ivanova',
        PERSON_AGE = 38,
        PARTNER_NAME = 'Boris',
        PARTNER_SURNAME = 'Ivanov',
        PARTNER_AGE = 41,
        MAIN_PERSON = {
            name: PERSON_NAME,
            surname: PERSON_SURNAME,
            age: PERSON_AGE,
            partner: {
                name: PARTNER_NAME,
                surname: PARTNER_SURNAME,
                age: PARTNER_AGE
            }
        };

    beforeEach(() => {
        person = new Person(MAIN_PERSON);
    });

    describe('Fields and computeds.', () => {
        it('Inits fields with computeds.', () => {
            assert.equal(person.name, PERSON_NAME);
            assert.equal(person.surname, PERSON_SURNAME);
            assert.equal(person.age, PERSON_AGE);
            assert.equal(person.fullname, PERSON_NAME + ' ' + PERSON_SURNAME);
            assert.instanceOf(person.partner, Person);

        });

        it('Change computed field.', () => {
            const NEW_NAME = 'Elena',
                OLD_FULL_NAME = PERSON_NAME + ' ' + PERSON_SURNAME;

            person.name = NEW_NAME;

            assert.equal(person.fullname, NEW_NAME + ' ' + PERSON_SURNAME);

            person.fullname = OLD_FULL_NAME;

            assert.equal(person.name, PERSON_NAME);
            assert.equal(person.surname, PERSON_SURNAME);
        });

        it('Get JSON.', () => {
            assert.deepEqual(person.toJSON(), MAIN_PERSON);
        });
    });
});
