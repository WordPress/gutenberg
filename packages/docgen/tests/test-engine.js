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

test( 'engine returns IR for named export (variable)', ( t ) => {
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

test( 'engine returns IR for named export (identifier)', ( t ) => {
	const ir = engine( `
		/**
 		 * My declaration example.
 		 */
		const myDeclaration = function() {
			// do nothing
		}

		export { myDeclaration };
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', jsdoc: { description: 'Undocumented declaration', tags: [] } } ]
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

test( 'engine returns IR for default export (anonymous function)', ( t ) => {
	const ir = engine( `
		/**
 		 * My declaration example.
 		 */
		export default function() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'default export', jsdoc: { description: 'My declaration example.', tags: [] } } ]
	);
	t.end();
} );

test( 'engine returns IR for default export (identifier)', ( t ) => {
	const ir = engine( `
		function myDeclaration() {
			// do nothing
		}

		/**
 		 * My declaration example.
 		 */
		export default myDeclaration;
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', jsdoc: { description: 'My declaration example.', tags: [] } } ]
	);
	t.end();
} );
