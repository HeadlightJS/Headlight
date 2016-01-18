#!/usr/bin/env bash

echo 'Linting sources'
find ./src -name '*.ts' -print0 | xargs -0 node_modules/tslint/bin/tslint -c ./tslint.json || exit 1

echo 'Compiling Headlight'
node_modules/typescript/bin/tsc -p ./ || exit 1

exit 0
