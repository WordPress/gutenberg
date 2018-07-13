// Use `require` because the polyfill uses `module.exports` to provide itself for unit test.
const { DOMRect } = require( '../DOMRect' );

describe( 'DOMRect', function() {
	describe( 'constructor', function() {
		it( 'should create DOMRect with specified x, y, width, and height properties', function() {
			const domRect = new DOMRect( 12, 34, 56, 78 );
			expect( domRect.x ).toBe( 12 );
			expect( domRect.y ).toBe( 34 );
			expect( domRect.width ).toBe( 56 );
			expect( domRect.height ).toBe( 78 );
		} );
		it( 'should default undefined arguments to zero', function() {
			const domRect = new DOMRect();
			expect( domRect.x ).toBe( 0 );
			expect( domRect.y ).toBe( 0 );
			expect( domRect.width ).toBe( 0 );
			expect( domRect.height ).toBe( 0 );
		} );
		it( 'should interpret non-numeric arguments as NaN', function() {
			let domRect = new DOMRect( 'text', 34, 56, 78 );
			expect( isNaN( domRect.x ) ).toBeTruthy();
			expect( domRect.y ).toBe( 34 );
			expect( domRect.width ).toBe( 56 );
			expect( domRect.height ).toBe( 78 );
			domRect = new DOMRect( 12, 'text', 56, 78 );
			expect( domRect.x ).toBe( 12 );
			expect( isNaN( domRect.y ) ).toBeTruthy();
			expect( domRect.width ).toBe( 56 );
			expect( domRect.height ).toBe( 78 );
			domRect = new DOMRect( 12, 34, 'text', 78 );
			expect( domRect.x ).toBe( 12 );
			expect( domRect.y ).toBe( 34 );
			expect( isNaN( domRect.width ) ).toBeTruthy();
			expect( domRect.height ).toBe( 78 );
			domRect = new DOMRect( 12, 34, 56, 'text' );
			expect( domRect.x ).toBe( 12 );
			expect( domRect.y ).toBe( 34 );
			expect( domRect.width ).toBe( 56 );
			expect( isNaN( domRect.height ) ).toBeTruthy();
		} );
	} );

	describe( 'writable properties', function() {
		it( 'should define `x` as writable', function() {
			const domRect = new DOMRect();
			domRect.x = 321;
			expect( domRect.x ).toBe( 321 );
		} );

		it( 'should define `y` as writable', function() {
			const domRect = new DOMRect();
			domRect.y = 321;
			expect( domRect.y ).toBe( 321 );
		} );

		it( 'should define `width` as writable', function() {
			const domRect = new DOMRect();
			domRect.width = 321;
			expect( domRect.width ).toBe( 321 );
		} );

		it( 'should define `height` as writable', function() {
			const domRect = new DOMRect();
			domRect.height = 321;
			expect( domRect.height ).toBe( 321 );
		} );
	} );

	describe( 'readonly properties', function() {
		// Explicitly use strict mode so TypeErrors are thrown
		// when assigning to readonly properties.
		'use strict';

		it( 'should define `left` as readonly', function() {
			expect.hasAssertions();

			const domRect = new DOMRect( 10, 20, 30, 40 );
			try {
				domRect.left = 321;
			} catch ( e ) {
				expect( e ).toBeInstanceOf( TypeError );
				expect( domRect.left ).toBe( /* x */ 10 );
			}
		} );

		it( 'should define `right` as readonly', function() {
			expect.hasAssertions();

			const domRect = new DOMRect( 10, 20, 30, 40 );
			try {
				domRect.right = 321;
			} catch ( e ) {
				expect( e ).toBeInstanceOf( TypeError );
				expect( domRect.right ).toBe( /* x + width */ 40 );
			}
		} );

		it( 'should define `top` as readonly', function() {
			expect.hasAssertions();

			const domRect = new DOMRect( 10, 20, 30, 40 );
			try {
				domRect.top = 321;
			} catch ( e ) {
				expect( e ).toBeInstanceOf( TypeError );
				expect( domRect.top ).toBe( /* y */ 20 );
			}
		} );

		it( 'should define `bottom` as readonly', function() {
			expect.hasAssertions();

			const domRect = new DOMRect( 10, 20, 30, 40 );
			try {
				domRect.bottom = 321;
			} catch ( e ) {
				expect( e ).toBeInstanceOf( TypeError );
				expect( domRect.bottom ).toBe( /* y + height */ 60 );
			}
		} );

		it( 'should have correct `left` and `right` when `width` is positive', function() {
			const domRect = new DOMRect( 100, 0, 200, 0 );
			expect( domRect.left ).toBe( /* x */ 100 );
			expect( domRect.right ).toBe( /* x + width */ 300 );
		} );

		it( 'should have correct `left` and `right` when `width` is negative', function() {
			const domRect = new DOMRect( 100, 0, -200, 0 );
			expect( domRect.left ).toBe( /* x + width */ -100 );
			expect( domRect.right ).toBe( /* x */ 100 );
		} );

		it( 'should have correct `top` and `bottom` when `height` is positive', function() {
			const domRect = new DOMRect( 0, 100, 0, 200 );
			expect( domRect.top ).toBe( /* y */ 100 );
			expect( domRect.bottom ).toBe( /* y + height */ 300 );
		} );

		it( 'should have correct `top` and `bottom` when `height` is negative', function() {
			const domRect = new DOMRect( 0, 100, 0, -200 );
			expect( domRect.top ).toBe( /* y + height */ -100 );
			expect( domRect.bottom ).toBe( /* y */ 100 );
		} );

		it( 'should have correct `left` and `right` when `x` is changed', function() {
			const domRect = new DOMRect( 100, 0, 200, 0 );
			domRect.x = 50;
			expect( domRect.left ).toBe( /* x */ 50 );
			expect( domRect.right ).toBe( /* x + width */ 250 );
		} );

		it( 'should have correct `left` and `right` when `width` is changed', function() {
			const domRect = new DOMRect( 100, 0, 200, 0 );
			domRect.width = 300;
			expect( domRect.left ).toBe( /* x */ 100 );
			expect( domRect.right ).toBe( /* x + width */ 400 );
		} );

		it( 'should have correct `top` and `bottom` when `y` is changed', function() {
			const domRect = new DOMRect( 0, 100, 0, 200 );
			domRect.y = 50;
			expect( domRect.top ).toBe( /* y */ 50 );
			expect( domRect.bottom ).toBe( /* y + height */ 250 );
		} );

		it( 'should have correct `top` and `bottom` when `height` is changed', function() {
			const domRect = new DOMRect( 0, 100, 0, 200 );
			domRect.height = 300;
			expect( domRect.top ).toBe( /* y */ 100 );
			expect( domRect.bottom ).toBe( /* y + height */ 400 );
		} );
	} );
} );
