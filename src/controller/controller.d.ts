import {IHash, IBase} from '../base/base.d';

export interface IController extends IBase {
    remove(): void;
}

export interface IViewFunc<ViewData> {
    (data: ViewData): Element;
}