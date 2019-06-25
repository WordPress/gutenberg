#!/usr/bin/env node

/**
 * Internal dependencies
 */
const { getArgsFromCLI, spawnScript } = require( '../utils' );

const [ scriptName, ...nodesArgs ] = getArgsFromCLI();

spawnScript( scriptName, nodesArgs );
