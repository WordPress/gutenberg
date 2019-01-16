/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const engine = require( '../src/engine' );

test( 'engine returns IR for named export (function)', ( t ) => {
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

test( 'engine returns IR for named export (const)', ( t ) => {
	const ir = engine( `
		/**
 		 * My declaration example.
 		 */
		export const myDeclaration = function() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', jsdoc: { description: 'My declaration example.', tags: [] } } ]
	);
	t.end();
} );

test( 'engine returns IR for default export (named function)', ( t ) => {
	const ir = engine( `
		/**
 		 * My declaration example.
 		 */
		export default function myDeclaration() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', jsdoc: { description: 'My declaration example.', tags: [] } } ]
	);
	t.end();
} );
