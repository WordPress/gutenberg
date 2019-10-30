#!/usr/bin/env bash

DIRNAME=$(dirname "$0")
global_types_file="$DIRNAME""/../node_modules/@types/react-native/globals.d.ts"
index_type_file="$DIRNAME""/../node_modules/@types/react-native/index.d.ts"

# React Native declares global types that interfere with @types/node and lib dom.

# Remove duplicated types
rm -f "$global_types_file"

# Remove reference to removed global types.
sed -i '' 's|/// <reference path="globals.d.ts" />||' "$index_type_file"

# Namespace the globals in index.d.ts file.
sed -i '' 's|declare global|declare namespace IgnoreTheseGlobals|' "$index_type_file"