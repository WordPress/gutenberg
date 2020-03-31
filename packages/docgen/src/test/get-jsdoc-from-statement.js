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
			description: 'Registers a standard `@wordpress/data` store.',
			tags: [
				{
					title: 'deprecated',
					description:
						"since 5.6. Callers should use the `receiveAutosaves( postId, autosave )`\nselector from the '@wordpress/core-data' package.",
				},
				{
					title: 'since',
					description: '2.0.0',
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
					title: 'example',
					description: `\`\`\`js
// Using ES5 syntax

function MyButtonMoreMenuItem() {
	return wp.element.createElement(
		PluginMoreMenuItem,
		{
			icon: moreIcon,
			onClick: onButtonClick,
		},
		__( 'My button title' )
	);
}
\`\`\``,
				},
				{
					title: 'example',
					description: `\`\`\`jsx
// Using ESNext syntax

const MyButtonMoreMenuItem = () => (
	<PluginMoreMenuItem
		icon={ more }
		onClick={ onButtonClick }
	>
		{ __( 'My button title' ) }
	</PluginMoreMenuItem>
);
\`\`\``,
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
					type: '( timestamp: number ) => void',
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
				{
					title: 'param',
					name: '',
					type: '(unknown type) or (type error)',
					description: '++} p unknown type or error',
				},
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
				type( 'RandomName<string | number, number, Y>', 'generics' ),
				type(
					'React.Component<Props, State>',
					'generics with qualified name'
				),
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
				type( '[ string, number ]', 'simple tuple' ),
				type(
					'[ TypeChecker, SourceFile, string? ]',
					'tuple with optional type'
				),
				type( 'string | null', 'jsdoc nullable 1' ),
				type( 'WPElements | null', 'jsdoc nullable 2' ),
				type( 'string | number', 'union type' ),
				type( 'X & Y', 'intersection type' ),
				type( '( X & Y ) | Z', 'union + intersection type' ),
				type( 'number | undefined', 'jsdoc optional type' ),
				type( 'number | undefined', 'jsdoc optional type 2' ),
				type( 'string | undefined', null ),
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
				// Known issue: The test below fails.
				// typeWithDefault(
				// 	'string',
				// 	`Test "double" 'single' \`backtick\` quotes`,
				// 	'jsdoc optional with default: string type 4'
				// ),
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
				typeWithDefault(
					'( number[] | number )[]',
					'[ 1, [ 2, 3 ] ]',
					'jsdoc optional with default: nested array type'
				),
				// Known issue: the test below fails
				// typeWithDefault(
				// 	'object',
				// 	'{x:[1,2]}',
				// 	'jsdoc optional with default: array in object'
				// ),
				typeWithDefault(
					'boolean',
					true,
					'Whether block selection should\n be enabled.'
				),
				typeWithDefault( 'string', 'gutenberg', null ),
				type( '( XX | YY ) & ZZ', 'parenthesized type' ),
				type( 'string', 'jsdoc non-nullable type' ),
				type( 'string', 'jsdoc non-nullable type 2' ),
				type( '[ string, ...X ]', 'rest type' ),
				type( '...number', 'jsdoc variadic type' ),
				type( '( x: number, y: Test ) => number', 'function type' ),
				type(
					'( a: string, b: string ) => { x: string, y: string }',
					'function + type literal'
				),
				type( '( k: () => number ) => React.FC', 'function arg' ),
				type( '() => void', 'function void return type' ),
				type( 'new () => T', 'constructor type' ),
				type( '( p0: b ) => c', 'jsdoc function type' ),
				type( '{ x: number, y: XY }', 'type literal' ),
				type( '{ [ setting: string ]: any }', 'indexable interface' ),
				type(
					'{ j: ( a: string ) => number, k: number }',
					'function as type literal property type'
				),
				{
					title: 'param',
					name: 'p',
					description: 'jsdoc type literal',
					type: 'object',
					properties: [
						{
							name: 'x0',
							description: 'property 0',
							type: 'string',
						},
						{
							name: 'x1',
							description: 'property 1',
							type: 'XXX | undefined',
						},
						{
							name: 'x2',
							description: 'property 2',
							type: 'number',
							defaultValue: 11,
						},
					],
				},
				{
					title: 'param',
					name: 'p',
					description: 'nullable obj',
					type: 'object | null',
					properties: [
						{
							name: 'version',
							description:
								'Version in which the feature will be removed.',
							type: 'string | null',
						},
					],
				},
				{
					title: 'param',
					name: 'p',
					description: 'optional obj',
					type: 'object | undefined',
					properties: [
						{
							name: 'number',
							description: 'number description',
							type: 'number | null',
						},
						{
							name: 'number2',
							description: 'number2 description',
							type: 'number | null',
						},
					],
				},
				{
					title: 'param',
					name: 'p',
					description: 'optional obj 2',
					type: 'object | undefined',
					properties: [
						{
							name: 'bo',
							description: 'boolean description',
							type: 'boolean',
						},
					],
				},
				type( 'keyof X', 'jsdoc type operator 1: keyof' ),
				type( 'readonly Y', 'jsdoc type operator 2: readonly' ),
				type( 'unique symbol', 'jsdoc type operator 3: unique' ),
				type( "T[ 'key' ]", 'indexed access type' ),
				type(
					'{ [ P in keyof T ]?: T[ P ] }',
					'mapped type 1: Partial'
				),
				type(
					'{ [ P in keyof T ]: T[ P ] | null }',
					'mapped type 2: Nullable'
				),
				type(
					'{ readonly [ P in keyof T ]: T[ P ] }',
					'mapped type 3: Readonly'
				),
				type( 'T extends U ? X : Y', 'conditional type' ),
				type(
					'T extends ( ...args: any[] ) => infer R ? R : any',
					'infer type: ReturnType'
				),
				type( "import( 'typescript' ).Statement", 'import type' ),
				type(
					"import( '@wordpress/element' ).WPSyntheticEvent",
					'what if @wordpress?'
				),
				type( 'WPEditorInserterItem', 'typedef' ),
				{
					title: 'param',
					name: '__experimentalParam',
					description: "It's experimental",
					type: 'string',
				},
				{
					title: 'param',
					name: '__unstableParam',
					description: "It's unstable",
					type: 'number',
				},
				{
					title: 'param',
					name: 'p.val',
					description:
						'Test when 2 consecutive qualified names have different first part.',
					type: 'string',
				},
				{
					title: 'param',
					name: 'props.value',
					description:
						'Qualified name without an object definition above.',
					type: 'boolean',
				},
				{
					title: 'typedef',
					name: 'WPEditorInserterItem',
					description: null,
					type: 'object',
					properties: [
						{
							name: 'id',
							description: 'Unique identifier for the item.',
							type: 'number',
						},
						{
							name: 'name',
							description: 'The type of block to create.',
							type: 'string',
						},
						{
							name: '__experimentalBlockDirectory',
							description:
								'Whether the user has enabled the Block Directory',
							type: 'boolean',
						},
						{
							name: '__unstableProp',
							description: 'This is unstable.',
							type: 'boolean',
						},
					],
				},
			],
		} );
	} );

	it( 'can handle qualified names at the top', () => {
		const { typeChecker, sourceFile } = prepare(
			'tags-param-qualified-name-at-top'
		);

		expect(
			getJSDocFromToken( sourceFile.statements[ 0 ], typeChecker )
		).toEqual( {
			description: null,
			tags: [
				{
					title: 'param',
					description: 'name description',
					name: 'props.name',
					type: 'string',
				},
				{
					title: 'param',
					description: 'val description',
					name: 'props.val',
					type: 'string',
				},
			],
		} );
	} );
} );
