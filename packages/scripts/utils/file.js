/**
 * External dependencies
 */
const { existsSync, readdirSync } = require( 'fs' );
const path = require( 'path' );

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
	fromConfigRoot,
	fromScriptsRoot,
	getScripts,
	hasScriptFile,
};
