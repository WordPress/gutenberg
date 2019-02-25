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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( token ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenOneliner ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenClassAnonymous ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenClassNamed ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenFnAnonymous ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenFnNamed ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenVariable ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenClass ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenFn ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenVariable ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenVariables ) ), [
		{ path: null, name: 'firstDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
		{ path: null, name: 'secondDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( token ), JSON.parse( ast ) ), [ {
		path: null,
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
		getIntermediateRepresentation( null, JSON.parse( namedExport )[ 0 ], JSON.parse( namedExportAST ) ),
		[ { path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 4, lineEnd: 4 } ]
	);
	t.deepEqual(
		getIntermediateRepresentation( null, JSON.parse( namedExport )[ 1 ], JSON.parse( namedExportAST ) ),
		[ { path: null, name: 'default', description: 'Function declaration example.', tags: [], lineStart: 6, lineEnd: 6 } ]
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( token ), JSON.parse( ast ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokenObject ), JSON.parse( astObject ) ), [ {
		path: null,
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
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( tokens ), JSON.parse( asts ) ), [
		{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
		{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
		{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
	] );
	const foo = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-and-inline.json' ),
		'utf-8'
	);
	const bar = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-and-inline-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( foo )[ 0 ], JSON.parse( bar ) ), [
		{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 11, lineEnd: 11 },
		{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 11, lineEnd: 11 },
	] );
	t.deepEqual( getIntermediateRepresentation( null, JSON.parse( foo )[ 1 ], JSON.parse( bar ) ), [
		{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 },
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
		getIntermediateRepresentation( null, JSON.parse( tokenImportNamed ), { body: [] }, getModuleImportNamed ),
		[
			{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 2, lineEnd: 2 },
			{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 3, lineEnd: 3 },
			{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 4, lineEnd: 4 },
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
		getIntermediateRepresentation( null, JSON.parse( tokenDefault ), { body: [] }, getModule ),
		[ { path: null, name: 'default', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 } ]
	);
	const tokenDefaultExported = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default-exported.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( null, JSON.parse( tokenDefaultExported ), { body: [] }, getModule ),
		[ { path: null, name: 'moduleName', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 } ]
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
		getIntermediateRepresentation( null, JSON.parse( token ), { body: [] }, getModule ),
		[
			{ path: null, name: 'MyClass', description: 'Named class.', tags: [], lineStart: 1, lineEnd: 1 },
			{ path: null, name: 'myFunction', description: 'Named function.', tags: [], lineStart: 1, lineEnd: 1 },
			{ path: null, name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 1, lineEnd: 1 },
		]
	);
	const tokenCommented = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace-commented.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( null, JSON.parse( tokenCommented ), { body: [] }, getModule ),
		[
			{ path: null, name: 'MyClass', description: 'Named class.', tags: [], lineStart: 4, lineEnd: 4 },
			{ path: null, name: 'myFunction', description: 'Named function.', tags: [], lineStart: 4, lineEnd: 4 },
			{ path: null, name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 4, lineEnd: 4 },
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
		getIntermediateRepresentation( null, JSON.parse( tokenDefault ), JSON.parse( astDefault ), getModuleDefault ),
		[ {
			path: null,
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
		getIntermediateRepresentation( null, JSON.parse( tokenNamed ), JSON.parse( astNamed ), getModuleNamed ),
		[ {
			path: null,
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
		getIntermediateRepresentation( null, JSON.parse( tokenImportNamespace ), JSON.parse( astImportNamespace ), getModuleImportNamespace ),
		[ { path: null, name: 'variables', description: 'Undocumented declaration.', tags: [], lineStart: 3, lineEnd: 3 } ]
	);
	t.end();
} );

test( 'IR - tags are extracted properly', function( t ) {
	const tokensFn = fs.readFileSync(
		path.join( __dirname, './fixtures/tags-function-exports.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( null, JSON.parse( tokensFn ) ),
		[ {
			path: null,
			name: 'sum',
			description: 'A function that adds two parameters.',
			tags: [
				{
					title: 'deprecated',
					description: 'Use native addition instead.',
				},
				{
					title: 'since',
					description: 'v2',
				},
				{
					title: 'see',
					description: 'addition',
				},
				{
					title: 'link',
					description: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
				},
				{
					title: 'param',
					description: 'The first param to add.',
					type: {
						type: 'NameExpression',
						name: 'number',
					},
					name: 'firstParam',
				},
				{
					title: 'param',
					description: 'The second param to add.',
					type: {
						type: 'NameExpression',
						name: 'number',
					},
					name: 'secondParam',
				},
				{
					title: 'example',
					description: '```js\nconst addResult = sum( 1, 3 );\nconsole.log( addResult ); // will yield 4\n```',
				},
				{
					title: 'return',
					description: 'The result of adding the two params.',
					type: {
						type: 'NameExpression',
						name: 'number',
					},
				},
			],
			lineStart: 22,
			lineEnd: 24,
		} ]
	);
	const tokensVar = fs.readFileSync(
		path.join( __dirname, './fixtures/tags-variable-exports.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( null, JSON.parse( tokensVar ) ),
		[ {
			path: null,
			name: 'THE_MEANING',
			description: 'Constant to document the meaning of life,\nthe universe and everything else.',
			tags: [
				{
					title: 'type',
					description: null,
					type: {
						type: 'NameExpression',
						name: 'number',
					},
				},
			],
			lineStart: 7,
			lineEnd: 7,
		} ]
	);
	t.end();
} );
