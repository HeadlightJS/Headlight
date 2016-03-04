#!/usr/bin/env bash

tsc -p ./tests/performance/
echo "Perform.start();" >> tests/performance/performance.test.js
node tests/performance/performance.test.js