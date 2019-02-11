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

test( 'Export entries - default class (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - default class (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'ClassDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - default function (anonymous)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - default function (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - default identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'ClassDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 6,
		lineEnd: 6,
	} ] );
	t.end();
} );

test( 'Export entries - default import (named)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-named.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'fnDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 3,
		lineEnd: 3,
	} ] );
	t.end();
} );

test( 'Export entries - default import (default)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-default.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'fnDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 3,
		lineEnd: 3,
	} ] );
	t.end();
} );

test( 'Export entries - default named export', function( t ) {
	const tokens = fs.readFileSync(
		path.join( __dirname, './fixtures/default-named-export.json' ),
		'utf-8'
	);
	const namedExport = getExportEntries( JSON.parse( tokens )[ 0 ] );
	t.deepEqual( namedExport, [ {
		localName: 'functionDeclaration',
		exportName: 'functionDeclaration',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const defaultExport = getExportEntries( JSON.parse( tokens )[ 1 ] );
	t.deepEqual( defaultExport, [ {
		localName: 'functionDeclaration',
		exportName: 'default',
		module: null,
		lineStart: 6,
		lineEnd: 6,
	} ] );
	t.end();
} );

test( 'Export entries - default variable', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*default*',
		exportName: 'default',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - named class', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'MyDeclaration',
		exportName: 'MyDeclaration',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - named default', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'default',
		exportName: 'default',
		module: './named-default-module',
		lineStart: 1,
		lineEnd: 1,
	} ] );
	t.end();
} );

test( 'Export entries - named default (exported)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default-exported.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'default',
		exportName: 'moduleName',
		module: './named-default-module',
		lineStart: 1,
		lineEnd: 1,
	} ] );
	t.end();
} );

test( 'Export entries - named function', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - named identifier', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
		lineStart: 6,
		lineEnd: 6,
	} ] );
	const tokenObject = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier-destructuring.json' ),
		'utf-8'
	);
	const nameObject = getExportEntries( JSON.parse( tokenObject ) );
	t.deepEqual( nameObject, [ {
		localName: 'someDeclaration',
		exportName: 'myDeclaration',
		module: null,
		lineStart: 6,
		lineEnd: 6,
	} ] );
	t.end();
} );

test( 'Export entries - named identifiers', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [
		{ localName: 'functionDeclaration', exportName: 'functionDeclaration', module: null, lineStart: 16, lineEnd: 16 },
		{ localName: 'variableDeclaration', exportName: 'variableDeclaration', module: null, lineStart: 16, lineEnd: 16 },
		{ localName: 'ClassDeclaration', exportName: 'ClassDeclaration', module: null, lineStart: 16, lineEnd: 16 },
	] );
	const tokenIdentifiersAndInline = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-and-inline.json' ),
		'utf-8'
	);
	const name0 = getExportEntries( JSON.parse( tokenIdentifiersAndInline )[ 0 ] );
	t.deepEqual( name0, [
		{ localName: 'functionDeclaration', exportName: 'functionDeclaration', module: null, lineStart: 11, lineEnd: 11 },
		{ localName: 'ClassDeclaration', exportName: 'ClassDeclaration', module: null, lineStart: 11, lineEnd: 11 },
	] );
	const name1 = getExportEntries( JSON.parse( tokenIdentifiersAndInline )[ 1 ] );
	t.deepEqual( name1, [
		{ localName: 'variableDeclaration', exportName: 'variableDeclaration', module: null, lineStart: 16, lineEnd: 16 },
	] );
	t.end();
} );

test( 'Export entries - named import namespace', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-import-namespace.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [
		{ localName: 'variables', exportName: 'variables', module: null, lineStart: 3, lineEnd: 3 },
	] );
	t.end();
} );

test( 'Export entries - named variable', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: 'myDeclaration',
		exportName: 'myDeclaration',
		module: null,
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'Export entries - named variables', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variables.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [
		{ localName: 'firstDeclaration', exportName: 'firstDeclaration', module: null, lineStart: 4, lineEnd: 5 },
		{ localName: 'secondDeclaration', exportName: 'secondDeclaration', module: null, lineStart: 4, lineEnd: 5 },
	] );
	t.end();
} );

test( 'Export entries - namespace (*)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace.json' ),
		'utf-8'
	);
	const name = getExportEntries( JSON.parse( token ) );
	t.deepEqual( name, [ {
		localName: '*',
		exportName: null,
		module: './namespace-module',
		lineStart: 1,
		lineEnd: 1,
	} ] );
	t.end();
} );
