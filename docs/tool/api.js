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
const outputTmp = path.resolve( root, 'packages/i18n/src/ast.json' );
const output = path.resolve( root, 'packages/i18n/src/api.json' );

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

fs.writeFileSync( outputTmp, JSON.stringify( exportDeclarations ) );
fs.writeFileSync( output, JSON.stringify( apiArtifacts ) );
