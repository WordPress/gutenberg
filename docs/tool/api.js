/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies.
 */
const { last } = require( 'lodash' );
const espree = require( 'espree' );
const doctrine = require( 'doctrine' );

/**
 * Internal dependencies.
 */
const getNameDeclaration = require( './get-name-declaration' );

const root = path.resolve( __dirname, '../../' );
const input = path.resolve( root, 'packages/i18n/src/index.js' );
const outputExportDeclarations = path.resolve( root, 'packages/i18n/src/ast.json' );
const outputApiArtifacts = path.resolve( root, 'packages/i18n/src/api.json' );
const output = path.resolve( root, 'packages/i18n/src/api.md' );

const code = fs.readFileSync( input, 'utf8' );
const ast = espree.parse( code, {
	attachComment: true,
	ecmaVersion: 2018,
	sourceType: 'module',
} );

const exportDeclarations = ast.body.filter(
	( node ) => [ 'ExportNamedDeclaration', 'ExportDefaultDeclaration', 'ExportAllDeclaration' ].some( ( declaration ) => declaration === node.type )
);

const apiArtifacts = exportDeclarations.map(
	( exportDeclaration ) => ( {
		name: getNameDeclaration( exportDeclaration.declaration ),
		jsdoc: doctrine.parse(
			last( exportDeclaration.leadingComments ).value,
			{ unwrap: true, recoverable: true }
		),
	} )
);

const generateDocs = function( artifacts ) {
	const docs = [ '# API' ];
	docs.push( '\n' );
	docs.push( '\n' );
	artifacts.forEach( ( artifact ) => {
		docs.push( `## ${ artifact.name }` );
		docs.push( '\n' );
		docs.push( '\n' );
		docs.push( artifact.jsdoc.description.replace( '\n', ' ' ) );
		docs.push( '\n' );
		docs.push( '\n' );
	} );
	docs.pop(); // remove last \n, we want one blank line at the end of the file.
	return docs.join( '' );
};

fs.writeFileSync( outputExportDeclarations, JSON.stringify( exportDeclarations ) );
fs.writeFileSync( outputApiArtifacts, JSON.stringify( apiArtifacts ) );
fs.writeFileSync( output, generateDocs( apiArtifacts ) );
