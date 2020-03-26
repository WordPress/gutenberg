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
							title: 'param',
							description: 'Second declaration parameter.',
							type: 'string',
							name: 'secondParam',
							defaultValue: 'gutenberg',
						},
						{
							title: 'return',
							description: 'The result of the declaration.',
							type: 'number',
						},
						{
							title: 'typedef',
							name: 'WPEditorInserterItem',
							description: null,
							type: 'object',
							properties: [
								{
									name: 'id',
									description:
										'Unique identifier for the item.',
									type: 'number',
								},
								{
									name: 'name',
									description: 'The type of block to create.',
									type: 'string',
								},
							],
						},
					],
					name: 'myDeclaration',
				},
			],
			'API docs'
		);
		expect( docs ).toBe( `# API docs

<a name="myDeclaration" href="#myDeclaration">#</a> **myDeclaration**

My declaration example.

*Parameters*

- *firstParam* \`number\`: First declaration parameter.
- *secondParam* \`string\`: Second declaration parameter. (Default: \`gutenberg\`)

*Returns*

- \`number\`: The result of the declaration.

*Type Definition*

- *WPEditorInserterItem* \`object\`

*Properties*

- *id* \`number\`: Unique identifier for the item.
- *name* \`string\`: The type of block to create.
` );
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
