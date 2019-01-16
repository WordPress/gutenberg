/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const engine = require( '../src/engine' );

test( 'engine returns intermediate representation', ( t ) => {
	const ir = engine( `
		/**
 		 * My declaration example.
 		 */
		export function myDeclaration() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', jsdoc: { description: 'My declaration example.', tags: [] } } ]
	);
	t.end();
} );
