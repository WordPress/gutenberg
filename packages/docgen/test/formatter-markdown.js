/**
 * Internal dependencies
 */
const formatter = require( '../lib/markdown/formatter' );

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
					description: `My declaration example.
Client-side hyphen-
ation.

Code:

\`\`\`js
const myCode = 'code';
\`\`\`

Unordered Lists:

-   List Item.
-   List Item.
    List Item.

Ordered Lists:

1.  List Item.
2.  List Item.
    List Item.
`,
					tags: [
						{
							tag: 'param',
							description: 'First declaration parameter.',
							type: 'number',
							name: 'firstParam',
						},
						{
							tag: 'return',
							name: 'The',
							description: 'result of the declaration.',
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
			`# API docs

## myDeclaration

My declaration example. Client-side hyphenation.

Code:

\`\`\`js
const myCode = 'code';
\`\`\`

Unordered Lists:

-   List Item.
-   List Item. List Item.

Ordered Lists:

1.  List Item.
2.  List Item. List Item.


*Parameters*

- *firstParam* \`number\`: First declaration parameter.

*Returns*

- \`number\`: The result of the declaration.
`
		);
	} );
} );
