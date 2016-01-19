///<reference path="Base.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ICollection<Schema> extends IReceiver, IBase, Array<IModel<Schema>> {
        length: number;
        toJSON(): Array<Schema>;
        toLocaleString(): string;
        push(...items: Array<TModelOrSchema<Schema>>): number;
        pop(): IModel<Schema>;
        concat(...items: Array<TArrayOrCollection<Schema> | TModelOrSchema<Schema>>): ICollection<Schema>;
        join(separator?: string): string;
        reverse(): ICollection<Schema>;
        shift(): IModel<Schema>;
        slice(start?: number, end?: number): ICollection<Schema>;
        sort(compareFn?: (a: IModel<Schema>, b: IModel<Schema>) => number): ICollection<Schema>;
        splice(start: number): ICollection<Schema>;
        splice(start: number,
               deleteCount: number,
               ...items: Array<TModelOrSchema<Schema>>): ICollection<Schema>;
        unshift(...items: Array<TModelOrSchema<Schema>>): number;
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
        /*



         reduce(callbackfn: (previousValue: IModel<Schema>,
         currentValue: IModel<Schema>,
         currentIndex: number,
         array: Array<IModel<Schema>>) => IModel<Schema>,
         initialValue?: IModel<Schema>): IModel<Schema>;
         reduceRight(callbackfn: (previousValue: IModel<Schema>,
         currentValue: IModel<Schema>,
         currentIndex: number,
         array: Array<IModel<Schema>>) => IModel<Schema>,
         initialValue?: IModel<Schema>): IModel<Schema>;*/
        [index: number]: IModel<Schema>;
    }

    export type TModelOrSchema<Schema> = IModel<Schema> | Schema;
    export type TArrayOrCollection<Schema> = Array<TModelOrSchema<Schema>> | ICollection<Schema>;

    export interface ICollectionModelSignalsListener<Schema> extends IModelSignalListeners<Schema> {
        add(callback: TSignalCallbackOnChangeModel<Schema>, receiver?: IReceiver): void;
        remove(callback: TSignalCallbackOnChangeModel<Schema>, receiver?: IReceiver): void;
    }

    export abstract class Collection<Schema> extends Array<IModel<Schema>> implements ICollection<Schema> {
        public cid: string;
        public on: ICollectionModelSignalsListener<Schema>;

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

        public push(...items: Array<TModelOrSchema<Schema>>): number {
            Array.prototype.push.apply(this, Collection._convertToModels(this, items));

            //todo Signals!

            return this.length;
        }

        public pop(): IModel<Schema> {
            //todo Signals!

            return Array.prototype.pop.call(this);
        }

        public concat(...items: Array<TArrayOrCollection<Schema> | TModelOrSchema<Schema>>): ICollection<Schema> {
            //todo Signals!

            let models = [],
                newModels = Collection._convertToModels(this, items);

            for (let i = this.length; i--;) {
                models[i] = this[i];
            }

            return new SimpleCollection<Schema>(models.concat(newModels), this.model());
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

            return new SimpleCollection<Schema>(Array.prototype.slice.call(this, start, end), this.model());
        }

        public sort(compareFn?: (a: TModelOrSchema<Schema>, b: TModelOrSchema<Schema>) => number): ICollection<Schema> {
            //todo Signals!

            return Array.prototype.sort.call(this, compareFn);
        };

        public splice(start: number,
                      ...items: Array<number | TModelOrSchema<Schema>>): ICollection<Schema> {
            // todo Signals

            return new SimpleCollection<Schema>(Array.prototype.splice.apply(this,
                [start, items.shift()].concat(Collection._convertToModels(this, items))
            ), this.model());
        };

        public unshift(...items: Array<TModelOrSchema<Schema>>): number {
            Array.prototype.unshift.apply(this, Collection._convertToModels(this, items));

            //todo Signals!

            return this.length;
        };

        public filter(callbackfn: (value: IModel<Schema>,
                                   index: number,
                                   collection: ICollection<Schema>) => boolean,
                      thisArg?: any): ICollection<Schema> {

            return new SimpleCollection<Schema>(
                Array.prototype.filter.call(this, callbackfn, thisArg),
                this.model()
            );
        };

        /*


         reduce(callbackfn: (previousValue: IModel<Schema>,
         currentValue: IModel<Schema>,
         currentIndex: number,
         array: Array<IModel<Schema>>) => IModel<Schema>,
         initialValue?: IModel<Schema>): IModel<Schema>;
         reduceRight(callbackfn: (previousValue: IModel<Schema>,
         currentValue: IModel<Schema>,
         currentIndex: number,
         array: Array<IModel<Schema>>) => IModel<Schema>,
         initialValue?: IModel<Schema>): IModel<Schema>;*/







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

    class SimpleCollection<Schema> extends Collection<Schema> implements ICollection<Schema> {
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
