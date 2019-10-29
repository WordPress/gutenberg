#!/usr/bin/env bash

DIRNAME=$(dirname "$0")

# React Native declares global types that interfere with @types/node and lib dom.
rm -f $DIRNAME/node_modules/@types/react-native/globals.d.ts
sed -i '' 's|/// <reference path="globals.d.ts" />||' $DIRNAME/node_modules/@types/react-native/index.d.ts

# Namespace the globals
sed -i '' 's|declare global|declare namespace IgnoreTheseGlobals|' $DIRNAME/node_modules/@types/react-native/index.d.ts