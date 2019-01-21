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

test( 'default export class (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export class (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export function (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export function (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export variable (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable-anonymous.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'default export variable (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable-named.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'default export' ] );
	t.end();
} );

test( 'named export class', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'MyDeclaration' ] );
	t.end();
} );

test( 'named export default', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'TODO: default export?' ] );
	t.end();
} );

test( 'named export function', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'myDeclaration' ] );
	t.end();
} );

test( 'named export identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'myDeclaration' ] );
	t.end();
} );

test( 'named export identifiers', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'functionDeclaration', 'variableDeclaration', 'ClassDeclaration' ] );
	t.end();
} );

test( 'named export variable', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'myDeclaration' ] );
	t.end();
} );

test( 'namespace export (*)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace.json' ),
		'utf-8'
	);
	const name = getNameDeclaration( JSON.parse( token ) );
	t.deepEqual( name, [ 'TODO: to look up in module' ] );
	t.end();
} );
