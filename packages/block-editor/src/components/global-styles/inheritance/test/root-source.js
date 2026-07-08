/**
 * Internal dependencies
 */
import { isRootSourced, dropRootSourced } from '../root-source';

describe( 'isRootSourced', () => {
	it( 'is true only for the root layer', () => {
		const sources = {
			'color.background': { layer: 'root' },
			'color.text': { layer: 'block' },
		};
		expect( isRootSourced( sources, 'color.background' ) ).toBe( true );
		expect( isRootSourced( sources, 'color.text' ) ).toBe( false );
		expect( isRootSourced( {}, 'color.background' ) ).toBe( false );
	} );
} );

describe( 'dropRootSourced', () => {
	it( 'drops a root-sourced leaf and keeps a block-sourced one', () => {
		expect(
			dropRootSourced( '#000', { shadow: { layer: 'root' } }, 'shadow' )
		).toBe( undefined );
		expect(
			dropRootSourced( '#000', { shadow: { layer: 'block' } }, 'shadow' )
		).toBe( '#000' );
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
	} );

	it( 'filters nested leaves individually, dropping the whole value when all are root-sourced', () => {
		const value = { top: { color: 'red' }, left: { color: 'blue' } };
		expect(
			dropRootSourced(
				value,
				{
					'border.top.color': { layer: 'root' },
					'border.left.color': { layer: 'block' },
				},
				'border'
			)
		).toEqual( { left: { color: 'blue' } } );
		expect(
			dropRootSourced(
				value,
				{
					'border.top.color': { layer: 'root' },
					'border.left.color': { layer: 'root' },
				},
				'border'
			)
		).toBe( undefined );
	} );
} );
