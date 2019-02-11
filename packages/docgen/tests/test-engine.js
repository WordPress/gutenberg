/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const engine = require( '../src/engine' );

test( 'Engine - undefined code', ( t ) => {
	const { ir } = engine( undefined );
	t.deepEqual( ir, [ ] );
	t.end();
} );
