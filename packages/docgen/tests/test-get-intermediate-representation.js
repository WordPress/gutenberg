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
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenOneliner = fs.readFileSync(
		path.join( __dirname, './fixtures/default-undocumented-oneliner.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenOneliner ) ), [ {
		name: 'default',
		description: 'Undocumented declaration.',
		params: [],
		return: [],
		tags: [],
	} ] );
	t.end();
} );

test( 'IR - default (JSDoc in export statement)', function( t ) {
	const tokenClassAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassAnonymous ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenClassNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-class-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClassNamed ) ), [ {
		name: 'default',
		description: 'Class declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenFnAnonymous = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-anonymous.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnAnonymous ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenFnNamed = fs.readFileSync(
		path.join( __dirname, './fixtures/default-function-named.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFnNamed ) ), [ {
		name: 'default',
		description: 'Function declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenVariable = fs.readFileSync(
		path.join( __dirname, './fixtures/default-variable.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariable ) ), [ {
		name: 'default',
		description: 'Variable declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	t.end();
} );

test( 'IR - default (JSDoc in same file)', function( t ) {
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
		params: [],
		return: [],
		tags: [],
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
		[ { name: 'functionDeclaration', description: 'Function declaration example.', params: [], return: [], tags: [] } ]
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( namedExport )[ 1 ], JSON.parse( namedExportAST ) ),
		[ { name: 'default', description: 'Function declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'IR - default (JSDoc in module dependency)', function( t ) {
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
			params: [],
			return: [],
			tags: [],
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
			params: [],
			return: [],
			tags: [],
		} ]
	);
	t.end();
} );

test( 'IR - named (JSDoc in export statement)', function( t ) {
	const tokenClass = fs.readFileSync(
		path.join( __dirname, './fixtures/named-class.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenClass ) ), [ {
		name: 'MyDeclaration',
		description: 'My declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenFn = fs.readFileSync(
		path.join( __dirname, './fixtures/named-function.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenFn ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenVariable = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variable.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariable ) ), [ {
		name: 'myDeclaration',
		description: 'My declaration example.',
		params: [],
		return: [],
		tags: [],
	} ] );
	const tokenVariables = fs.readFileSync(
		path.join( __dirname, './fixtures/named-variables.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokenVariables ) ), [
		{ name: 'firstDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] },
		{ name: 'secondDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] },
	] );
	t.end();
} );

test( 'IR - named (JSDoc in same file)', function( t ) {
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
		params: [],
		return: [],
		tags: [] },
	] );
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
		params: [],
		return: [],
		tags: [] },
	] );
	const tokens = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers.json' ),
		'utf-8'
	);
	const asts = fs.readFileSync(
		path.join( __dirname, './fixtures/named-identifiers-ast.json' ),
		'utf-8'
	);
	t.deepEqual( getIntermediateRepresentation( JSON.parse( tokens ), JSON.parse( asts ) ), [
		{ name: 'functionDeclaration', description: 'Function declaration example.', params: [], return: [], tags: [] },
		{ name: 'variableDeclaration', description: 'Variable declaration example.', params: [], return: [], tags: [] },
		{ name: 'ClassDeclaration', description: 'Class declaration example.', params: [], return: [], tags: [] },
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
		{ name: 'functionDeclaration', description: 'Function declaration example.', params: [], return: [], tags: [] },
		{ name: 'ClassDeclaration', description: 'Class declaration example.', params: [], return: [], tags: [] },
	] );
	t.deepEqual( getIntermediateRepresentation( JSON.parse( foo )[ 1 ], JSON.parse( bar ) ), [
		{ name: 'variableDeclaration', description: 'Variable declaration example.', params: [], return: [], tags: [] },
	] );
	t.end();
} );

test( 'IR - named (JSDoc in module dependency)', function( t ) {
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
		[ { name: 'default', description: 'Module declaration.', params: [], return: [], tags: [] } ]
	);
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
			{ name: 'functionDeclaration', description: 'Function declaration example.', params: [], return: [], tags: [] },
			{ name: 'variableDeclaration', description: 'Variable declaration example.', params: [], return: [], tags: [] },
			{ name: 'ClassDeclaration', description: 'Class declaration example.', params: [], return: [], tags: [] },
		]
	);
	const tokenDefaultExported = fs.readFileSync(
		path.join( __dirname, './fixtures/named-default-exported.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenDefaultExported ), { body: [] }, getModule ),
		[ { name: 'moduleName', description: 'Module declaration.', params: [], return: [], tags: [] } ]
	);
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
		[ { name: 'variables', description: 'Undocumented declaration.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'IR - namespace (JSDoc in module dependency)', function( t ) {
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
			{ name: 'myVariable', description: 'Named variable.', params: [], return: [], tags: [] },
			{ name: 'myFunction', description: 'Named function.', params: [], return: [], tags: [] },
			{ name: 'MyClass', description: 'Named class.', params: [], return: [], tags: [] },
		]
	);
	const tokenCommented = fs.readFileSync(
		path.join( __dirname, './fixtures/namespace-commented.json' ),
		'utf-8'
	);
	t.deepEqual(
		getIntermediateRepresentation( JSON.parse( tokenCommented ), { body: [] }, getModule ),
		[
			{ name: 'myVariable', description: 'Named variable.', params: [], return: [], tags: [] },
			{ name: 'myFunction', description: 'Named function.', params: [], return: [], tags: [] },
			{ name: 'MyClass', description: 'Named class.', params: [], return: [], tags: [] },
		]
	);
	t.end();
} );
