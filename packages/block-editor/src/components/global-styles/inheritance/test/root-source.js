/**
 * Internal dependencies
 */
import { isRootSourced, dropRootSourced } from '../root-source';

describe( 'isRootSourced', () => {
	it( 'returns true when the leaf came from the root layer', () => {
		const sources = { 'color.background': { layer: 'root' } };
		expect( isRootSourced( sources, 'color.background' ) ).toBe( true );
	} );

	it( 'returns false for block- and variation-sourced leaves', () => {
		const sources = {
			'color.background': { layer: 'block' },
			'color.text': { layer: 'blockVariation' },
		};
		expect( isRootSourced( sources, 'color.background' ) ).toBe( false );
		expect( isRootSourced( sources, 'color.text' ) ).toBe( false );
	} );

	it( 'returns false when the leaf is absent or sources is undefined', () => {
		expect( isRootSourced( {}, 'color.background' ) ).toBe( false );
		expect( isRootSourced( undefined, 'color.background' ) ).toBe( false );
	} );
} );

describe( 'dropRootSourced', () => {
	it( 'drops a root-sourced string leaf', () => {
		const sources = { shadow: { layer: 'root' } };
		expect( dropRootSourced( '0 0 2px #000', sources, 'shadow' ) ).toBe(
			undefined
		);
	} );

	it( 'keeps a block-sourced string leaf', () => {
		const sources = { shadow: { layer: 'block' } };
		expect( dropRootSourced( '0 0 2px #000', sources, 'shadow' ) ).toBe(
			'0 0 2px #000'
		);
	} );

	it( 'treats an array (e.g. duotone) as a single leaf', () => {
		const value = [ '#000', '#fff' ];
		expect(
			dropRootSourced(
				value,
				{ 'filter.duotone': { layer: 'root' } },
				'filter.duotone'
			)
		).toBe( undefined );
		expect(
			dropRootSourced(
				value,
				{ 'filter.duotone': { layer: 'block' } },
				'filter.duotone'
			)
		).toBe( value );
	} );

	it( 'filters nested leaves individually and keeps non-root ones', () => {
		const value = {
			top: { color: 'red', width: '1px' },
			left: { color: 'blue', width: '2px' },
		};
		const sources = {
			'border.top.color': { layer: 'root' },
			'border.top.width': { layer: 'root' },
			'border.left.color': { layer: 'block' },
			'border.left.width': { layer: 'block' },
		};
		expect( dropRootSourced( value, sources, 'border' ) ).toEqual( {
			left: { color: 'blue', width: '2px' },
		} );
	} );

	it( 'returns undefined when every nested leaf is root-sourced', () => {
		const value = { top: '10px', left: '10px' };
		const sources = {
			'spacing.padding.top': { layer: 'root' },
			'spacing.padding.left': { layer: 'root' },
		};
		expect( dropRootSourced( value, sources, 'spacing.padding' ) ).toBe(
			undefined
		);
	} );

	it( 'passes empty values through unchanged', () => {
		expect( dropRootSourced( undefined, {}, 'border' ) ).toBe( undefined );
		expect( dropRootSourced( '', {}, 'border' ) ).toBe( '' );
	} );
} );
