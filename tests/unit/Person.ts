import {Model} from '../../src/model/Model';

let dProperty = Model.decorators.observable,
    dComputedProperty = Model.decorators.computed;

export const PERSON_NAME = 'Anna',
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
        },
        child: {
            name: SON_NAME,
            surname: SON_SURNAME,
            age: SON_AGE
        }
    };

export interface IPerson {
    name: string;
    surname: string;
    age: number;

    patronymic?: string;

    son?: IPerson;
    child?: IPerson;

    fullname?: string;
    nameUpperCase?: string;
}

export class Person extends Model<IPerson> implements IPerson {
    @dProperty()
    name: string;

    @dProperty()
    surname: string;

    @dProperty()
    age: number;

    @dProperty()
    patronymic: string;

    @dProperty(function(): typeof Person {
        return Person;
    })
    son: Person;

    @dProperty(Person)
    child: Person;

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

    @dComputedProperty(['name'])
    get nameUpperCase(): string {
        return this.name.toUpperCase();
    }

    @dComputedProperty(['fullname'])
    get fullnameUpperCase(): string {
        return this.fullname.toUpperCase();
    }

    constructor(args: IPerson) {
        super(args);
    }
}