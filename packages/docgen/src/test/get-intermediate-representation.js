/**
 * Node dependencies.
 */
const fs = require( 'fs' );
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const getIntermediateRepresentation = require( '../get-intermediate-representation' );

describe( 'Intermediate Representation', function() {
	it( 'undocumented', function() {
		const token = fs.readFileSync(
			path.join( __dirname, './fixtures/default-undocumented-nocomments/exports.json' ),
			'utf-8'
		);
		const ir = getIntermediateRepresentation( null, JSON.parse( token ) );
		expect( ir ).toHaveLength( 1 );
		expect( ir[ 0 ] ).toEqual( {
			path: null,
			name: 'default',
			description: 'Undocumented declaration.',
			tags: [],
			lineStart: 3,
			lineEnd: 3,
		} );
		const tokenOneliner = fs.readFileSync(
			path.join( __dirname, './fixtures/default-undocumented-oneliner/exports.json' ),
			'utf-8'
		);
		const irOneliner = getIntermediateRepresentation( null, JSON.parse( tokenOneliner ) );
		expect( irOneliner ).toHaveLength( 1 );
		expect( irOneliner[ 0 ] ).toEqual( {
			path: null,
			name: 'default',
			description: 'Undocumented declaration.',
			tags: [],
			lineStart: 2,
			lineEnd: 2,
		} );
	} );

	describe( 'JSDoc in export statement', function() {
		it( 'default export', function() {
			const tokenClassAnonymous = fs.readFileSync(
				path.join( __dirname, './fixtures/default-class-anonymous/exports.json' ),
				'utf-8'
			);
			const irClassAnonymous = getIntermediateRepresentation( null, JSON.parse( tokenClassAnonymous ) );
			expect( irClassAnonymous ).toHaveLength( 1 );
			expect( irClassAnonymous[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Class declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenClassNamed = fs.readFileSync(
				path.join( __dirname, './fixtures/default-class-named/exports.json' ),
				'utf-8'
			);
			const irClassNamed = getIntermediateRepresentation( null, JSON.parse( tokenClassNamed ) );
			expect( irClassNamed ).toHaveLength( 1 );
			expect( irClassNamed[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Class declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenFnAnonymous = fs.readFileSync(
				path.join( __dirname, './fixtures/default-function-anonymous/exports.json' ),
				'utf-8'
			);
			const irFnAnonymous = getIntermediateRepresentation( null, JSON.parse( tokenFnAnonymous ) );
			expect( irFnAnonymous ).toHaveLength( 1 );
			expect( irFnAnonymous[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Function declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenFnNamed = fs.readFileSync(
				path.join( __dirname, './fixtures/default-function-named/exports.json' ),
				'utf-8'
			);
			const irFnNamed = getIntermediateRepresentation( null, JSON.parse( tokenFnNamed ) );
			expect( irFnNamed[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Function declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenVariable = fs.readFileSync(
				path.join( __dirname, './fixtures/default-variable/exports.json' ),
				'utf-8'
			);
			const irVar = getIntermediateRepresentation( null, JSON.parse( tokenVariable ) );
			expect( irVar[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Variable declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
		} );
		it( 'named export', function() {
			const tokenClass = fs.readFileSync(
				path.join( __dirname, './fixtures/named-class/exports.json' ),
				'utf-8'
			);
			const irNamedClass = getIntermediateRepresentation( null, JSON.parse( tokenClass ) );
			expect( irNamedClass ).toHaveLength( 1 );
			expect( irNamedClass[ 0 ] ).toEqual( {
				path: null,
				name: 'MyDeclaration',
				description: 'My declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenFn = fs.readFileSync(
				path.join( __dirname, './fixtures/named-function/exports.json' ),
				'utf-8'
			);
			const irNamedFn = getIntermediateRepresentation( null, JSON.parse( tokenFn ) );
			expect( irNamedFn ).toHaveLength( 1 );
			expect( irNamedFn[ 0 ] ).toEqual( {
				path: null,
				name: 'myDeclaration',
				description: 'My declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenVariable = fs.readFileSync(
				path.join( __dirname, './fixtures/named-variable/exports.json' ),
				'utf-8'
			);
			const irNamedVar = getIntermediateRepresentation( null, JSON.parse( tokenVariable ) );
			expect( irNamedVar ).toHaveLength( 1 );
			expect( irNamedVar[ 0 ] ).toEqual( {
				path: null,
				name: 'myDeclaration',
				description: 'My declaration example.',
				tags: [],
				lineStart: 4,
				lineEnd: 4,
			} );
			const tokenVariables = fs.readFileSync(
				path.join( __dirname, './fixtures/named-variables/exports.json' ),
				'utf-8'
			);
			const irNamedVars = getIntermediateRepresentation( null, JSON.parse( tokenVariables ) );
			expect( irNamedVars ).toHaveLength( 2 );
			expect( irNamedVars[ 0 ] ).toEqual(
				{ path: null, name: 'firstDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
			);
			expect( irNamedVars[ 1 ] ).toEqual(
				{ path: null, name: 'secondDeclaration', description: 'My declaration example.', tags: [], lineStart: 4, lineEnd: 5 },
			);
		} );
	} );

	describe( 'JSDoc in same file', function() {
		it( 'default export', function() {
			const token = fs.readFileSync(
				path.join( __dirname, './fixtures/default-identifier/exports.json' ),
				'utf-8'
			);
			const ast = fs.readFileSync(
				path.join( __dirname, './fixtures/default-identifier/ast.json' ),
				'utf-8'
			);
			const irDefaultId = getIntermediateRepresentation( null, JSON.parse( token ), JSON.parse( ast ) );
			expect( irDefaultId ).toHaveLength( 1 );
			expect( irDefaultId[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Class declaration example.',
				tags: [],
				lineStart: 6,
				lineEnd: 6,
			} );
			const namedExport = fs.readFileSync(
				path.join( __dirname, './fixtures/default-named-export/exports.json' ),
				'utf-8'
			);
			const namedExportAST = fs.readFileSync(
				path.join( __dirname, './fixtures/default-named-export/ast.json' ),
				'utf-8'
			);
			const irDefaultNamed0 = getIntermediateRepresentation( null, JSON.parse( namedExport )[ 0 ], JSON.parse( namedExportAST ) );
			expect( irDefaultNamed0 ).toHaveLength( 1 );
			expect( irDefaultNamed0[ 0 ] ).toEqual(
				{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 4, lineEnd: 4 }
			);
			const irDefaultNamed1 = getIntermediateRepresentation( null, JSON.parse( namedExport )[ 1 ], JSON.parse( namedExportAST ) );
			expect( irDefaultNamed1[ 0 ] ).toEqual(
				{ path: null, name: 'default', description: 'Function declaration example.', tags: [], lineStart: 6, lineEnd: 6 }
			);
		} );

		it( 'named export', function() {
			const token = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifier/exports.json' ),
				'utf-8'
			);
			const ast = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifier/ast.json' ),
				'utf-8'
			);
			const irNamedId = getIntermediateRepresentation( null, JSON.parse( token ), JSON.parse( ast ) );
			expect( irNamedId ).toHaveLength( 1 );
			expect( irNamedId[ 0 ] ).toEqual( {
				path: null,
				name: 'myDeclaration',
				description: 'My declaration example.',
				tags: [],
				lineStart: 6,
				lineEnd: 6,
			} );
			const tokenObject = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifier-destructuring/exports.json' ),
				'utf-8'
			);
			const astObject = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifier-destructuring/ast.json' ),
				'utf-8'
			);
			const irNamedIdDestructuring = getIntermediateRepresentation( null, JSON.parse( tokenObject ), JSON.parse( astObject ) );
			expect( irNamedIdDestructuring ).toHaveLength( 1 );
			expect( irNamedIdDestructuring[ 0 ] ).toEqual( {
				path: null,
				name: 'myDeclaration',
				description: 'My declaration example.',
				tags: [],
				lineStart: 6,
				lineEnd: 6,
			} );
			const tokens = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifiers/exports.json' ),
				'utf-8'
			);
			const asts = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifiers/ast.json' ),
				'utf-8'
			);
			const irIds = getIntermediateRepresentation( null, JSON.parse( tokens ), JSON.parse( asts ) );
			expect( irIds ).toHaveLength( 3 );
			expect( irIds[ 0 ] ).toEqual(
				{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 16, lineEnd: 16 }
			);
			expect( irIds[ 1 ] ).toEqual(
				{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 }
			);
			expect( irIds[ 2 ] ).toEqual(
				{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 16, lineEnd: 16 }
			);
			const foo = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifiers-and-inline/exports.json' ),
				'utf-8'
			);
			const bar = fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifiers-and-inline/ast.json' ),
				'utf-8'
			);
			const irIdInline0 = getIntermediateRepresentation( null, JSON.parse( foo )[ 0 ], JSON.parse( bar ) );
			expect( irIdInline0 ).toHaveLength( 2 );
			expect( irIdInline0[ 0 ] ).toEqual(
				{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 11, lineEnd: 11 }
			);
			expect( irIdInline0[ 1 ] ).toEqual(
				{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 11, lineEnd: 11 }
			);
			const irIdInline1 = getIntermediateRepresentation( null, JSON.parse( foo )[ 1 ], JSON.parse( bar ) );
			expect( irIdInline1[ 0 ] ).toEqual(
				{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 16, lineEnd: 16 }
			);
		} );
	} );

	describe( 'JSDoc in module dependency', function() {
		it( 'named export', function() {
			const tokenImportNamed = fs.readFileSync(
				path.join( __dirname, './fixtures/named-import-named/exports.json' ),
				'utf-8'
			);
			const getModuleImportNamed = () => JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/named-identifiers/ir.json' ),
				'utf-8'
			) );
			const ir = getIntermediateRepresentation( null, JSON.parse( tokenImportNamed ), { body: [] }, getModuleImportNamed );
			expect( ir ).toHaveLength( 3 );
			expect( ir[ 0 ] ).toEqual(
				{ path: null, name: 'functionDeclaration', description: 'Function declaration example.', tags: [], lineStart: 2, lineEnd: 2 }
			);
			expect( ir[ 1 ] ).toEqual(
				{ path: null, name: 'variableDeclaration', description: 'Variable declaration example.', tags: [], lineStart: 3, lineEnd: 3 }
			);
			expect( ir[ 2 ] ).toEqual(
				{ path: null, name: 'ClassDeclaration', description: 'Class declaration example.', tags: [], lineStart: 4, lineEnd: 4 }

			);
		} );

		it( 'named default export', function() {
			const tokenDefault = fs.readFileSync(
				path.join( __dirname, './fixtures/named-default/exports.json' ),
				'utf-8'
			);
			const getModule = () => JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/named-default/module-ir.json' ),
				'utf-8'
			) );
			const irNamedDefault = getIntermediateRepresentation( null, JSON.parse( tokenDefault ), { body: [] }, getModule );
			expect( irNamedDefault ).toHaveLength( 1 );
			expect( irNamedDefault[ 0 ] ).toEqual(
				{ path: null, name: 'default', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 }
			);
			const tokenDefaultExported = fs.readFileSync(
				path.join( __dirname, './fixtures/named-default-exported/exports.json' ),
				'utf-8'
			);
			const irNamedDefaultExported = getIntermediateRepresentation( null, JSON.parse( tokenDefaultExported ), { body: [] }, getModule );
			expect( irNamedDefaultExported ).toHaveLength( 1 );
			expect( irNamedDefaultExported[ 0 ] ).toEqual(
				{ path: null, name: 'moduleName', description: 'Module declaration.', tags: [], lineStart: 1, lineEnd: 1 }
			);
		} );

		it( 'namespace export', function() {
			const token = fs.readFileSync(
				path.join( __dirname, './fixtures/namespace/exports.json' ),
				'utf-8'
			);
			const getModule = () => JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/namespace/module-ir.json' ),
				'utf-8'
			) );
			const irNamespace = getIntermediateRepresentation( null, JSON.parse( token ), { body: [] }, getModule );
			expect( irNamespace ).toHaveLength( 3 );
			expect( irNamespace[ 0 ] ).toEqual(
				{ path: null, name: 'MyClass', description: 'Named class.', tags: [], lineStart: 1, lineEnd: 1 }
			);
			expect( irNamespace[ 1 ] ).toEqual(
				{ path: null, name: 'myFunction', description: 'Named function.', tags: [], lineStart: 1, lineEnd: 1 }
			);
			expect( irNamespace[ 2 ] ).toEqual(
				{ path: null, name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 1, lineEnd: 1 }
			);
			const tokenCommented = fs.readFileSync(
				path.join( __dirname, './fixtures/namespace-commented/exports.json' ),
				'utf-8'
			);
			const irNamespaceCommented = getIntermediateRepresentation( null, JSON.parse( tokenCommented ), { body: [] }, getModule );
			expect( irNamespaceCommented ).toHaveLength( 3 );
			expect( irNamespaceCommented[ 0 ] ).toEqual(
				{ path: null, name: 'MyClass', description: 'Named class.', tags: [], lineStart: 4, lineEnd: 4 }
			);
			expect( irNamespaceCommented[ 1 ] ).toEqual(
				{ path: null, name: 'myFunction', description: 'Named function.', tags: [], lineStart: 4, lineEnd: 4 }
			);
			expect( irNamespaceCommented[ 2 ] ).toEqual(
				{ path: null, name: 'myVariable', description: 'Named variable.', tags: [], lineStart: 4, lineEnd: 4 }
			);
		} );
	} );

	describe( 'JSDoc in module dependency through import', function() {
		it( 'default export', function() {
			const tokenDefault = fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-default/exports.json' ),
				'utf-8'
			);
			const astDefault = fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-default/ast.json' ),
				'utf-8'
			);
			const getModuleDefault = () => JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-default/module-ir.json' ),
				'utf-8'
			) );
			const irDefault = getIntermediateRepresentation( null, JSON.parse( tokenDefault ), JSON.parse( astDefault ), getModuleDefault );
			expect( irDefault ).toHaveLength( 1 );
			expect( irDefault[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Function declaration.',
				tags: [],
				lineStart: 3,
				lineEnd: 3,
			} );
			const tokenNamed = fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-named/exports.json' ),
				'utf-8'
			);
			const astNamed = fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-named/ast.json' ),
				'utf-8'
			);
			const getModuleNamed = () => JSON.parse( fs.readFileSync(
				path.join( __dirname, './fixtures/default-import-named/module-ir.json' ),
				'utf-8'
			) );
			const irNamed = getIntermediateRepresentation( null, JSON.parse( tokenNamed ), JSON.parse( astNamed ), getModuleNamed );
			expect( irNamed ).toHaveLength( 1 );
			expect( irNamed[ 0 ] ).toEqual( {
				path: null,
				name: 'default',
				description: 'Function declaration.',
				tags: [],
				lineStart: 3,
				lineEnd: 3,
			} );
		} );

		it( 'named export', function() {
			const tokenImportNamespace = fs.readFileSync(
				path.join( __dirname, './fixtures/named-import-namespace/exports.json' ),
				'utf-8'
			);
			const astImportNamespace = fs.readFileSync(
				path.join( __dirname, './fixtures/named-import-namespace/ast.json' ),
				'utf-8'
			);
			const getModuleImportNamespace = ( filePath ) => {
				if ( filePath === './named-import-namespace-module' ) {
					return JSON.parse( fs.readFileSync(
						path.join( __dirname, './fixtures/named-import-namespace/module-ir.json' ),
						'utf-8'
					) );
				}
				return JSON.parse( fs.readFileSync(
					path.join( __dirname, './fixtures/default-function/ir.json' ),
					'utf-8'
				) );
			};
			const ir = getIntermediateRepresentation( null, JSON.parse( tokenImportNamespace ), JSON.parse( astImportNamespace ), getModuleImportNamespace );
			expect( ir ).toHaveLength( 1 );
			expect( ir[ 0 ] ).toEqual(
				{ path: null, name: 'variables', description: 'Undocumented declaration.', tags: [], lineStart: 3, lineEnd: 3 }
			);
		} );
	} );
} );
