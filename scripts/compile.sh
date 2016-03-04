#!/usr/bin/env bash

echo 'Linting sources'
find ./src -name '*.ts' -print0 | xargs -0 node_modules/tslint/bin/tslint -c ./tslint.json || exit 1

echo 'Compiling Headlight'
node_modules/typescript/bin/tsc -p ./ || exit 1

echo 'Minificating distributive'
node_modules/uglify-js/bin/uglifyjs dist/headlight.js -o dist/headlight.min.js || exit 1

echo '\nDONE'

exit 0
