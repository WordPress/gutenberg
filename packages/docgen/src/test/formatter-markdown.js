/**
 * Internal dependencies.
 */
const formatter = require( '../markdown/formatter' );

describe( 'Formatter', () => {
	it( 'returns markdown', () => {
		const rootDir = '/home/my-path';
		const docPath = '/home/my-path/docs';
		const docs = formatter( rootDir, docPath + '-api.md', [ {
			path: docPath + '-code.js',
			description: 'My declaration example.',
			tags: [
				{
					title: 'param',
					description: 'First declaration parameter.',
					type: 'number',
					name: 'firstParam',
				},
				{
					title: 'return',
					description: 'The result of the declaration.',
					type: 'number',
				},
			],
			name: 'myDeclaration',
			lineStart: 1,
			lineEnd: 2,
		} ], 'API docs' );
		expect( docs ).toBe(
			'# API docs\n\n<a name="myDeclaration" href="#myDeclaration">#</a> **myDeclaration**\n\nMy declaration example.\n\n*Parameters*\n\n- *firstParam* `number`: First declaration parameter.\n\n*Returns*\n\n- `number`: The result of the declaration.\n'
		);
	} );
} );
