/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const getExportEntries = require( '../src/get-export-entries' );

test( 'default export class (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'default export class (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'ClassDeclaration',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'default export function (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'default export function (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'default export identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'ClassDeclaration',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'default export variable', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'named export class', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'MyDeclaration',
		exportName: 'MyDeclaration',
		module: null,
	} ] );
	t.end();
} );

test( 'named export default', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'default',
		exportName: 'default',
		module: null,
	} ] );
	t.end();
} );

test( 'named export function', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
	} ] );
	t.end();
} );

test( 'named export identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
	} ] );
	t.end();
} );

test( 'named export identifiers', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [
		{ localName: 'functionDeclaration', exportName: 'functionDeclaration', module: null },
		{ localName: 'variableDeclaration', exportName: 'variableDeclaration', module: null },
		{ localName: 'ClassDeclaration', exportName: 'ClassDeclaration', module: null },
	] );
	t.end();
} );

test( 'named export variable', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
	} ] );
	t.end();
} );

test( 'named export variables', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variables.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [
		{ localName: 'firstDeclaration', exportName: 'firstDeclaration', module: null },
		{ localName: 'secondDeclaration', exportName: 'secondDeclaration', module: null },
	] );
	t.end();
} );

test( 'namespace export (*)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*',
		exportName: null,
		module: './module',
	} ] );
	t.end();
} );
