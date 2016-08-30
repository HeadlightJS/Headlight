export namespace utils {

    export function isString(some: any): boolean {
        'use strict';

        return typeof some === 'string' || some instanceof String;
    }

    export function isNumber(some: any): boolean {
        'use strict';

        return typeof some === 'number' || some instanceof Number;
    }

    export function isArray(some: any): boolean {
        'use strict';

        return Array.isArray(some);
    }

    export function isNaN(some: any): boolean {
        'use strict';

        return typeof some === 'number' && (<any>window).isNaN(some);
    }

    export function notEmpty(some: any): boolean {
        'use strict';

        return some != null;
    }

    export function isObject(some: any): boolean {
        'use strict';

        return typeof some === 'object' && !isArray(some);
    }

    export function isNull(some: any): boolean {
        'use strict';

        return some === null;
    }

    export function isUndefined(some: any): boolean {
        'use strict';

        return some === undefined;
    }

    export function clone<T>(some: T): T {
        'use strict';

        if (typeof some === 'object') {
            if (isArray(some)) {
                return (<any>some).slice();
            } else {
                let result = {};
                Object.keys(some).forEach((key: string) => {
                    result[key] = some[key];
                });
                return <any>result;
            }
        }
        return some;
    }
}
