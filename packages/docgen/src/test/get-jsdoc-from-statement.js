/**
 * Node dependencies.
 */
const { join } = require( 'path' );

/**
 * Internal dependencies.
 */
const compile = require( '../compile' );
const getJSDocFromToken = require( '../get-jsdoc-from-statement' );

describe( 'JSDoc', () => {
	const prepare = ( dir ) => {
		const filePath = join( __dirname, 'fixtures', dir, 'code.js' );
		const { typeChecker, sourceFile } = compile( filePath );

		return {
			typeChecker,
			sourceFile,
		};
	};

	// it( 'extracts description and tags (from function)', () => {
	// 	const { typeChecker, sourceFile } = prepare( 'tags-function' );

	// 	expect(
	// 		getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
	// 	).toEqual( {
	// 		description: 'A function that adds two parameters.',
	// 		tags: [
	// 			{
	// 				title: 'deprecated',
	// 				description: 'Use native addition instead.',
	// 			},
	// 			{
	// 				title: 'since',
	// 				description: 'v2',
	// 			},
	// 			{
	// 				title: 'see',
	// 				description: 'addition',
	// 			},
	// 			{
	// 				title: 'see',
	// 				description:
	// 					'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
	// 			},
	// 			{
	// 				title: 'param',
	// 				description: 'The first param to add.',
	// 				type: 'number',
	// 				name: 'firstParam',
	// 			},
	// 			{
	// 				title: 'param',
	// 				description: 'The second param to add.',
	// 				type: 'number',
	// 				name: 'secondParam',
	// 			},
	// 			{
	// 				title: 'example',
	// 				description:
	// 					"```js\nconst x = require('@wordpress/test');\n\nconst addResult = sum( 1, 3 );\nconsole.log( addResult ); // will yield 4\n```",
	// 			},
	// 			{
	// 				title: 'return',
	// 				description: 'The result of adding the two params.',
	// 				type: 'number',
	// 			},
	// 		],
	// 	} );
	// } );

	// it( 'extracts description and tags (from variable)', () => {
	// 	const { typeChecker, sourceFile } = prepare( 'tags-variable' );

	// 	expect(
	// 		getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
	// 	).toEqual( {
	// 		description:
	// 			'Constant to document the meaning of life,\nthe universe and everything else.',
	// 		tags: [
	// 			{
	// 				title: 'type',
	// 				description: null,
	// 				type: 'number',
	// 			},
	// 		],
	// 	} );
	// } );

	// it( 'can extract types that are invalid in JSDoc but valid in TypeScript', () => {
	// 	const { typeChecker, sourceFile } = prepare( 'tags-ts-definition' );

	// 	expect(
	// 		getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
	// 	).toEqual( {
	// 		description:
	// 			'Function invoking callback after delay with current timestamp in milliseconds\nsince epoch.',
	// 		tags: [
	// 			{
	// 				title: 'param',
	// 				description: 'Callback function.',
	// 				name: 'callback',
	// 				type: '(timestamp: number) => void',
	// 			},
	// 		],
	// 	} );
	// } );

	// it( 'can handle jsdoc comment without tags', () => {
	// 	const { typeChecker, sourceFile } = prepare(
	// 		'default-class-anonymous'
	// 	);

	// 	expect(
	// 		getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
	// 	).toEqual( {
	// 		description: 'Class declaration example.',
	// 		tags: [],
	// 	} );
	// } );

	it( 'extracts types correctly', () => {
		const { typeChecker, sourceFile } = prepare( 'tags-param-types' );
		const type = ( typeName, description ) => ( {
			title: 'param',
			name: 'p',
			description,
			type: typeName,
		} );
		const typeWithDefault = ( typeName, defaultValue, description ) => ( {
			title: 'param',
			name: 'p',
			description,
			type: typeName,
			defaultValue,
		} );

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description: 'A function with many params.',
			tags: [
				type( 'undocumented', 'undocumented type' ),
				type( 'any', 'any' ),
				type( 'any', 'jsdoc all types' ),
				type( 'unknown', 'jsdoc unknown' ),
				type( 'unknown', 'TS unknown' ),
				type( 'string', 'string' ),
				type( 'string', 'string in capital case' ),
				type( 'number', 'number' ),
				type( 'number', 'number in capital case' ),
				type( 'bigint', 'bigint' ),
				type( 'boolean', 'boolean' ),
				type( 'symbol', 'symbol' ),
				type( 'undefined', 'undefined' ),
				type( 'null', 'null' ),
				type( 'never', 'never' ),
				type( 'object', 'object' ),
				type( 'object', 'object in capital case' ),
				type( 'Record<string, number>', 'jsdoc record type' ),
				type( 'File', 'random type name' ),
				type( `'string literal'`, 'string literal' ),
				type( '42', 'number literal' ),
				type( 'true', 'true keyword' ),
				type( 'false', 'false keyword' ),
				type( 'typeof J', 'type query' ),
				type( 'number[]', 'number array' ),
				type( 'WPElements[]', 'array 2' ),
				type( 'WPElements[]', 'jsdoc style array' ),
				type( 'Array', 'simple array' ),
				type( '[string, number]', 'simple tuple' ),
				type(
					'[TypeChecker, SourceFile, string?]',
					'tuple with optional type'
				),
				type( 'string | null', 'jsdoc nullable 1' ),
				type( 'WPElements | null', 'jsdoc nullable 2' ),
				type( 'string | number', 'union type' ),
				type( 'X & Y', 'intersection type' ),
				type( '( X & Y ) | Z', 'union + intersection type' ),
				type( 'number | undefined', 'jsdoc optional type' ),
				type( 'number | undefined', 'jsdoc optional type 2' ),
				typeWithDefault(
					'number',
					42,
					'jsdoc optional with default: integer type'
				),
				typeWithDefault(
					'number',
					3.141592,
					'jsdoc optional with default: float type'
				),
				typeWithDefault(
					'string',
					'John Doe',
					'jsdoc optional with default: string type'
				),
				typeWithDefault(
					'string',
					"John 'Mark' Doe",
					'jsdoc optional with default: string type 2'
				),
				typeWithDefault(
					'string',
					`Test "double" 'single' quotes`,
					'jsdoc optional with default: string type 3'
				),
				typeWithDefault(
					'string',
					'10px',
					'jsdoc optional with default: string type 4'
				),
				typeWithDefault(
					'string | null',
					null,
					'jsdoc optional with default: null keyword'
				),
				typeWithDefault(
					'boolean',
					true,
					'jsdoc optional with default: true keyword'
				),
				typeWithDefault(
					'boolean',
					false,
					'jsdoc optional with default: false keyword'
				),
				typeWithDefault(
					'object',
					'{ x: 3, y: null }',
					'jsdoc optional with default: object type'
				),
				typeWithDefault(
					'number[]',
					'[ 1, 2, 3 ]',
					'jsdoc optional with default: array type'
				),
				type( '( XX | YY ) & ZZ', 'parenthesized type' ),
				type( 'string', 'jsdoc non-nullable type' ),
				type( 'string', 'jsdoc non-nullable type 2' ),
				type( '[string, ...X]', 'rest type' ),
				type( '...number', 'jsdoc variadic type' ),
				type( '(x: number, y: Test) => number', 'function type' ),
				type(
					'(a: string, b: string) => { x: string, y: string }',
					'function + type literal'
				),
				type( '(k: () => number) => React.FC', 'function arg' ),
				type( '() => void', 'function void return type' ),
				type( 'new () => T', 'constructor type' ),
				type( '(p0: b) => c', 'jsdoc function type' ),
				type( '{ x: number, y: XY }', 'type literal' ),
				type( '{ [setting: string]: any }', 'indexable interface' ),
				type(
					'{ j: (a: string) => number, k: number }',
					'function as type literal property type'
				),
				{
					title: 'param',
					name: 'p',
					description: 'jsdoc type literal',
					type: 'object',
					properties: [
						{
							name: 'p.x0',
							description: 'property 0',
							type: 'string',
						},
						{
							name: 'p.x1',
							description: 'property 1',
							type: 'XXX | undefined',
						},
						{
							name: 'p.x2',
							description: 'property 2',
							type: 'number',
							defaultValue: 11,
						},
					],
				},
				// type( '', '' ),
				// type( '', '' ),
				// type( '', '' ),
				// type( '', '' ),
				// type( '', '' ),
				// type( '', '' ),
			],
		} );
	} );
} );
