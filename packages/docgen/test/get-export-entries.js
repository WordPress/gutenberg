/**
 * Internal dependencies
 */
const getExportEntries = require( '../lib/get-export-entries' );

describe( 'Export entries', () => {
	it( 'default class (anonymous)', () => {
		const token = require( './fixtures/default-class-anonymous/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default class (named)', () => {
		const token = require( './fixtures/default-class-named/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default function (anonymous)', () => {
		const token = require( './fixtures/default-function-anonymous/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default function (named)', () => {
		const token = require( './fixtures/default-function-named/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default identifier', () => {
		const token = require( './fixtures/default-identifier/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'default import (named)', () => {
		const token = require( './fixtures/default-import-named/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 3,
			lineEnd: 3,
		} );
	} );

	it( 'default import (default)', () => {
		const token = require( './fixtures/default-import-default/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 3,
			lineEnd: 3,
		} );
	} );

	it( 'default named export', () => {
		const tokens = require( './fixtures/default-named-export/exports.json' );
		const namedExport = getExportEntries( tokens[ 0 ] );
		expect( namedExport ).toHaveLength( 1 );
		expect( namedExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
		const defaultExport = getExportEntries( tokens[ 1 ] );
		expect( defaultExport ).toHaveLength( 1 );
		expect( defaultExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'default variable', () => {
		const token = require( './fixtures/default-variable/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named class', () => {
		const token = require( './fixtures/named-class/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'MyDeclaration',
			exportName: 'MyDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named default', () => {
		const token = require( './fixtures/named-default/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'default',
			module: './named-default-module',
			lineStart: 1,
			lineEnd: 1,
		} );
	} );

	it( 'named default (exported)', () => {
		const token = require( './fixtures/named-default-exported/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'moduleName',
			module: './named-default-module',
			lineStart: 1,
			lineEnd: 1,
		} );
	} );

	it( 'named function', () => {
		const token = require( './fixtures/named-function/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named identifier', () => {
		const token = require( './fixtures/named-identifier/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
		const tokenObject = require( './fixtures/named-identifier-destructuring/exports.json' );
		const nameObject = getExportEntries( tokenObject );
		expect( nameObject ).toHaveLength( 1 );
		expect( nameObject[ 0 ] ).toEqual( {
			localName: 'someDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'named identifiers', () => {
		const token = require( './fixtures/named-identifiers/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 3 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
			lineStart: 16,
			lineEnd: 16,
		} );
		expect( name[ 1 ] ).toEqual( {
			localName: 'variableDeclaration',
			exportName: 'variableDeclaration',
			module: null,
			lineStart: 16,
			lineEnd: 16,
		} );
		expect( name[ 2 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'ClassDeclaration',
			module: null,
			lineStart: 16,
			lineEnd: 16,
		} );
		const tokenIdentifiersAndInline = require( './fixtures/named-identifiers-and-inline/exports.json' );
		const nameInline0 = getExportEntries( tokenIdentifiersAndInline[ 0 ] );
		expect( nameInline0 ).toHaveLength( 2 );
		expect( nameInline0[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
			lineStart: 11,
			lineEnd: 11,
		} );
		expect( nameInline0[ 1 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'ClassDeclaration',
			module: null,
			lineStart: 11,
			lineEnd: 11,
		} );
		const nameInline1 = getExportEntries( tokenIdentifiersAndInline[ 1 ] );
		expect( nameInline1 ).toHaveLength( 1 );
		expect( nameInline1[ 0 ] ).toEqual( {
			localName: 'variableDeclaration',
			exportName: 'variableDeclaration',
			module: null,
			lineStart: 16,
			lineEnd: 16,
		} );
	} );

	it( 'named import namespace', () => {
		const token = require( './fixtures/named-import-namespace/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'variables',
			exportName: 'variables',
			module: null,
			lineStart: 3,
			lineEnd: 3,
		} );
	} );

	it( 'named variable', () => {
		const token = require( './fixtures/named-variable/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named variables', () => {
		const token = require( './fixtures/named-variables/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 2 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'firstDeclaration',
			exportName: 'firstDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 5,
		} );
		expect( name[ 1 ] ).toEqual( {
			localName: 'secondDeclaration',
			exportName: 'secondDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 5,
		} );
	} );

	it( 'namespace (*)', () => {
		const token = require( './fixtures/namespace/exports.json' );
		const name = getExportEntries( token );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*',
			exportName: null,
			module: './namespace-module',
			lineStart: 1,
			lineEnd: 1,
		} );
	} );
} );
