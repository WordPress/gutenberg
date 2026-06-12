/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * Internal dependencies
 */
import useResizeCanvas from '..';

describe( 'useResizeCanvas', () => {
	const originalInnerWidth = window.innerWidth;

	function setWindowWidth( width ) {
		Object.defineProperty( window, 'innerWidth', {
			configurable: true,
			writable: true,
			value: width,
		} );
	}

	afterEach( () => {
		setWindowWidth( originalInnerWidth );
	} );

	it( 'uses legacy preview widths when viewport settings are not provided', () => {
		setWindowWidth( 1200 );

		const { result: mobileResult } = renderHook( () =>
			useResizeCanvas( 'Mobile' )
		);
		const { result: tabletResult } = renderHook( () =>
			useResizeCanvas( 'Tablet' )
		);

		expect( mobileResult.current.width ).toBe( 479 );
		expect( tabletResult.current.width ).toBe( 781 );
	} );

	it( 'uses default viewport breakpoints as CSS lengths when viewport settings are provided', () => {
		const { result: mobileResult } = renderHook( () =>
			useResizeCanvas( 'Mobile', {} )
		);
		const { result: tabletResult } = renderHook( () =>
			useResizeCanvas( 'Tablet', {} )
		);

		expect( mobileResult.current.width ).toBe( '480px' );
		expect( mobileResult.current.maxWidth ).toBe( '100%' );
		expect( tabletResult.current.width ).toBe( '782px' );
		expect( tabletResult.current.maxWidth ).toBe( '100%' );
	} );

	it( 'uses custom pixel viewport breakpoints as CSS lengths', () => {
		setWindowWidth( 1200 );
		const viewportSettings = {
			mobile: '640px',
			tablet: '1024px',
		};

		const { result: mobileResult } = renderHook( () =>
			useResizeCanvas( 'Mobile', viewportSettings )
		);
		const { result: tabletResult } = renderHook( () =>
			useResizeCanvas( 'Tablet', viewportSettings )
		);

		expect( mobileResult.current.width ).toBe( '640px' );
		expect( mobileResult.current.maxWidth ).toBe( '100%' );
		expect( tabletResult.current.width ).toBe( '1024px' );
		expect( tabletResult.current.maxWidth ).toBe( '100%' );
	} );

	it( 'uses custom non-pixel viewport breakpoints', () => {
		const { result } = renderHook( () =>
			useResizeCanvas( 'Tablet', {
				mobile: '40rem',
				tablet: '64rem',
			} )
		);

		expect( result.current.width ).toBe( '64rem' );
		expect( result.current.maxWidth ).toBe( '100%' );
	} );

	it( 'does not exceed the current window width for legacy pixel breakpoints', () => {
		setWindowWidth( 400 );

		const { result } = renderHook( () => useResizeCanvas( 'Mobile' ) );

		expect( result.current.width ).toBe( 400 );
	} );
} );
