import {IEventAnyParam} from '../collection/collection.d';

export interface ICollectionTransactionArtifact<Schema> {
    param: IEventAnyParam<Schema>;
}

// export interface ICollectionTransactionArtifact<Schema> {
//     param: Collection.IEventAnyParam<Schema>;
// }
