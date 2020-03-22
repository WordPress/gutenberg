/**
 * Node dependencies.
 */
const path = require( 'path' );

/**
 * Internal dependencies.
 */
const compile = require( '../compile' );
const getIntermediateRepresentation = require( '../get-intermediate-representation' );

describe( 'Intermediate Representation From Statement', function() {
	const prepare = ( dir ) => {
		const filePath = path.join( __dirname, 'fixtures', dir, 'code.js' );
		const { typeChecker, sourceFile, exportStatements } = compile(
			filePath
		);

		return {
			typeChecker,
			sourceFile,
			exportStatements,
		};
	};

	it( 'undocumented (no comments)', function() {
		const { typeChecker, exportStatements, sourceFile } = prepare(
			'default-undocumented-nocomments'
		);
		const ir = getIntermediateRepresentation(
			null,
			exportStatements,
			typeChecker,
			sourceFile
		);
		expect( ir ).toHaveLength( 1 );
		expect( ir[ 0 ] ).toEqual( {
			path: null,
			name: 'default',
			description: 'Undocumented declaration.',
			tags: [],
		} );
	} );

	it( 'undocumented (one liner)', function() {
		const { typeChecker, exportStatements, sourceFile } = prepare(
			'default-undocumented-oneliner'
		);
		const irOneliner = getIntermediateRepresentation(
			null,
			exportStatements,
			typeChecker,
			sourceFile
		);
		expect( irOneliner ).toHaveLength( 1 );
		expect( irOneliner[ 0 ] ).toEqual( {
			path: null,
			name: 'default',
			description: 'Undocumented declaration.',
			tags: [],
		} );
	} );

	it( 'parses TypeScript type correctly', () => {
		const { typeChecker, exportStatements } = prepare(
			'tags-ts-definition'
		);
		const ir = getIntermediateRepresentation(
			null,
			exportStatements,
			typeChecker
		);
		expect( ir ).toHaveLength( 1 );
		expect( ir[ 0 ] ).toEqual( {
			path: null,
			name: 'default',
			description:
				'Function invoking callback after delay with current timestamp in milliseconds\nsince epoch.',
			tags: [
				{
					description: 'Callback function.',
					name: 'callback',
					title: 'param',
					type: '(timestamp: number) => void',
				},
			],
		} );
	} );

	describe( 'JSDoc in export statement', function() {
		describe( 'default export', function() {
			it( 'class anonymous', function() {
				const { typeChecker, exportStatements } = prepare(
					'default-class-anonymous'
				);
				const irClassAnonymous = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irClassAnonymous ).toHaveLength( 1 );
				expect( irClassAnonymous[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Class declaration example.',
					tags: [],
				} );
			} );

			it( 'class named', function() {
				const { typeChecker, exportStatements } = prepare(
					'default-class-named'
				);
				const irClassNamed = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irClassNamed ).toHaveLength( 1 );
				expect( irClassNamed[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Class declaration example.',
					tags: [],
				} );
			} );

			it( 'function anonymous', function() {
				const { typeChecker, exportStatements } = prepare(
					'default-function-anonymous'
				);
				const irFnAnonymous = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irFnAnonymous ).toHaveLength( 1 );
				expect( irFnAnonymous[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Function declaration example.',
					tags: [],
				} );
			} );

			it( 'function named', function() {
				const { typeChecker, exportStatements } = prepare(
					'default-function-named'
				);
				const irFnNamed = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irFnNamed[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Function declaration example.',
					tags: [],
				} );
			} );

			it( 'variable', function() {
				const { typeChecker, exportStatements } = prepare(
					'default-variable'
				);
				const irVar = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irVar[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Variable declaration example.',
					tags: [],
				} );
			} );
		} );

		describe( 'named export', function() {
			it( 'class', function() {
				const { typeChecker, exportStatements } = prepare(
					'named-class'
				);
				const irNamedClass = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irNamedClass ).toHaveLength( 1 );
				expect( irNamedClass[ 0 ] ).toEqual( {
					path: null,
					name: 'MyDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );

			it( 'function', function() {
				const { typeChecker, exportStatements } = prepare(
					'named-function'
				);
				const irNamedFn = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irNamedFn ).toHaveLength( 1 );
				expect( irNamedFn[ 0 ] ).toEqual( {
					path: null,
					name: 'myDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );

			it( 'variable', function() {
				const { typeChecker, exportStatements } = prepare(
					'named-variable'
				);
				const irNamedVar = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irNamedVar ).toHaveLength( 1 );
				expect( irNamedVar[ 0 ] ).toEqual( {
					path: null,
					name: 'myDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );

			it( 'variables', function() {
				const { typeChecker, exportStatements } = prepare(
					'named-variables'
				);
				const irNamedVars = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker
				);
				expect( irNamedVars ).toHaveLength( 2 );
				expect( irNamedVars[ 0 ] ).toEqual( {
					path: null,
					name: 'firstDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
				expect( irNamedVars[ 1 ] ).toEqual( {
					path: null,
					name: 'secondDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );
		} );
	} );

	describe( 'JSDoc in same file', function() {
		describe( 'default export', function() {
			it( 'identifier', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'default-identifier'
				);
				const irDefaultId = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irDefaultId ).toHaveLength( 1 );
				expect( irDefaultId[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Class declaration example.',
					tags: [],
				} );
			} );

			it( 'named export', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'default-named-export'
				);
				const irDefaultNamed = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irDefaultNamed ).toHaveLength( 2 );
				expect( irDefaultNamed[ 0 ] ).toEqual( {
					path: null,
					name: 'functionDeclaration',
					description: 'Function declaration example.',
					tags: [],
				} );
				expect( irDefaultNamed[ 1 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Function declaration example.',
					tags: [],
				} );
			} );
		} );

		describe( 'named export', function() {
			it( 'identifier', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-identifier'
				);
				const irNamedId = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamedId ).toHaveLength( 1 );
				expect( irNamedId[ 0 ] ).toEqual( {
					path: null,
					name: 'myDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );

			it( 'identifier destructuring', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-identifier-destructuring'
				);
				const irNamedIdDestructuring = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamedIdDestructuring ).toHaveLength( 1 );
				expect( irNamedIdDestructuring[ 0 ] ).toEqual( {
					path: null,
					name: 'myDeclaration',
					description: 'My declaration example.',
					tags: [],
				} );
			} );

			it( 'identifiers', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-identifiers'
				);
				const irIds = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irIds ).toHaveLength( 3 );
				expect( irIds[ 0 ] ).toEqual( {
					path: null,
					name: 'functionDeclaration',
					description: 'Function declaration example.',
					tags: [],
				} );
				expect( irIds[ 1 ] ).toEqual( {
					path: null,
					name: 'variableDeclaration',
					description: 'Variable declaration example.',
					tags: [],
				} );
				expect( irIds[ 2 ] ).toEqual( {
					path: null,
					name: 'ClassDeclaration',
					description: 'Class declaration example.',
					tags: [],
				} );
			} );

			it( 'identifiers (inline)', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-identifiers-and-inline'
				);
				const irIdInline = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irIdInline ).toHaveLength( 3 );
				expect( irIdInline[ 0 ] ).toEqual( {
					path: null,
					name: 'functionDeclaration',
					description: 'Function declaration example.',
					tags: [],
				} );
				expect( irIdInline[ 1 ] ).toEqual( {
					path: null,
					name: 'ClassDeclaration',
					description: 'Class declaration example.',
					tags: [],
				} );
				expect( irIdInline[ 2 ] ).toEqual( {
					path: null,
					name: 'variableDeclaration',
					description: 'Variable declaration example.',
					tags: [],
				} );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency', function() {
		it( 'named export', function() {
			const { sourceFile, typeChecker, exportStatements } = prepare(
				'named-import-named'
			);
			const ir = getIntermediateRepresentation(
				null,
				exportStatements,
				typeChecker,
				sourceFile
			);
			expect( ir ).toHaveLength( 3 );
			expect( ir[ 0 ] ).toEqual( {
				path: null,
				name: 'functionDeclaration',
				description: 'Function declaration example.',
				tags: [],
			} );
			expect( ir[ 1 ] ).toEqual( {
				path: null,
				name: 'variableDeclaration',
				description: 'Variable declaration example.',
				tags: [],
			} );
			expect( ir[ 2 ] ).toEqual( {
				path: null,
				name: 'ClassDeclaration',
				description: 'Class declaration example.',
				tags: [],
			} );
		} );

		describe( 'default', function() {
			it( 'named', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-default'
				);
				const irNamedDefault = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamedDefault ).toHaveLength( 1 );
				expect( irNamedDefault[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Module declaration.',
					tags: [],
				} );
			} );

			it( 'named exported', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'named-default-exported'
				);
				const irNamedDefaultExported = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamedDefaultExported ).toHaveLength( 1 );
				expect( irNamedDefaultExported[ 0 ] ).toEqual( {
					path: null,
					name: 'moduleName',
					description: 'Module declaration.',
					tags: [],
				} );
			} );
		} );

		describe( 'namespace export', function() {
			it( 'simple', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'namespace'
				);
				const irNamespace = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamespace ).toHaveLength( 3 );
				expect( irNamespace[ 0 ] ).toEqual( {
					path: null,
					name: 'myVariable',
					description: 'Named variable.',
					tags: [],
				} );
				expect( irNamespace[ 1 ] ).toEqual( {
					path: null,
					name: 'myFunction',
					description: 'Named function.',
					tags: [],
				} );
				expect( irNamespace[ 2 ] ).toEqual( {
					path: null,
					name: 'MyClass',
					description: 'Named class.',
					tags: [],
				} );
			} );

			it( 'commented', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'namespace-commented'
				);
				const irNamespaceCommented = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamespaceCommented ).toHaveLength( 3 );
				expect( irNamespaceCommented[ 0 ] ).toEqual( {
					path: null,
					name: 'myVariable',
					description: 'Named variable.',
					tags: [],
				} );
				expect( irNamespaceCommented[ 1 ] ).toEqual( {
					path: null,
					name: 'myFunction',
					description: 'Named function.',
					tags: [],
				} );
				expect( irNamespaceCommented[ 2 ] ).toEqual( {
					path: null,
					name: 'MyClass',
					description: 'Named class.',
					tags: [],
				} );
			} );
		} );
	} );

	describe( 'JSDoc in module dependency through import', function() {
		describe( 'default export', function() {
			it( 'import default', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'default-import-default'
				);
				const irDefault = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irDefault ).toHaveLength( 1 );
				expect( irDefault[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Function declaration.',
					tags: [],
				} );
			} );

			it( 'import named', function() {
				const { sourceFile, typeChecker, exportStatements } = prepare(
					'default-import-named'
				);
				const irNamed = getIntermediateRepresentation(
					null,
					exportStatements,
					typeChecker,
					sourceFile
				);
				expect( irNamed ).toHaveLength( 1 );
				expect( irNamed[ 0 ] ).toEqual( {
					path: null,
					name: 'default',
					description: 'Function declaration.',
					tags: [],
				} );
			} );
		} );

		it( 'named export', function() {
			const { sourceFile, typeChecker, exportStatements } = prepare(
				'named-import-namespace'
			);
			const ir = getIntermediateRepresentation(
				null,
				exportStatements,
				typeChecker,
				sourceFile
			);
			expect( ir ).toHaveLength( 1 );
			expect( ir[ 0 ] ).toEqual( {
				path: null,
				name: 'variables',
				description: 'Undocumented declaration.',
				tags: [],
			} );
		} );
	} );
} );
