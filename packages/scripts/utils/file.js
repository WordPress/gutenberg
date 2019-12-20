/**
 * External dependencies
 */
const { existsSync } = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies
 */
const { getPackagePath } = require( './package' );

const fromProjectRoot = ( fileName ) =>
	path.join( path.dirname( getPackagePath() ), fileName );

const hasProjectFile = ( fileName ) =>
	existsSync( fromProjectRoot( fileName ) );

const fromConfigRoot = ( fileName ) =>
	path.join( path.dirname( __dirname ), 'config', fileName );

const fromScriptsRoot = ( scriptName ) =>
	path.join( path.dirname( __dirname ), 'scripts', `${ scriptName }.js` );

const hasScriptFile = ( scriptName ) =>
	existsSync( fromScriptsRoot( scriptName ) );

module.exports = {
	fromConfigRoot,
	fromScriptsRoot,
	hasProjectFile,
	hasScriptFile,
};
