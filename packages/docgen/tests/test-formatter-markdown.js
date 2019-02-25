/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const formatter = require( '../src/formatter' );

test( 'Formatter - returns markdown', ( t ) => {
	const docPath = process.cwd();
	const docs = formatter( docPath, docPath + '-api.md', [ {
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
	t.equal(
		docs,
		'# API docs\n\n## myDeclaration\n\n[docgen/home/andres/src/gutenberg/packages/docgen-code.js#L1-L2](docgen/home/andres/src/gutenberg/packages/docgen-code.js#L1-L2)\n\nMy declaration example.\n\n**Parameters**\n\n- **firstParam** `number`: First declaration parameter.\n\n**Returns**\n\n`number` The result of the declaration.\n'
	);
	t.end();
} );
