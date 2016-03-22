module Headlight {
    'use strict';
    import IDependency = Headlight.Binding.IDependency;
    
    export abstract class Binding {
        
        protected options: Binding.IOptions;
        
        constructor(options: Binding.IOptions) {
            this.options = options;
            
            this.__initialize();
        }
        
        protected abstract toDom(data: any): void;
        protected abstract defaultProcessor(data: any): any;
        
        protected changeModelHandler(): any {
            let args = this.options.deps.map((dependency: IDependency) => {
                return dependency.model[dependency.key];
            });
            if (this.options.toView) {
                this.toDom(this.options.toView.apply(this, args));
            } else if (this.options.processor) {
                this.toDom(this.options.processor.apply(this, args));
            } else {
                this.toDom(this.defaultProcessor(args[0]));
            }
        }
        
        private __initialize(): void {
            this.__deps.forEach((dependency: Binding.IDependency) => {
                dependency.model.on.change(this.changeModelHandler);
            });
            if (this.options.events) {
                // TODO do
            }
        }
    }
    
    export module Binding {

        export interface IDependency {
            model: Headlight.Model<any>;
            key: string;
        }
        
        export interface IOptions {
            element: HTMLElement;
            deps: Array<IDependency>;
            current?: string;
            events?: Array<string>;
            processor?: Function;
            toModel?: Function;
            toView?: Function;
        }

        export const filters = {
            not: (): Function => {
                return (data: any): boolean => !data;
            },
            json: (splitter?: string, spaceCount?: number): Function => {
                return (data: any) => JSON.stringify(data, <any>splitter, spaceCount);
            },
            date: (format: string) => {
                let len = (num: number): string => {
                    return (num + '').length === 1 ? '0' + num : num;
                };
                let chars = {
                    DD: (date: Date, localFormat: string): string => {
                        return localFormat.replace('DD', len(date.getDay()));
                    },
                    MM: (date: Date, localFormat: string): string => {
                        return localFormat.replace('MM', len(date.getMonth() + 1));
                    },
                    YYYY: (date: Date, localFormat: string): string => {
                        return localFormat.replace('YYYY', date.getFullYear());
                    },
                    HH: (date: Date, localFormat: string): string => {
                        return localFormat.replace('HH', len(date.getHours()));
                    },
                    mm: (date: Date, localFormat: string): string => {
                        return localFormat.replace('mm', len(date.getMinutes()));
                    },
                    ss: (date: Date, localFormat: string): string => {
                        return localFormat.replace('ss', len(date.getSeconds()));
                    }
                };
                let parse = (date: Date) => {
                    return Object.keys(chars).reduce((result: string, char: string) => {
                        return chars[char](date, result);
                    }, format);
                };
                return (data: Date|number) => {
                    let date = data instanceof Date ? data : new Date(data);
                    return parse(date);
                };
            }
        };

        export class Text extends Binding {

            protected toDom(data: string): void {
                this.options.element.innerText = data;
            }

            protected defaultProcessor(data: any): string {
                return data.toString();
            }

        }

        export class Html extends Binding {

            protected toDom(data: string): void {
                this.options.element.innerHTML = data;
            }

            protected defaultProcessor(data: any): string {
                return data.toString();
            }

        }

        export class Class extends Binding {

            protected toDom(data: boolean): void {
                if (data) {
                    this.options.element.classList.add(this.options.current);
                } else {
                    this.options.element.classList.remove(this.options.current);
                }
            }

            protected defaultProcessor(data: any): boolean {
                return !!data;
            }

        }

        export class Attr extends Binding {

            protected toDom(data: string): void {
                if (data) {
                    this.options.element.setAttribute(this.options.current, data);
                } else {
                    this.options.element.removeAttribute(this.options.current);
                }
            }

            protected defaultProcessor(data: any): boolean {
                return data.toString();
            }

        }

        export class Css extends Binding {

            protected toDom(data: string): void {
                this.options.element.style[this.options.current] = data;
            }

            protected defaultProcessor(data: any): string {
                return data.toString();
            }

        }

        export class Toggle extends Binding {

            protected toDom(data: boolean): void {
                if (data) {
                    this.options.element.style.display = '';
                } else {
                    this.options.element.style.display = 'none';
                }
            }

            protected defaultProcessor(data: any): boolean {
                return !!data;
            }

        }
        
    }
    
}
