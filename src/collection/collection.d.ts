import {IHash} from '../base/base.d';
import {IReceiver} from '../receiver/receiver.d';
import {ISignal, ISignalCallback} from '../signal/signal.d';
import {IModel, TModelOrSchema} from '../model/model.d';
import {Model} from '../model/Model';

export interface ICollection<M extends IModel<any>> extends IReceiver, Array<M> {
    cid: string;
    on: ISignalListeners<typeof Model.prototype.PROPS>;
    once: ISignalListeners<typeof Model.prototype.PROPS>;
    signal: ISignal<typeof Model.prototype.PROPS>;

    toJSON(): Array<TTypeOfProps>;
    toString(): string;
    push(...items: Array<TModelOrSchema<TTypeOfProps>>): number;
    pop(): M;
    concat(...items: Array<TArrayOrCollection<TTypeOfProps>>): ICollection<M>;
    concat(...items: Array<TModelOrSchema<TTypeOfProps>>): ICollection<M>;
    join(separator?: string): string;
    reverse(): ICollection<M>;
    shift(): M;
    slice(start?: number, end?: number): ICollection<M>;
    splice(start: number, ...items: Array<number | TModelOrSchema<TTypeOfProps>>): ICollection<M>;

}

export const enum EVENTS { SORT, ADD, REMOVE, UPDATE, CHANGE, ANY}
        
export type TCollectionEvents = 'sort' | 'add' | 'remove' | 'change' | 'update' | 'any';

export type TTypeOfProps = typeof Model.prototype.PROPS;

export type TArrayOrCollection<Schema> = Array<TModelOrSchema<Schema>> | ICollection<IModel<Schema>>;

export interface IEvents {
    sort?: boolean;
    update?: boolean | {
        add?: boolean,
        remove?: boolean
    };
    change?: boolean | IHash<boolean>;
}
    
export interface IEventParam<Schema> {
    collection: ICollection<IModel<Schema>>;
}    

export interface IEventSortParam<Schema> extends IEventParam<Schema> {
    sort: boolean;
}  

export interface IEventAddParam<Schema> extends IEventParam<Schema> {
    update: {
        add?: ICollection<IModel<Schema>>;
    };
}

export interface IEventRemoveParam<Schema> extends IEventParam<Schema> {
    update: {
        remove?: ICollection<IModel<Schema>>;
    };
}

export interface IEventUpdateParam<Schema> extends  IEventParam<Schema>, 
                                                    IEventAddParam<Schema>,
                                                    IEventRemoveParam<Schema> {
    update: {
        add?: ICollection<IModel<Schema>>;
        remove?: ICollection<IModel<Schema>>;
    };
}

export type TChangeHash = IHash<IHash<{
    value: any,
    previous: any;
}>>;

export interface IEventChangeParam<Schema> extends IEventParam<Schema> {
    change: TChangeHash;
}    

export interface IEventAnyParam<Schema> {
    collection: ICollection<IModel<Schema>>;
    sort?: boolean;
    update?: {
        add?: ICollection<IModel<Schema>>;
        remove?: ICollection<IModel<Schema>>;
    };
    change?: TChangeHash;
}  

export type TSignalCallback<S> = ISignalCallback<IEventAnyParam<S>>;

export interface ISignalListenerParam<Schema> {
    callback: TSignalCallback<Schema>;
    receiver?: IReceiver;
    events?: IHash<boolean>;
}

export interface ISignalListeners<Schema> {
    change(param: ISignalListenerParam<Schema>): void;
    update(param: ISignalListenerParam<Schema>): void;        
    add(param: ISignalListenerParam<Schema>): void;
    remove(param: ISignalListenerParam<Schema>): void;
    sort(param: ISignalListenerParam<Schema>): void;
    any(param: ISignalListenerParam<Schema>): void;
}
