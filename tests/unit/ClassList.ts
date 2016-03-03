module fakeElement {
    'use strict';

    export class ClassList {

        private parent: FakeElement;

        constructor(parent: FakeElement) {
            this.parent = parent;
        }

        public add(className: string): ClassList {
            let list = this._getClasses();
            let toAddList = ClassList._splitClasses(className);
            toAddList.forEach((name: string) => {
                if (!this._has(name)) {
                    list.push(name);
                }
            });
            this._setList(list);
            return this;
        }

        public remove(className: string): ClassList {
            let list = this._getClasses();
            let toRemoveList = ClassList._splitClasses(className);
            this._setList(list.filter((name: string) => toRemoveList.some(this._has), this));
            return this;
        }

        private _setList(list: Array<string>): void {
            this.parent.className = list.join(' ');
        }

        private _has(className: string): boolean {
            return this._getClasses().indexOf(className) !== -1;
        }

        private _getClasses(): Array<string> {
            return ClassList._splitClasses(this.parent.className);
        }

        private static _splitClasses(classes: string): Array<string> {
            return classes.split(/\s+/).filter((name: string) => !!name);
        }

    }

}
