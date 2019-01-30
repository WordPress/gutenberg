/**
 * External dependencies.
 */
const test = require( 'tape' );

/**
 * Internal dependencies.
 */
const engine = require( '../src/engine' );

test( 'Engine - many exports at once', ( t ) => {
	const { ir } = engine( `
		/**
 		 * First declaration example.
 		 */
		export const firstDeclaration = function() {
			// do nothing
		}

		/**
		 * Second declaration example.
		 */
		export function secondDeclaration(){
			// do nothing
		}

		/**
		 * Default declaration example.
		 */
		export default function() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[
			{ name: 'firstDeclaration', description: 'First declaration example.', params: [], return: [], tags: [] },
			{ name: 'secondDeclaration', description: 'Second declaration example.', params: [], return: [], tags: [] },
			{ name: 'default', description: 'Default declaration example.', params: [], return: [], tags: [] },
		]
	);
	t.end();
} );

test( 'Engine - named export (function)', ( t ) => {
	const { ir } = engine( `
		/**
 		 * My declaration example.
 		 */
		export function myDeclaration() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - named export (variable)', ( t ) => {
	const { ir } = engine( `
		/**
 		 * My declaration example.
 		 */
		export const myDeclaration = function() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - named export (single identifier)', ( t ) => {
	const { ir } = engine( `
	const myDeclaration = function() {
		// do nothing
	}
	
	/**
	 * My declaration example.
	 */
	export { myDeclaration };
` );
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - named export (single identifier) using JSDoc from declaration', ( t ) => {
	const { ir } = engine( `
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
		[ { name: 'myDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - named export (multiple identifiers) using JSDoc from declaration', ( t ) => {
	const { ir } = engine( `
		/**
 		 * First declaration example.
 		 */
		const firstDeclaration = function() {
			// do nothing
		}

		/**
 		 * Second declaration example.
 		 */
		const secondDeclaration = function() {
			// do nothing
		}

		export { firstDeclaration, secondDeclaration };
` );
	t.deepEqual(
		ir,
		[
			{ name: 'firstDeclaration', description: 'First declaration example.', params: [], return: [], tags: [] },
			{ name: 'secondDeclaration', description: 'Second declaration example.', params: [], return: [], tags: [] },
		]
	);
	t.end();
} );

test( 'Engine - named export (single identifier) using JSDoc from dependency', ( t ) => {
	const dependency = `/**
 		 * My declaration example.
 		 */
		export const myDeclaration = function() {
			// do nothing
		}
	`;
	const getDependency = () => engine( dependency ).ir;
	const { ir } = engine(
		`export { myDeclaration } from './my-dependency';`,
		getDependency
	);
	t.deepEqual(
		ir,
		[ { name: 'myDeclaration', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - default export (named function)', ( t ) => {
	const { ir } = engine( `
		/**
 		 * My declaration example.
 		 */
		export default function myDeclaration() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'default', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - default export (anonymous function)', ( t ) => {
	const { ir } = engine( `
		/**
 		 * My declaration example.
 		 */
		export default function() {
			// do nothing
		}
` );
	t.deepEqual(
		ir,
		[ { name: 'default', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - default export (identifier)', ( t ) => {
	const { ir } = engine( `
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
		[ { name: 'default', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - default export (identifier) using JSDoc from function', ( t ) => {
	const { ir } = engine( `
		/**
		 * My declaration example.
		 */
		function myDeclaration() {
			// do nothing
		}

		export default myDeclaration;
` );
	t.deepEqual(
		ir,
		[ { name: 'default', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - default export (identifier) using JSDoc from variable', ( t ) => {
	const { ir } = engine( `
		/**
		 * My declaration example.
		 */
		const myDeclaration = function() {
			// do nothing
		}

		export default myDeclaration;
` );
	t.deepEqual(
		ir,
		[ { name: 'default', description: 'My declaration example.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - undocumented export', ( t ) => {
	const { ir } = engine( `
		const myDeclaration = function() {
			// do nothing
		}

		export default myDeclaration;
` );
	t.deepEqual(
		ir,
		[ { name: 'default', description: 'Undocumented declaration.', params: [], return: [], tags: [] } ]
	);
	t.end();
} );

test( 'Engine - undefined code', ( t ) => {
	const { ir } = engine( undefined );
	t.deepEqual( ir, [ ] );
	t.end();
} );
