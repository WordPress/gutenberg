import { afterEach, describe, expect, it } from 'vitest';
import rotate, {
	getRotateCSS,
	getRotateForState,
	getRotateValue,
	getUpdatedRotateStyle,
	hasRotateSupport,
	isRotateEnabled,
} from '../rotate';

const DEFAULT_STATE = { viewport: 'default', pseudo: 'default' };
const MOBILE_STATE = { viewport: '@mobile', pseudo: 'default' };
const TABLET_STATE = { viewport: '@tablet', pseudo: 'default' };

describe( 'rotate block support', () => {
	afterEach( () => {
		delete window.__experimentalEnableBlockRotation;
	} );

	describe( 'hasRotateSupport()', () => {
		it( 'is on for blocks that do not opt out', () => {
			expect( hasRotateSupport( { supports: {} } ) ).toBe( true );
			expect( hasRotateSupport( { supports: { rotate: true } } ) ).toBe(
				true
			);
		} );

		it( 'is off for blocks that opt out', () => {
			expect( hasRotateSupport( { supports: { rotate: false } } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'isRotateEnabled()', () => {
		it( 'needs the block rotation experiment', () => {
			expect( isRotateEnabled( { supports: {} } ) ).toBe( false );
			window.__experimentalEnableBlockRotation = true;
			expect( isRotateEnabled( { supports: {} } ) ).toBe( true );
		} );

		it( 'needs the block to support rotation', () => {
			window.__experimentalEnableBlockRotation = true;
			expect( isRotateEnabled( { supports: { rotate: false } } ) ).toBe(
				false
			);
		} );
	} );

	describe( 'getRotateValue()', () => {
		it( 'reads numbers and numeric strings', () => {
			expect( getRotateValue( 15 ) ).toBe( 15 );
			expect( getRotateValue( -12.5 ) ).toBe( -12.5 );
			expect( getRotateValue( '30' ) ).toBe( 30 );
			expect( getRotateValue( 0 ) ).toBe( 0 );
		} );

		it( 'wraps into (-180, 180] and rounds to two decimals', () => {
			expect( getRotateValue( 270 ) ).toBe( -90 );
			expect( getRotateValue( -180 ) ).toBe( 180 );
			expect( getRotateValue( 12.3456 ) ).toBe( 12.35 );
		} );

		it( 'ignores values that are not numbers', () => {
			expect( getRotateValue( undefined ) ).toBeUndefined();
			expect( getRotateValue( null ) ).toBeUndefined();
			expect( getRotateValue( '' ) ).toBeUndefined();
			expect( getRotateValue( '15deg' ) ).toBeUndefined();
			expect( getRotateValue( Infinity ) ).toBeUndefined();
			expect( getRotateValue( NaN ) ).toBeUndefined();
			expect( getRotateValue( { angle: 15 } ) ).toBeUndefined();
		} );
	} );

	describe( 'getRotateForState()', () => {
		it( 'returns the default rotation in the default state', () => {
			expect( getRotateForState( { rotate: 15 }, DEFAULT_STATE ) ).toBe(
				15
			);
			expect( getRotateForState( undefined, DEFAULT_STATE ) ).toBe( 0 );
		} );

		it( 'returns the viewport rotation when the viewport sets one', () => {
			const style = { rotate: 15, '@mobile': { rotate: -30 } };
			expect( getRotateForState( style, MOBILE_STATE ) ).toBe( -30 );
		} );

		it( 'returns 0 when a viewport undoes the default rotation', () => {
			const style = { rotate: 15, '@mobile': { rotate: 0 } };
			expect( getRotateForState( style, MOBILE_STATE ) ).toBe( 0 );
		} );

		it( 'falls back to the default rotation in a viewport without its own', () => {
			const style = { rotate: 15, '@mobile': { rotate: -30 } };
			expect( getRotateForState( style, TABLET_STATE ) ).toBe( 15 );
		} );

		it( 'ignores pseudo states', () => {
			const style = { rotate: 15, '@mobile': { rotate: -30 } };
			expect(
				getRotateForState( style, {
					viewport: '@mobile',
					pseudo: ':hover',
				} )
			).toBe( -30 );
			expect(
				getRotateForState( style, {
					viewport: 'default',
					pseudo: ':hover',
				} )
			).toBe( 15 );
		} );
	} );

	describe( 'getUpdatedRotateStyle()', () => {
		it( 'sets the default rotation', () => {
			expect(
				getUpdatedRotateStyle(
					{ color: { text: 'red' } },
					30,
					DEFAULT_STATE
				)
			).toEqual( { color: { text: 'red' }, rotate: 30 } );
		} );

		it( 'wraps the angle into the stored range', () => {
			expect(
				getUpdatedRotateStyle( undefined, 270, DEFAULT_STATE )
			).toEqual( { rotate: -90 } );
		} );

		it( 'does not store 0 in the default state', () => {
			expect(
				getUpdatedRotateStyle(
					{ rotate: 30, color: { text: 'red' } },
					0,
					DEFAULT_STATE
				)
			).toEqual( { color: { text: 'red' } } );
			expect(
				getUpdatedRotateStyle( { rotate: 30 }, 0, DEFAULT_STATE )
			).toBeUndefined();
		} );

		it( 'keeps viewport overrides when the default rotation is removed', () => {
			expect(
				getUpdatedRotateStyle(
					{ rotate: 30, '@mobile': { rotate: 0 } },
					undefined,
					DEFAULT_STATE
				)
			).toEqual( { '@mobile': { rotate: 0 } } );
		} );

		it( 'stores 0 in a viewport state', () => {
			expect(
				getUpdatedRotateStyle( { rotate: 30 }, 0, MOBILE_STATE )
			).toEqual( { rotate: 30, '@mobile': { rotate: 0 } } );
		} );

		it( 'keeps the other styles of a viewport state', () => {
			expect(
				getUpdatedRotateStyle(
					{
						rotate: 30,
						'@mobile': { color: { text: 'red' } },
					},
					-45,
					MOBILE_STATE
				)
			).toEqual( {
				rotate: 30,
				'@mobile': { color: { text: 'red' }, rotate: -45 },
			} );
		} );

		it( 'removes a viewport rotation and cleans up the empty state', () => {
			expect(
				getUpdatedRotateStyle(
					{ rotate: 30, '@mobile': { rotate: 0 } },
					undefined,
					MOBILE_STATE
				)
			).toEqual( { rotate: 30 } );
		} );

		it( 'writes to the viewport when a pseudo state is selected', () => {
			expect(
				getUpdatedRotateStyle( undefined, 10, {
					viewport: '@tablet',
					pseudo: ':hover',
				} )
			).toEqual( { '@tablet': { rotate: 10 } } );
		} );
	} );

	describe( 'getRotateCSS()', () => {
		it( 'rotates the block with the rotate property', () => {
			expect( getRotateCSS( { rotate: 15 }, '.wp-rotate-1' ) ).toBe(
				'.wp-rotate-1{rotate:15deg;}'
			);
		} );

		it( 'outputs nothing without a rotation', () => {
			expect( getRotateCSS( undefined, '.wp-rotate-1' ) ).toBe( '' );
			expect(
				getRotateCSS( { color: { text: 'red' } }, '.wp-rotate-1' )
			).toBe( '' );
		} );

		it( 'outputs viewport overrides in media queries after the default rotation', () => {
			expect(
				getRotateCSS(
					{
						rotate: 15,
						'@mobile': { rotate: 0 },
						'@tablet': { rotate: -20 },
					},
					'.wp-rotate-1'
				)
			).toBe(
				'.wp-rotate-1{rotate:15deg;}' +
					'@media (width <= 480px){.wp-rotate-1{rotate:none;}}' +
					'@media (480px < width <= 782px){.wp-rotate-1{rotate:-20deg;}}'
			);
		} );

		it( 'uses the configured breakpoints', () => {
			expect(
				getRotateCSS( { '@mobile': { rotate: 45 } }, '.wp-rotate-1', {
					mobile: '600px',
					tablet: '1024px',
				} )
			).toBe( '@media (width <= 600px){.wp-rotate-1{rotate:45deg;}}' );
		} );

		it( 'ignores values that are not numbers', () => {
			expect(
				getRotateCSS(
					{
						rotate: '15deg; color: red',
						'@mobile': { rotate: 'none' },
					},
					'.wp-rotate-1'
				)
			).toBe( '' );
		} );
	} );

	describe( 'isMatch()', () => {
		it( 'matches styles with a default or a viewport rotation', () => {
			expect( rotate.isMatch( { style: { rotate: 15 } } ) ).toBe( true );
			expect(
				rotate.isMatch( { style: { '@mobile': { rotate: 0 } } } )
			).toBe( true );
		} );

		it( 'does not match styles without a rotation', () => {
			expect(
				rotate.isMatch( { style: { color: { text: 'red' } } } )
			).toBe( false );
			expect(
				rotate.isMatch( {
					style: { '@mobile': { color: { text: 'red' } } },
				} )
			).toBe( false );
		} );
	} );
} );
