#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript } = require( '../utils' );

const { scriptName, scriptArgs, nodeArgs } = getNodeArgsFromCLI();

spawnScript( scriptName, scriptArgs, nodeArgs );
