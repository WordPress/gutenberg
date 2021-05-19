/**
 * External dependencies
 */
const { existsSync, readdirSync } = require( 'fs' );
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

const getScripts = () =>
	readdirSync( path.join( path.dirname( __dirname ), 'scripts' ) )
		.filter( ( f ) => path.extname( f ) === '.js' )
		.map( ( f ) => path.basename( f, '.js' ) );

module.exports = {
	fromProjectRoot,
	fromConfigRoot,
	fromScriptsRoot,
	getScripts,
	hasProjectFile,
	hasScriptFile,
};
