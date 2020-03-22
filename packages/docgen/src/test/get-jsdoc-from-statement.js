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

	it( 'extracts description and tags (from function)', () => {
		const { typeChecker, sourceFile } = prepare( 'tags-function' );

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
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
					title: 'see',
					description:
						'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
				},
				{
					title: 'param',
					description: 'The first param to add.',
					type: 'number',
					name: 'firstParam',
				},
				{
					title: 'param',
					description: 'The second param to add.',
					type: 'number',
					name: 'secondParam',
				},
				{
					title: 'example',
					description:
						"```js\nconst x = require('@wordpress/test');\n\nconst addResult = sum( 1, 3 );\nconsole.log( addResult ); // will yield 4\n```",
				},
				{
					title: 'return',
					description: 'The result of adding the two params.',
					type: 'number',
				},
			],
		} );
	} );

	it( 'extracts description and tags (from variable)', () => {
		const { typeChecker, sourceFile } = prepare( 'tags-variable' );

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description:
				'Constant to document the meaning of life,\nthe universe and everything else.',
			tags: [
				{
					title: 'type',
					description: null,
					type: 'number',
				},
			],
		} );
	} );

	it( 'can extract types that are invalid in JSDoc but valid in TypeScript', () => {
		const { typeChecker, sourceFile } = prepare( 'tags-ts-definition' );

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description:
				'Function invoking callback after delay with current timestamp in milliseconds\nsince epoch.',
			tags: [
				{
					title: 'param',
					description: 'Callback function.',
					name: 'callback',
					type: '(timestamp: number) => void',
				},
			],
		} );
	} );

	it( 'can handle jsdoc comment without tags', () => {
		const { typeChecker, sourceFile } = prepare(
			'default-class-anonymous'
		);

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description: 'Class declaration example.',
			tags: [],
		} );
	} );

	it( 'extracts types correctly', () => {
		const { typeChecker, sourceFile } = prepare( 'tags-param-types' );

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description: 'A function with many params.',
			tags: [
				{
					title: 'param',
					description: 'The first param to add.',
					type: 'any',
					name: 'p0',
				},
				{
					title: 'param',
					description: 'File',
					type: 'File',
					name: 'p1',
				},
			],
		} );
	} );
} );
