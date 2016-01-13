#!/usr/bin/env bash

echo 'Compiling karma.conf.ts'
node_modules/typescript/bin/tsc karma.conf.ts

echo 'Compiling Headlight'
node_modules/typescript/bin/tsc -p ./

echo 'Compiling tests'
node_modules/typescript/bin/tsc -p ./tests/

echo 'Process Headlight for tests'
sed -e 's/Headlight || (Headlight = {})/Headlight || \/* istanbul ignore next *\/ (Headlight = {})/g' -i .tmp dist/headlight.js
sed -e 's/d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());/d.prototype = b === null ? \/* istanbul ignore next *\/ Object.create(b) : (__.prototype = b.prototype, new __());/g' -i .tmp dist/headlight.js
mv dist/headlight.js dist/headlight.processed.js
mv dist/headlight.js.tmp dist/headlight.js

echo '\nDONE'

exit 0
