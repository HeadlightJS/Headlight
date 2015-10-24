///<reference path="Signal.ts"/>

module Headlight {
    'use strict';

    type TReturningFunc<T> = (...args: Array<any>) => T;
    type TSetFunc = (...args: Array<any>) => void;

    class Computed<T> {
        public get: TReturningFunc<T>;
        public set: TSetFunc;

        constructor(getFn: TReturningFunc<T>, setFn?: TSetFunc) {
            this.get = getFn;
            this.set = setFn;
        }
    }

    export type TComputed<T> = T | Computed<T>; //TReturningFunc<T>;


    abstract class Model<Schema> {
        public fields: Schema;

        public static computed<T>(getFn: TReturningFunc<T>, setFn?: TSetFunc): Computed<T> {
            return new Computed(getFn, setFn);
        }

        public static isComputed(thing: any): boolean {
            return thing instanceof Computed;
        }

        constructor() {
            this.initFields();
        }

        protected abstract attributes(): Schema;

        private initFields(): void {
            let attributes = <any>this.attributes(),
                fields: any = {},
                self = this;

            for (var fieldName in attributes) {
                if (attributes.hasOwnProperty(fieldName)) {
                    if (Model.isComputed(attributes[fieldName])) {
                        Object.defineProperty(fields, fieldName, {
                            get: attributes[fieldName].get.bind(self, fields),
                            set: (value: any): void => {
                                attributes[fieldName].set.call(self, value, attributes);
                            }
                        });
                    } else {
                        fields[fieldName] = attributes[fieldName];
                    }
                }
            }

            this.fields = fields;
        }

    }

    type TSchema = {
        a: number;
        b: number;
        c: TComputed<number>;
        d: number;
    }

    class M extends Model<TSchema> {
        protected attributes(): TSchema {
            return {
                a: 1,
                b: 2,
                c: Model.computed(
                    (attributes: TSchema) => attributes.a * attributes.b,
                    (value: number, attributes: TSchema) => {
                        attributes.a = value / 2;
                    }),
                d: 4
            };
        }
    }

    export let m = new M();

}
