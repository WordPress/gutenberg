/**
 * Internal dependencies.
 */
const formatter = require( '../markdown/formatter' );

describe( 'Formatter', () => {
	it( 'returns markdown', () => {
		const rootDir = '/home/my-path';
		const docPath = '/home/my-path/docs';
		const docs = formatter(
			rootDir,
			docPath + '-api.md',
			[
				{
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
				},
			],
			'API docs'
		);
		expect( docs ).toBe(
			'# API docs\n\n<a name="myDeclaration" href="#myDeclaration">#</a> **myDeclaration**\n\nMy declaration example.\n\n*Parameters*\n\n- *firstParam* `number`: First declaration parameter.\n\n*Returns*\n\n- `number`: The result of the declaration.\n'
		);
	} );

	it( 'handles unknown types from parse error', () => {
		const rootDir = '/home/my-path';
		const docPath = '/home/my-path/docs';
		const docs = formatter(
			rootDir,
			docPath + '-api.md',
			[
				{
					path: null,
					name: 'default',
					description:
						'Function invoking callback after delay with current timestamp in milliseconds\nsince epoch.',
					tags: [
						{
							description: 'Callback function.',
							errors: [ 'unexpected token' ],
							name: 'callback',
							title: 'param',
							type: null,
						},
					],
					lineStart: 7,
					lineEnd: 9,
				},
			],
			'API docs'
		);
		expect( docs ).toBe(
			'# API docs\n\n<a name="default" href="#default">#</a> **default**\n\nFunction invoking callback after delay with current timestamp in milliseconds\nsince epoch.\n\n*Parameters*\n\n- *callback* (unknown type): Callback function.\n'
		);
	} );
} );
