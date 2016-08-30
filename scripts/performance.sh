#!/usr/bin/env bash

node_modules/typescript/bin/tsc ./karma.performance.conf.ts || exit 1
node_modules/typescript/bin/tsc -p ./tests/performance/ || exit 1
karma start ./karma.performance.conf.js && sh scripts/clean.sh
