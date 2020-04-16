#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getNodeArgsFromCLI, spawnScript } = require( '../utils' );

const { scriptName, scriptArgs, nodeArgs } = getNodeArgsFromCLI( [
	'--inspect-brk',
	'--inspect-port',
	'--inspect',
] );

spawnScript( scriptName, scriptArgs, nodeArgs );
