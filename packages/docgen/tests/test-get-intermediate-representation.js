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
const getIntermediateRepresentation = require( '../src/get-intermediate-representation' );

test( 'IR - undocumented', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-undocumented-nocomments.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( token ) ), [ {
		name: 'default',
		description: 'Undocumented declaration.',
		tags: [],
		lineStart: 3,
		lineEnd: 3,
	} ] );
	const tokenOneliner = fs.readFileSync(
		path.join( __dirname, './fixtures/default-undocumented-oneliner.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenOneliner ) ), [ {
		name: 'default',
		description: 'Undocumented declaration.',
		tags: [],
		lineStart: 2,
		lineEnd: 2,
	} ] );
	t.end();
} );

test( 'IR - JSDoc in export statement (default export)', function( t ) {
	const tokenClassAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassAnonymous ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenClassNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassNamed ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenFnAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnAnonymous ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenFnNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnNamed ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenVariable = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariable ) ), [ {
		name: 'default',
		description: 'Variable declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	t.end();
} );

test( 'IR - JSDoc in export statement (named export)', function( t ) {
	const tokenClass = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClass ) ), [ {
		name: 'MyDeclaration',
		description: 'My declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenFn = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFn ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenVariable = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariable ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		tags: [],
		lineStart: 4,
		lineEnd: 4,
	} ] );
	const tokenVariables = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variables.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariables ) ), [
		{ name: 'firstDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
		{ name: 'secondDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
	] );
	t.end();
} );

test( 'IR - JSDoc in same file (default export)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier.json' ),
		'utf-8'
	);
	const ast = fs.readFileSync(
		path.join( __dirname, './fixtures/default-identifier-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( token ), JSON.parse( ast ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		tags: [],
		lineStart: 6,
		lineEnd: 6,
	} ] );
	const namedExport = fs.readFileSync(
		path.join( __dirname, './fixtures/default-named-export.json' ),
		'utf-8'
	);
	const namedExportAST = fs.readFileSync(
		path.join( __dirname, './fixtures/default-named-export-ast.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( namedExport )[ 0 ], JSON.parse( namedExportAST ) ),
		[ { name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 4, lineEnd: 4 } ]
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( namedExport )[ 1 ], JSON.parse( namedExportAST ) ),
		[ { name: 'default', description: 'Function declaration example.', tags: [], lineStart: 6, lineEnd: 6 } ]
	);
	t.end();
} );

test( 'IR - JSDoc in same file (named export)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier.json' ),
		'utf-8'
	);
	const ast = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( token ), JSON.parse( ast ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		tags: [],
		lineStart: 6,
		lineEnd: 6,
	} ] );
	const tokenObject = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier-destructuring.json' ),
		'utf-8'
	);
	const astObject = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifier-destructuring-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenObject ), JSON.parse( astObject ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		tags: [],
		lineStart: 6,
		lineEnd: 6,
	} ] );
	const tokens = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers.json' ),
		'utf-8'
	);
	const asts = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokens ), JSON.parse( asts ) ), [
		{ name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
		{ name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
		{ name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
	] );
	const foo = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-and-inline.json' ),
		'utf-8'
	);
	const bar = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-and-inline-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( foo )[ 0 ], JSON.parse( bar ) ), [
		{ name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 11, lineEnd: 11 },
		{ name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 11, lineEnd: 11 },
	] );
	t.deepEqual( getIntermediateRepresentation( JSON.parse( foo )[ 1 ], JSON.parse( bar ) ), [
		{ name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
	] );
	t.end();
} );

test( 'IR - JSDoc in module dependency (named export)', function( t ) {
	const tokenImportNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/named-import-named.json' ),
		'utf-8'
	);
	const getModuleImportNamed = () => JSON.parse( fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-ir.json' ),
		'utf-8'
	) );
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenImportNamed ), { body: [] }, getModuleImportNamed ),
		[
			{ name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 2, lineEnd: 2 },
			{ name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 3, lineEnd: 3 },
			{ name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 4, lineEnd: 4 },
		]
	);
	t.end();
} );

test( 'IR - JSDoc in module dependency (named default export)', function( t ) {
	const tokenDefault = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default.json' ),
		'utf-8'
	);
	const getModule = () => JSON.parse( fs.readFileSync(
		path.join( __dirname, './fixtures/named-default-module-ir.json' ),
		'utf-8'
	) );
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenDefault ), { body: [] }, getModule ),
		[ { name: 'default', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 } ]
	);
	const tokenDefaultExported = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default-exported.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenDefaultExported ), { body: [] }, getModule ),
		[ { name: 'moduleName', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 } ]
	);

	t.end();
} );

test( 'IR - JSDoc in module dependency (namespace export)', function( t ) {
	const token = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace.json' ),
		'utf-8'
	);
	const getModule = () => JSON.parse( fs.readFileSync(
		path.join( __dirname, './fixtures/namespace-module-ir.json' ),
		'utf-8'
	) );
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( token ), { body: [] }, getModule ),
		[
			{ name: 'MyClass', description: 'Named class.', tags: [], lineStart: 1, lineEnd: 1 },
			{ name: 'myFunction', description: 'Named function.', tags: [], lineStart: 1, lineEnd: 1 },
			{ name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 1, lineEnd: 1 },
		]
	);
	const tokenCommented = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace-commented.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenCommented ), { body: [] }, getModule ),
		[
			{ name: 'MyClass', description: 'Named class.', tags: [], lineStart: 4, lineEnd: 4 },
			{ name: 'myFunction', description: 'Named function.', tags: [], lineStart: 4, lineEnd: 4 },
			{ name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 4, lineEnd: 4 },
		]
	);
	t.end();
} );

test( 'IR - JSDoc in module dependency through import (default export)', function( t ) {
	const tokenDefault = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-default.json' ),
		'utf-8'
	);
	const astDefault = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-default-ast.json' ),
		'utf-8'
	);
	const getModuleDefault = () => JSON.parse( fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-default-module-ir.json' ),
		'utf-8'
	) );
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenDefault ), JSON.parse( astDefault ), getModuleDefault ),
		[ {
			name: 'default',
			description: 'Function declaration.',
			tags: [],
			lineStart: 3,
			lineEnd: 3,
		} ]
	);
	const tokenNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-named.json' ),
		'utf-8'
	);
	const astNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-named-ast.json' ),
		'utf-8'
	);
	const getModuleNamed = () => JSON.parse( fs.readFileSync(
		path.join( __dirname, './fixtures/default-import-named-module-ir.json' ),
		'utf-8'
	) );
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenNamed ), JSON.parse( astNamed ), getModuleNamed ),
		[ {
			name: 'default',
			description: 'Function declaration.',
			tags: [],
			lineStart: 3,
			lineEnd: 3,
		} ]
	);
	t.end();
} );

test( 'IR - JSDoc in module dependency through import (named export)', function( t ) {
	const tokenImportNamespace = fs.readFileSync(
		path.join( __dirname, './fixtures/named-import-namespace.json' ),
		'utf-8'
	);
	const astImportNamespace = fs.readFileSync(
		path.join( __dirname, './fixtures/named-import-namespace-ast.json' ),
		'utf-8'
	);
	const getModuleImportNamespace = ( filePath ) => {
		if ( filePath === './named-import-namespace-module' ) {
			return JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/named-import-namespace-module-ir.json' ),
				'utf-8'
			) );
		}
		return JSON.parse( fs.readFileSync(
			path.join( __dirname, './fixtures/default-function-ir.json' ),
			'utf-8'
		) );
	};
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenImportNamespace ), JSON.parse( astImportNamespace ), getModuleImportNamespace ),
		[ { name: 'variables', description: 'Undocumented declaration.', tags: [], lineStart: 3, lineEnd: 3 } ]
	);
	t.end();
} );
