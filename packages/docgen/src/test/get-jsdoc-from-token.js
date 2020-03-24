/**
 * Internal dependencies.
 */
const getJSDocFromToken = require( '../get-jsdoc-from-token' );

describe( 'JSDoc', () => {
	it( 'extracts description and tags', () => {
		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value:
							'*\n * A function that adds two parameters.\n *\n * @deprecated Use native addition instead.\n * @since v2\n *\n * @see addition\n * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators\n *\n * @param {number} firstParam The first param to add.\n * @param {number} secondParam The second param to add.\n *\n *  @example\n *\n * ```js\n * const addResult = sum( 1, 3 );\n * console.log( addResult ); // will yield 4\n * ```\n *\n * @return {number} The result of adding the two params.\n ',
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
					description: 'v2',
				},
				{
					title: 'see',
					description: 'addition',
				},
				{
					title: 'link',
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

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value:
							'*\n * Constant to document the meaning of life,\n * the universe and everything else.\n *\n * @type {number}\n ',
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

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value:
							'*\n * Function invoking callback after delay with current timestamp in milliseconds since epoch.\n * @param {(timestamp:number)=>void} callback Callback function.\n ',
					},
				],
			} )
		).toEqual( {
			description:
				'Function invoking callback after delay with current timestamp in milliseconds since epoch.',
			tags: [
				{
					title: 'param',
					errors: [ 'unexpected token' ],
					description: 'Callback function.',
					name: 'callback',
					type: null,
				},
			],
		} );
	} );
} );
