/**
 * @jest-environment node
 */

/**
 * These tests ensure that WordPress packages can be imported and used in a
 * Node.js environment without browser APIs like `window`, `document`, etc.
 * This is important for server-side rendering (SSR) contexts where these
 * globals don't exist.
 * 
 * The tests prevent regressions where browser-specific code (like direct
 * access to `window` or `document`) is added to packages that should work
 * in both browser and Node.js environments.
 * 
 * @see https://github.com/WordPress/gutenberg/issues/17273
 * @see https://github.com/WordPress/gutenberg/pull/17165
 */

describe( 'WordPress packages in Node.js environment', () => {
	test( 'should import @wordpress/compose without errors', () => {
		expect( () => {
			require( '@wordpress/compose' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/components without errors', () => {
		expect( () => {
			require( '@wordpress/components' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/element without errors', () => {
		expect( () => {
			require( '@wordpress/element' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/data without errors', () => {
		expect( () => {
			require( '@wordpress/data' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/blocks without errors', () => {
		expect( () => {
			require( '@wordpress/blocks' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/block-editor without errors', () => {
		expect( () => {
			require( '@wordpress/block-editor' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/core-data without errors', () => {
		expect( () => {
			require( '@wordpress/core-data' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/editor without errors', () => {
		expect( () => {
			require( '@wordpress/editor' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/hooks without errors', () => {
		expect( () => {
			require( '@wordpress/hooks' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/i18n without errors', () => {
		expect( () => {
			require( '@wordpress/i18n' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/rich-text without errors', () => {
		expect( () => {
			require( '@wordpress/rich-text' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/url without errors', () => {
		expect( () => {
			require( '@wordpress/url' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/dom-ready without errors', () => {
		expect( () => {
			require( '@wordpress/dom-ready' );
		} ).not.toThrow();
	} );

	test( 'should import @wordpress/viewport without errors', () => {
		expect( () => {
			require( '@wordpress/viewport' );
		} ).not.toThrow();
	} );
} );

describe( 'WordPress packages functionality in Node.js environment', () => {
	test( 'should be able to use compose utilities', () => {
		const { compose } = require( '@wordpress/compose' );
		
		const addOne = ( x ) => x + 1;
		const multiplyByTwo = ( x ) => x * 2;
		const composed = compose( multiplyByTwo, addOne );
		
		expect( composed( 5 ) ).toBe( 12 ); // (5 + 1) * 2 = 12
	} );

	test( 'should be able to use data utilities', () => {
		const { createRegistry } = require( '@wordpress/data' );
		
		expect( () => {
			const registry = createRegistry();
			expect( registry ).toBeDefined();
		} ).not.toThrow();
	} );

	test( 'should be able to use element utilities', () => {
		const { createElement } = require( '@wordpress/element' );
		
		expect( () => {
			const element = createElement( 'div', null, 'Hello World' );
			expect( element ).toBeDefined();
		} ).not.toThrow();
	} );

	test( 'should be able to use hooks utilities', () => {
		const { createHooks } = require( '@wordpress/hooks' );
		
		expect( () => {
			const hooks = createHooks();
			expect( hooks ).toBeDefined();
		} ).not.toThrow();
	} );

	test( 'should be able to use i18n utilities', () => {
		const { __ } = require( '@wordpress/i18n' );
		
		expect( () => {
			const translated = __( 'Hello World' );
			expect( translated ).toBe( 'Hello World' );
		} ).not.toThrow();
	} );

	test( 'should be able to use url utilities', () => {
		const { addQueryArgs } = require( '@wordpress/url' );
		
		expect( () => {
			const url = addQueryArgs( 'https://example.com', { foo: 'bar' } );
			expect( url ).toBe( 'https://example.com?foo=bar' );
		} ).not.toThrow();
	} );

	test( 'should be able to use blocks utilities', () => {
		const { createBlock } = require( '@wordpress/blocks' );
		
		expect( () => {
			// This should not throw even without registering blocks
			const block = createBlock( 'core/paragraph', { content: 'Hello' } );
			expect( block ).toBeDefined();
			expect( block.name ).toBe( 'core/paragraph' );
		} ).not.toThrow();
	} );
} );

describe( 'WordPress packages with browser-dependent features', () => {
	test( 'should handle dom-ready gracefully in Node.js environment', () => {
		const domReady = require( '@wordpress/dom-ready' );
		
		expect( () => {
			// dom-ready should handle the lack of document gracefully
			domReady( () => {} );
		} ).not.toThrow();
	} );

	test( 'should handle viewport utilities gracefully in Node.js environment', () => {
		expect( () => {
			// This might contain browser-specific code but should not crash on import
			require( '@wordpress/viewport' );
		} ).not.toThrow();
	} );

	test( 'should handle compose hooks gracefully in Node.js environment', () => {
		const { useReducedMotion, useMediaQuery } = require( '@wordpress/compose' );
		
		expect( () => {
			// These hooks should be importable even if they can't be used without React context
			expect( typeof useReducedMotion ).toBe( 'function' );
			expect( typeof useMediaQuery ).toBe( 'function' );
		} ).not.toThrow();
	} );
} );
