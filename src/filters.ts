module Headlight.filters {
    'use strict';


    let dateFilterHelper = {
        len: (num: number): string => {
            return (num + '').length === 1 ? '0' + num : String(num);
        },
        dateFunctions: {
            year: (date: Date): number => {
                return date.getFullYear();
            },
            month: (date: Date): number => {
                return date.getMonth() + 1;
            },
            day: (date: Date): number => {
                return date.getDate();
            },
            hour: (date: Date): number => {
                return date.getHours();
            },
            minute: (date: Date): number => {
                return date.getMinutes();
            },
            seconds: (date: Date): number => {
                return date.getSeconds();
            }
        },
        datePresets: [
            {
                pattern: 'YYYY',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.year(date)));
                }
            },
            {
                pattern: 'YY',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.year(date)).substr(2));
                }
            },
            {
                pattern: 'MM',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, 
                        String(dateFilterHelper.len(dateFilterHelper.dateFunctions.month(date))));
                }
            },
            {
                pattern: 'M',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.month(date)));
                }
            },
            {
                pattern: 'DD',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, 
                        String(dateFilterHelper.len(dateFilterHelper.dateFunctions.day(date))));
                }
            },
            {
                pattern: 'D',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.day(date)));
                }
            },
            {
                pattern: 'HH',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, 
                        String(dateFilterHelper.len(dateFilterHelper.dateFunctions.hour(date))));
                }
            },
            {
                pattern: 'H',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.hour(date)));
                }
            },
            {
                pattern: 'mm',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, 
                        String(dateFilterHelper.len(dateFilterHelper.dateFunctions.minute(date))));
                }
            },
            {
                pattern: 'm',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.minute(date)));
                }
            },
            {
                pattern: 'ss',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, 
                        String(dateFilterHelper.len(dateFilterHelper.dateFunctions.seconds(date))));
                }
            },
            {
                pattern: 's',
                replace: function (date: Date, dateStr: string): string {
                    return dateStr.replace(this.pattern, String(dateFilterHelper.dateFunctions.seconds(date)));
                }
            }
        ],
        parse: (date: Date, format: string): string => {
            return dateFilterHelper.datePresets.reduce((result: string, item: any) => {
                return result.indexOf(item.pattern) !== -1 ? item.replace(date, result) : result;
            }, format);
        }
    };

    export function not(processor?: Function): (data: any) => boolean {
        if (processor) {
            return (data: any) => !processor(data);
        } else {
            return (data: any) => !data;
        }
    }

    export function json(options?: IJSONOptions): (data: any) => string {
        if (options && options.noCatch) {
            return (data: any) => {
                return JSON.stringify(data, <any>options.replacer, options.space);
            };
        } else {
            return (data: any) => {
                try {
                    return JSON.stringify(data, <any>options.replacer, options.space);
                } catch (e) {
                    return data.toString();
                }
            };
        }
    }

    export interface IJSONOptions {
        replacer?: Array<string>|Function;
        space?: number;
        noCatch?: boolean;
    }
    
    export function empty(options?: IEmptyOptions): (data: any) => boolean {
        if (options && (options.notNull || options.notString || options.notUndefined || options.notNumber)) {
            return (data: any) => {
                if (options.notNull && data === null) {
                    return true;
                } 
                if (options.notNumber && data === 0) {
                    return true;
                }
                if (options.notUndefined && data === undefined) {
                    return true;
                }
                if (options.notString && data === '') {
                    return true;
                }
                return !!data;
            };
        } else {
            return (data: any) => !!data;
        }
    }
    
    export interface IEmptyOptions {
        notNull?: boolean;
        notString?: boolean;
        notUndefined?: boolean;
        notNumber?: boolean;
    }

    export function date(format: string): (date: Date|number) => string {
        return (date: Date|number) => {
            return dateFilterHelper.parse(date instanceof Date ? date : new Date(date), format);
        };
    }
    
    export function byObject(data: Object): (data: any) => boolean {
        let keys = Object.keys(data);
        return (localData: any) => {
            if (localData) {
                return keys.every((key: string) => {
                    return localData[key] === data[key];  
                });
            } else {
                return false;
            }
        };
    }
    
    export function equal(some: any): (data: any) => boolean {
        return (data: any) => data === some;
    }

}
