/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const formatter = require( '../src/formatter' );

test( 'Formatter - returns markdown', ( t ) => {
	const docs = formatter( [ { description: 'My declaration example.', tags: [], name: 'myDeclaration' } ] );
	t.equal(
		docs,
		'# API\n\n## myDeclaration\n\nMy declaration example.\n\n\n'
	);
	t.end();
} );
