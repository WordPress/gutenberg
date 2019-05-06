/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const getExportEntries = require( '../get-export-entries' );

describe( 'Export entries', function() {
	it( 'default class (anonymous)', () => {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-class-anonymous/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default class (named)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-class-named/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default function (anonymous)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-function-anonymous/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default function (named)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-function-named/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'default identifier', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-identifier/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'default import (named)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-import-named/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 3,
			lineEnd: 3,
		} );
	} );

	it( 'default import (default)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-import-default/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 3,
			lineEnd: 3,
		} );
	} );

	it( 'default named export', function() {
		const tokens = fs.readFileSync(
			path.join( __dirname, './fixtures/default-named-export/exports.json' ),
			'utf-8'
		);
		const namedExport = getExportEntries( JSON.parse( tokens )[ 0 ] );
		expect( namedExport ).toHaveLength( 1 );
		expect( namedExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
		const defaultExport = getExportEntries( JSON.parse( tokens )[ 1 ] );
		expect( defaultExport ).toHaveLength( 1 );
		expect( defaultExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'default',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'default variable', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-variable/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named class', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-class/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'MyDeclaration',
			exportName: 'MyDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named default', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-default/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'default',
			module: './named-default-module',
			lineStart: 1,
			lineEnd: 1,
		} );
	} );

	it( 'named default (exported)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-default-exported/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'moduleName',
			module: './named-default-module',
			lineStart: 1,
			lineEnd: 1,
		} );
	} );

	it( 'named function', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-function/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named identifier', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-identifier/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
		const tokenObject = fs.readFileSync(
			path.join( __dirname, './fixtures/named-identifier-destructuring/exports.json' ),
			'utf-8'
		);
		const nameObject = getExportEntries( JSON.parse( tokenObject ) );
		expect( nameObject ).toHaveLength( 1 );
		expect( nameObject[ 0 ] ).toEqual( {
			localName: 'someDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 6,
			lineEnd: 6,
		} );
	} );

	it( 'named identifiers', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-identifiers/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 3 );
		expect( name[ 0 ] ).toEqual(
			{ localName: 'functionDeclaration', exportName: 'functionDeclaration', module: null, lineStart: 16, lineEnd: 16 }
		);
		expect( name[ 1 ] ).toEqual(
			{ localName: 'variableDeclaration', exportName: 'variableDeclaration', module: null, lineStart: 16, lineEnd: 16 },
		);
		expect( name[ 2 ] ).toEqual(
			{ localName: 'ClassDeclaration', exportName: 'ClassDeclaration', module: null, lineStart: 16, lineEnd: 16 },
		);
		const tokenIdentifiersAndInline = fs.readFileSync(
			path.join( __dirname, './fixtures/named-identifiers-and-inline/exports.json' ),
			'utf-8'
		);
		const nameInline0 = getExportEntries( JSON.parse( tokenIdentifiersAndInline )[ 0 ] );
		expect( nameInline0 ).toHaveLength( 2 );
		expect( nameInline0[ 0 ] ).toEqual(
			{ localName: 'functionDeclaration', exportName: 'functionDeclaration', module: null, lineStart: 11, lineEnd: 11 },
		);
		expect( nameInline0[ 1 ] ).toEqual(
			{ localName: 'ClassDeclaration', exportName: 'ClassDeclaration', module: null, lineStart: 11, lineEnd: 11 },
		);
		const nameInline1 = getExportEntries( JSON.parse( tokenIdentifiersAndInline )[ 1 ] );
		expect( nameInline1 ).toHaveLength( 1 );
		expect( nameInline1[ 0 ] ).toEqual(
			{ localName: 'variableDeclaration', exportName: 'variableDeclaration', module: null, lineStart: 16, lineEnd: 16 },
		);
	} );

	it( 'named import namespace', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-import-namespace/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual(
			{ localName: 'variables', exportName: 'variables', module: null, lineStart: 3, lineEnd: 3 },
		);
	} );

	it( 'named variable', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-variable/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
			lineStart: 4,
			lineEnd: 4,
		} );
	} );

	it( 'named variables', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/named-variables/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
		expect( name ).toHaveLength( 2 );
		expect( name[ 0 ] ).toEqual(
			{ localName: 'firstDeclaration', exportName: 'firstDeclaration', module: null, lineStart: 4, lineEnd: 5 },
		);
		expect( name[ 1 ] ).toEqual(
			{ localName: 'secondDeclaration', exportName: 'secondDeclaration', module: null, lineStart: 4, lineEnd: 5 },
		);
	} );

	it( 'namespace (*)', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/namespace/exports.json' ),
			'utf-8'
		);
		const name = getExportEntries( JSON.parse( token ) );
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
