#!/usr/bin/env bash

tsc -p ./tests/performance/
node tmp/tests/performance/index.js
