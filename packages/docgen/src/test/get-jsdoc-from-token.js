/**
 * Internal dependencies.
 */
const getJSDocFromToken = require( '../get-jsdoc-from-token' );

describe( 'Parse JSDoc and extract description and tags', () => {
	it( 'Normal definition', () => {
		const code = `
 *
 * A function that adds two parameters.
 *
 * @deprecated Use native addition instead.
 * @since v2
 *
 * @see addition
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators
 *
 * @param {number} firstParam The first param to add.
 * @param {number} secondParam The second param to add.
 *
 *  @example
 *
 * \`\`\`js
 * const addResult = sum( 1, 3 );
 * console.log( addResult ); // will yield 4
 * \`\`\`
 *
 * @return {number} The result of adding the two params.
`.trim();

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: code,
					},
				],
			} )
		).toEqual( {
			description: 'A function that adds two parameters.',
			tags: [
				{
					title: 'deprecated',
					description: 'Use native addition instead.',
				},
				{
					title: 'since',
					version: 'v2',
					description: '',
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
						'```js\nconst addResult = sum( 1, 3 );\nconsole.log( addResult ); // will yield 4\n```',
				},
				{
					title: 'return',
					description: 'The result of adding the two params.',
					type: 'number',
				},
			],
		} );

		// Test spaces in code are preserved.
		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						// Adapted from packages/compose/src/hooks/use-resize-observer/index.js
						value:
							'*\n * X\n *\n * @example\n *\n * ```\n * const y = (\n *    x === 3\n * );\n * ```\n',
					},
				],
			} )
		).toEqual( {
			description: 'X',
			tags: [
				{
					title: 'example',
					description: '```\nconst y = (\n   x === 3\n);\n```',
				},
			],
		} );
	} );

	it( 'variable type', () => {
		const code = `
 *
 * Constant to document the meaning of life,
 * the universe and everything else.
 *
 * @type {number}
`.trim();

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: code,
					},
				],
			} )
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

	it( 'function definition', () => {
		const code = `
 *
 * Function invoking callback after delay with current timestamp in milliseconds since epoch.
 * @param {(timestamp:number)=>void} callback Callback function.
`.trim();

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: code,
					},
				],
			} )
		).toEqual( {
			description:
				'Function invoking callback after delay with current timestamp in milliseconds since epoch.',
			tags: [
				{
					title: 'param',
					description: 'Callback function.',
					name: 'callback',
					type: '(timestamp:number)=>void',
				},
			],
		} );
	} );

	it( 'tabs in code example are preserved', () => {
		// Adapted from packages/compose/src/hooks/use-resize-observer/index.js
		const comment = `
 *
 * Description
 *
 * @example
 *
 * \`\`\`js
 * const App = () => {
 * 	let testTab = ' ';
 * 	const [ resizeListener, sizes ] = useResizeObserver();
 *
 * 	return (
 * 		<div>
 * 			{ resizeListener }
 * 			Your content here
 * 		</div>
 * 	);
 * };
 * \`\`\`
 *
`.trim();

		const description = `
\`\`\`js
const App = () => {
	let testTab = ' ';
	const [ resizeListener, sizes ] = useResizeObserver();

	return (
		<div>
			{ resizeListener }
			Your content here
		</div>
	);
};
\`\`\`
`.trim();

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: comment,
					},
				],
			} )
		).toEqual( {
			description: 'Description',
			tags: [
				{
					title: 'example',
					description,
				},
			],
		} );
	} );

	it( 'spaces in code example are preserved', () => {
		// Adapted from packages/compose/src/hooks/use-resize-observer/index.js
		const code = `
 *
 * X
 *
 * @example
 *
 * \`\`\`
 * const y = (
 *    x === 3
 * );
 * \`\`\`
`.trim();

		const description = `
\`\`\`
const y = (
   x === 3
);
\`\`\`
`.trim();

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: code,
					},
				],
			} )
		).toEqual( {
			description: 'X',
			tags: [
				{
					title: 'example',
					description,
				},
			],
		} );
	} );
} );
