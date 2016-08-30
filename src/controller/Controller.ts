import {IHash, IBase} from '../base/base.d';
import {Base} from '../base/Base';

export abstract class Controller<Options, ViewData, ChildrenHash extends IHash<IController>>
extends Base implements IController {

    protected view: IViewFunc<ViewData>;
    protected options: Options;
    protected el: Element;
    protected abstract children: ChildrenHash;


    constructor(options: Options) {
        super();
        this.options = options;
        if (this.view) {
            this.el = this.view(this.getViewData());
        }
    }

    public remove(): void {
        if (this.children) {
            Object.keys(this.children).forEach((childName: string) => {
                this.children[childName].remove();
            });
            this.children = null;
        }
        if (this.el && this.el.parentNode) {
            this.el.parentNode.removeChild(this.el);
        }
    }

    protected cidPrefix(): string {
        return 'c';
    }

    protected abstract getViewData(): ViewData;

}

export interface IController extends IBase {
    remove(): void;
}

export interface IViewFunc<ViewData> {
    (data: ViewData): Element;
}
