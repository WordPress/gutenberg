/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const getNameDeclaration = require( '../src/get-name-declaration' );

/**
 * External dependencies.
 */
const test = require( 'tape' );

test( 'returns name for named export (class)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.equal( name, 'MyDeclaration' );
	t.end();
} );

test( 'returns name for named export (function)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.equal( name, 'myDeclaration' );
	t.end();
} );

test( 'returns name for named export (variable)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.equal( name, 'myDeclaration' );
	t.end();
} );

test( 'returns name for named export (single identifier)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier-single.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.equal( name, 'myDeclaration' );
	t.end();
} );
