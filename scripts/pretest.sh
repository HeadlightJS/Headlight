#!/usr/bin/env bash

sh ./scripts/compile.sh || exit 1

echo 'Compiling karma.conf.ts'
node_modules/typescript/bin/tsc karma.conf.ts || exit 1

echo 'Compiling tests'
node_modules/typescript/bin/tsc -p ./tests/unit || exit 1

echo 'Process Distributive for tests'
cp dist/headlight.js dist/headlight.processed.js
sed -i -e 's/Headlight || (Headlight = {})/Headlight || \/* istanbul ignore next *\/ (Headlight = {})/g' dist/headlight.processed.js
sed -i -e 's/(Model = Headlight.Model || (Headlight.Model = {}))/(Model = Headlight.Model || \/* istanbul ignore next *\/ (Headlight.Model = {}))/g' dist/headlight.processed.js
sed -i -e 's/(Collection = Headlight.Collection || (Headlight.Collection = {}))/(Collection = Headlight.Collection || \/* istanbul ignore next *\/ (Headlight.Collection = {}))/g' dist/headlight.processed.js
sed -i -e 's/d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());/d.prototype = b === null ? \/* istanbul ignore next *\/ Object.create(b) : (__.prototype = b.prototype, new __());/g' dist/headlight.processed.js

echo '\nDONE'

exit 0
