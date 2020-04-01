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
							title: 'param',
							name: 'thirdParam',
							description: 'Third declaration parameter.',
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
- *thirdParam* \`object\`: Third declaration parameter.
  - *x0* \`string\`: property 0
  - *x1* \`XXX | undefined\`: property 1
  - *x2* \`number\`: property 2 (Default: \`11\`)

*Returns*

- \`number\`: The result of the declaration.

*Type Definition*

- *WPEditorInserterItem* \`object\`

*Properties*

- *id* \`number\`: Unique identifier for the item.
- *name* \`string\`: The type of block to create.
` );
	} );
} );
