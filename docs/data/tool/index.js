/**
 * Internal dependencies
 */
const config = require( './config' );
const parser = require( './parser' );
const generator = require( './generator' );

const parsedModules = parser( config.namespaces );
generator( parsedModules, config.output );
