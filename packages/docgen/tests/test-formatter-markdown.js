/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const formatter = require( '../src/formatter' );

test( 'formatter returns markdown', ( t ) => {
	const docs = formatter( [ { name: 'myDeclaration', jsdoc: { description: 'My declaration example.', tags: [] } } ] );
	t.equal(
		docs,
		'# API\n\n## myDeclaration\n\nMy declaration example.\n'
	);
	t.end();
} );
