#!/bin/bash

./node_modules/.bin/lerna bootstrap
npm install

npm run docs:component-build
