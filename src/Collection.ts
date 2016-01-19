///<reference path="Base.ts"/>
///<reference path="Signal.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ICollection<Schema> extends IReceiver, IBase, Array<IModel<Schema>> {
        on: Collection.ISignalListeners<Schema>;
        signals: Collection.ISignalHash<Schema>;

        length: number;
        toJSON(): Array<Schema>;
        toLocaleString(): string;
        push(...items: Array<Model.TModelOrSchema<Schema>>): number;
        pop(): IModel<Schema>;
        concat(...items: Array<Collection.TArrayOrCollection<Schema> |
            Model.TModelOrSchema<Schema>>): ICollection<Schema>;
        join(separator?: string): string;
        reverse(): ICollection<Schema>;
        shift(): IModel<Schema>;
        slice(start?: number, end?: number): ICollection<Schema>;
        sort(compareFn?: (a: Model.TModelOrSchema<Schema>,
                          b: Model.TModelOrSchema<Schema>) => number): ICollection<Schema>;
        splice(start: number): ICollection<Schema>;
        splice(start: number,
               deleteCount: number,
               ...items: Array<Model.TModelOrSchema<Schema>>): ICollection<Schema>;
        unshift(...items: Array<Model.TModelOrSchema<Schema>>): number;
        indexOf(searchElement: IModel<Schema>, fromIndex?: number): number;
        lastIndexOf(searchElement: IModel<Schema>, fromIndex?: number): number;
        every(callbackfn: (value: IModel<Schema>,
                           index: number,
                           array: Array<IModel<Schema>>) => boolean,
              thisArg?: any): boolean;
        some(callbackfn: (value: IModel<Schema>,
                          index: number,
                          array: Array<IModel<Schema>>) => boolean,
             thisArg?: any): boolean;
        forEach(callbackfn: (value: IModel<Schema>,
                             index: number,
                             array: Array<IModel<Schema>>) => void,
                thisArg?: any): void;
        map<T>(callbackfn: (value: IModel<Schema>,
                            index: number,
                            array: Array<IModel<Schema>>) => ICollection<Schema>,
               thisArg?: any): Array<T>;
        filter(callbackfn: (value: IModel<Schema>,
                            index: number,
                            collection: ICollection<Schema>) => boolean,
               thisArg?: any): ICollection<Schema>;
        reduce<T>(callbackfn: (previousValue: IModel<Schema>,
                               currentValue: IModel<Schema>,
                               currentIndex: number,
                               collection: ICollection<Schema>) => IModel<Schema>,
                  initialValue?: IModel<Schema>): T;
        reduceRight<T>(callbackfn: (previousValue: IModel<Schema>,
                                    currentValue: IModel<Schema>,
                                    currentIndex: number,
                                    collection: ICollection<Schema>) => IModel<Schema>,
                       initialValue?: IModel<Schema>): T;

        [index: number]: IModel<Schema>;
    }

    export abstract class Collection<Schema> extends Array<IModel<Schema>> implements ICollection<Schema> {
        public cid: string;
        public on: Collection.ISignalListeners<Schema>;
        public signals: Collection.ISignalHash<Schema>;

        constructor(items: Array<IModel<Schema>> | Array<Schema>) {
            super();

            this.cid = Base.generateCid(this.cidPrefix());
            this._initItems(items);
        }

        public toJSON(): Array<Schema> {
            return Array.prototype.map.call(this, (model: IModel<Schema>) => {
                return model.toJSON();
            });
        }

        public toString(): string {
            return JSON.stringify(this.toJSON());
        }

        public push(...items: Array<Model.TModelOrSchema<Schema>>): number {
            Array.prototype.push.apply(this, Collection._convertToModels(this, items));

            //todo Signals!


            return this.length;
        }

        public pop(): IModel<Schema> {
            //todo Signals!

            return Array.prototype.pop.call(this);
        }

        public concat(...items: Array<Collection.TArrayOrCollection<Schema> |
            Model.TModelOrSchema<Schema>>): ICollection<Schema> {
            //todo Signals!

            let models = [],
                newModels = Collection._convertToModels(this, items);

            for (let i = this.length; i--;) {
                models[i] = this[i];
            }

            return new Collection.SimpleCollection<Schema>(models.concat(newModels), this.model());
        }

        public join(separator?: string): string {
            //todo Signals!

            let string = '';

            for (let i = 0; i < this.length; i++) {
                string += JSON.stringify(this[i].toJSON());

                if (i !== this.length - 1) {
                    string += separator;
                }
            }

            return string;
        }

        public reverse(): ICollection<Schema> {
            //todo Signals!

            return Array.prototype.reverse.call(this);
        }

        public shift(): IModel<Schema> {
            //todo Signals!

            return Array.prototype.shift.call(this);
        }

        public slice(start?: number, end?: number): ICollection<Schema> {
            //todo Signals!

            return new Collection.SimpleCollection<Schema>(Array.prototype.slice.call(this, start, end), this.model());
        }

        public sort(compareFn?: (a: Model.TModelOrSchema<Schema>,
                                 b: Model.TModelOrSchema<Schema>) => number): ICollection<Schema> {
            //todo Signals!

            return Array.prototype.sort.call(this, compareFn);
        };

        public splice(start: number,
                      ...items: Array<number | Model.TModelOrSchema<Schema>>): ICollection<Schema> {
            // todo Signals

            return new Collection.SimpleCollection<Schema>(Array.prototype.splice.apply(this,
                [start, items.shift()].concat(Collection._convertToModels(this, items))
            ), this.model());
        };

        public unshift(...items: Array<Model.TModelOrSchema<Schema>>): number {
            Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

            //todo Signals!

            return this.length;
        };

        public filter(callbackfn: (value: IModel<Schema>,
                                   index: number,
                                   collection: ICollection<Schema>) => boolean,
                      thisArg?: any): ICollection<Schema> {

            return new Collection.SimpleCollection<Schema>(
                Array.prototype.filter.call(this, callbackfn, thisArg),
                this.model()
            );
        };




        public receive<CallbackParam>(signal: ISignal<CallbackParam>,
                                      callback: Signal.ISignalCallback<CallbackParam>): IReceiver {
            return Receiver.prototype.receive.call(this, signal, callback);
        }

        public receiveOnce<CallbackParam>(signal: ISignal<CallbackParam>,
                                          callback: Signal.ISignalCallback<CallbackParam>): IReceiver {
            return Receiver.prototype.receiveOnce.call(this, signal, callback);
        }

        public stopReceiving<CallbackParam>(signalOrCallback?: ISignal<CallbackParam> |
            Signal.ISignalCallback<CallbackParam>,
                                            callback?: Signal.ISignalCallback<CallbackParam>): IReceiver {

            return Receiver.prototype.stopReceiving.call(this, signalOrCallback, callback);
        }

        public addSignal(signal: ISignal<any>): IReceiver {
            return Receiver.prototype.addSignal.call(this, signal);
        }

        public removeSignal(signal: ISignal<any>): IReceiver {
            return Receiver.prototype.removeSignal.call(this, signal);
        }

        public hasSignal(signal: ISignal<any>): boolean {
            return Receiver.prototype.hasSignal.call(this, signal);
        }

        public getSignals(): Array<ISignal<any>> {
            return Receiver.prototype.getSignals.call(this);
        }

        protected cidPrefix(): string {
            return 'c';
        }

        protected abstract model(): typeof Model;

        private _initItems(items: Array<IModel<Schema>> | Array<Schema>): void {
            this.push.apply(this, items);
        }

        private static _convertToModels(collection: Collection<any>,
                                        items: Array<IModel<any> | any>): Array<IModel<any>> {

            let Model = collection.model(),
                models: Array<IModel<any>> = [];

            function add(item: IModel<any> | any): void {
                if (!(item instanceof Model)) {
                    if (item instanceof Headlight.Model) {
                        throw new Error('');
                    } else {
                        models.unshift(new (<any>Model)(item));
                    }
                } else {
                    models.unshift(item);
                }
            }

            for (let i = items.length; i--;) {
                let item = items[i];

                if (Array.isArray(item) || item instanceof Collection) {
                    for (let j = item.length; j--;) {
                        add(item[j]);
                    }
                } else {
                    add(item);
                }


            }

            return models;
        }
    }

    export module Collection {
        export type TArrayOrCollection<Schema> = Array<Model.TModelOrSchema<Schema>> | ICollection<Schema>;

        /*export interface ISignalHash<Schema> {
         change: Model.TSignalOnChangeModel<Schema>;
         [signalCid: string]: Model.TSignalOnChangeModelAnyProp<Schema>;
         }*/

        export interface ISignalHash<Schema> {
        }

        export interface ISignalListeners<Schema> {
            change(callback: ISignalCallbackChangeModelArgs<Schema>,
                   receiver?: IReceiver): void;
            add(callback: ISignalCallbackChangeModelArgs<Schema>, receiver?: IReceiver): void;
            remove(callback: ISignalCallbackChangeModelArgs<Schema>, receiver?: IReceiver): void;
            sort(callback: ISignalCallbackArgs<Schema>, receiver?: IReceiver): void;
            [key: string]: (callback: ISignalCallbackChangeModelPropArgs<Schema, any>,
                            receiver?: IReceiver) => void;
        }

        export interface ISignalCallbackArgs<Schema> {
            collection: ICollection<Schema>;
        };

        export interface ISignalCallbackChangeModelArgs<Schema> extends Model.IChangeModelParam<Schema>, ISignalCallbackArgs<Schema> {
        }
        ;

        export interface ISignalCallbackChangeModelPropArgs<Schema, T> extends Model.IChangeModelPropParam<Schema, T>, ISignalCallbackArgs<Schema> {
        }
        ;

        export class SimpleCollection<Schema> extends Collection<Schema> implements ICollection<Schema> {
            private _M: typeof Model;

            constructor(items: Array<IModel<Schema>> | Array<Schema>, M: typeof Model) {
                super(this._initProps(items, M));
            }

            protected model(): typeof Model {
                return this._M;
            };

            private _initProps(items: Array<IModel<Schema>> | Array<Schema>,
                               M: typeof Model): Array<IModel<Schema>> | Array<Schema> {

                this._M = M;

                return items;
            }
        }
    }
}
