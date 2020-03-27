/**
 * Node dependencies.
 */
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const compile = require( '../compile' );
const getExportEntries = require( '../get-export-entries' );

describe( 'Export entries', function() {
	const getStatements = ( dir ) => {
		const filePath = path.join( __dirname, 'fixtures', dir, 'code.js' );
		const { exportStatements } = compile( filePath );

		return exportStatements;
	};

	const getStatement = ( dir ) => getStatements( dir )[ 0 ];

	it( 'default class (anonymous)', () => {
		const statement = getStatement( 'default-class-anonymous' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default class (named)', function() {
		const statement = getStatement( 'default-class-named' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default function (anonymous)', function() {
		const statement = getStatement( 'default-function-anonymous' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default function (named)', function() {
		const statement = getStatement( 'default-function-named' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default identifier', function() {
		const statement = getStatement( 'default-identifier' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default import (named)', function() {
		const statement = getStatement( 'default-import-named' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default import (default)', function() {
		const statement = getStatement( 'default-import-default' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'fnDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default named export', function() {
		const statements = getStatements( 'default-named-export' );
		const namedExport = getExportEntries( statements[ 0 ] );
		expect( namedExport ).toHaveLength( 1 );
		expect( namedExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
		} );
		const defaultExport = getExportEntries( statements[ 1 ] );
		expect( defaultExport ).toHaveLength( 1 );
		expect( defaultExport[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'default variable', function() {
		const statement = getStatement( 'default-variable' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*default*',
			exportName: 'default',
			module: null,
		} );
	} );

	it( 'named class', function() {
		const statement = getStatement( 'named-class' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'MyDeclaration',
			exportName: 'MyDeclaration',
			module: null,
		} );
	} );

	it( 'named default', function() {
		const statement = getStatement( 'named-default' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'default',
			module: './module-code',
		} );
	} );

	it( 'named default (exported)', function() {
		const statement = getStatement( 'named-default-exported' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'default',
			exportName: 'moduleName',
			module: './module-code',
		} );
	} );

	it( 'named double underscore', function() {
		const statement = getStatement( 'named-double-underscore' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '__',
			exportName: '__',
			module: null,
		} );
	} );

	it( 'named function', function() {
		const statement = getStatement( 'named-function' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
		} );
	} );

	it( 'named identifier', function() {
		const statement = getStatement( 'named-identifier' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
		} );
	} );

	it( 'named identifier (destructuring)', function() {
		const statement = getStatement( 'named-identifier-destructuring' );
		const nameObject = getExportEntries( statement );
		expect( nameObject ).toHaveLength( 1 );
		expect( nameObject[ 0 ] ).toEqual( {
			localName: 'someDeclaration',
			exportName: 'myDeclaration',
			module: null,
		} );
	} );

	it( 'named identifiers', function() {
		const statement = getStatement( 'named-identifiers' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 3 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
		} );
		expect( name[ 1 ] ).toEqual( {
			localName: 'variableDeclaration',
			exportName: 'variableDeclaration',
			module: null,
		} );
		expect( name[ 2 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'ClassDeclaration',
			module: null,
		} );
	} );

	it( 'named identifiers (inline)', function() {
		const statements = getStatements( 'named-identifiers-and-inline' );
		const nameInline0 = getExportEntries( statements[ 0 ] );
		expect( nameInline0 ).toHaveLength( 2 );
		expect( nameInline0[ 0 ] ).toEqual( {
			localName: 'functionDeclaration',
			exportName: 'functionDeclaration',
			module: null,
		} );
		expect( nameInline0[ 1 ] ).toEqual( {
			localName: 'ClassDeclaration',
			exportName: 'ClassDeclaration',
			module: null,
		} );

		const nameInline1 = getExportEntries( statements[ 1 ] );
		expect( nameInline1 ).toHaveLength( 1 );
		expect( nameInline1[ 0 ] ).toEqual( {
			localName: 'variableDeclaration',
			exportName: 'variableDeclaration',
			module: null,
		} );
	} );

	it( 'named import namespace', function() {
		const statement = getStatement( 'named-import-namespace' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'variables',
			exportName: 'variables',
			module: null,
		} );
	} );

	it( 'named variable', function() {
		const statement = getStatement( 'named-variable' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'myDeclaration',
			exportName: 'myDeclaration',
			module: null,
		} );
	} );

	it( 'named variables', function() {
		const statement = getStatement( 'named-variables' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 2 );
		expect( name[ 0 ] ).toEqual( {
			localName: 'firstDeclaration',
			exportName: 'firstDeclaration',
			module: null,
		} );
		expect( name[ 1 ] ).toEqual( {
			localName: 'secondDeclaration',
			exportName: 'secondDeclaration',
			module: null,
		} );
	} );

	it( 'namespace (*)', function() {
		const statement = getStatement( 'namespace' );
		const name = getExportEntries( statement );
		expect( name ).toHaveLength( 1 );
		expect( name[ 0 ] ).toEqual( {
			localName: '*',
			exportName: null,
			module: './module',
		} );
	} );
} );
