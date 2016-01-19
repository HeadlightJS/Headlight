///<reference path="Base.ts"/>
///<reference path="Model.ts"/>
///<reference path="Receiver.ts"/>

module Headlight {
    'use strict';

    export interface ICollection<Schema> extends IReceiver, IBase, Array<IModel<Schema>> {
        toJSON(): Array<Schema>;

        push(...items: Array<TModelOrSchema<Schema>>): number;
        pop(): IModel<Schema>;
        concat(...items: Array<TArrayOrCollection<Schema> | TModelOrSchema<Schema>>): ICollection<Schema>;
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
            let models = [],
                newModels = Collection._convertToModels(this, items);

            for (let i = this.length; i--;) {
                models[i] = this[i];
            }

            return new SimpleCollection<Schema>(models.concat(newModels), this.model());
        }


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
