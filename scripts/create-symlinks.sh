#!/usr/bin/env bash

mkdir -p node_modules/@wordpress
ln -sf ../../packages/browserslist-config node_modules/@wordpress
ln -sf ../../packages/babel-preset-default node_modules/@wordpress
ln -sf ../../packages/jest-preset-default node_modules/@wordpress
ln -sf ../../packages/scripts node_modules/@wordpress
ln -sf ../@wordpress/scripts/bin/wp-scripts.js node_modules/.bin/wp-scripts
