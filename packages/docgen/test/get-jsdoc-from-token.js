/**
 * Internal dependencies
 */
const getJSDocFromToken = require( '../lib/get-jsdoc-from-token' );

describe( 'JSDoc', () => {
	it( 'extracts description and tags', () => {
		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: '*\n * A function that adds two parameters.\n *\n * @deprecated Use native addition instead.\n * @since v2 Introduced.\n *\n * @see addition\n * @link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators\n *\n * @param {number} firstParam The first param to add.\n * @param {number} secondParam The second param to add.\n *\n *  @example\n *\n * ```js\n * const addResult = sum( 1, 3 );\n * console.log( addResult ); // will yield 4\n * ```\n *\n * @return {number} The result of adding the two params.\n ',
					},
				],
			} )
		).toMatchObject( {
			description: 'A function that adds two parameters.\n',
			tags: [
				{
					tag: 'deprecated',
					name: 'Use',
					description: 'native addition instead.',
				},
				{
					tag: 'since',
					name: 'v2',
					description: 'Introduced.\n',
				},
				{
					tag: 'see',
					name: 'addition',
				},
				{
					tag: 'link',
					name: 'https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Arithmetic_Operators',
				},
				{
					tag: 'param',
					description: 'The first param to add.',
					type: 'number',
					name: 'firstParam',
					optional: false,
				},
				{
					tag: 'param',
					description: 'The second param to add.\n',
					type: 'number',
					name: 'secondParam',
				},
				{
					tag: 'example',
					description:
						' \n\n```js\nconst addResult = sum( 1, 3 );\nconsole.log( addResult ); // will yield 4\n```\n',
				},
				{
					tag: 'return',
					name: 'The',
					description: 'result of adding the two params.',
					type: 'number',
				},
			],
		} );

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: '*\n * Constant to document the meaning of life,\n * the universe and everything else.\n *\n * @type {number}\n ',
					},
				],
			} )
		).toMatchObject( {
			description:
				'Constant to document the meaning of life,\nthe universe and everything else.\n',
			tags: [
				{
					tag: 'type',
					name: '',
					description: '',
					type: 'number',
				},
			],
		} );

		expect(
			getJSDocFromToken( {
				leadingComments: [
					{
						value: '*\n * Function invoking callback after delay with current timestamp in milliseconds since epoch.\n * @param {(timestamp:number)=>void} callback Callback function.\n ',
					},
				],
			} )
		).toMatchObject( {
			description:
				'Function invoking callback after delay with current timestamp in milliseconds since epoch.',
			tags: [
				{
					tag: 'param',
					description: 'Callback function.',
					name: 'callback',
					type: '(timestamp:number)=>void',
				},
			],
		} );

		expect(
			getJSDocFromToken( { leadingComments: [ { value: '' } ] } )
		).toBeUndefined();
	} );
} );
