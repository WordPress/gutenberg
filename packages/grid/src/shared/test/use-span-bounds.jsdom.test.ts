import { renderHook } from '@testing-library/react';
import { useResizePixelLimits, useSpanBounds } from '../use-span-bounds';
import type { GridItemLimits } from '../types';

type Props = {
	itemLimits?: Record< string, GridItemLimits >;
	columnWidth: number;
};

function renderSpanBounds( initialProps: Props ) {
	return renderHook(
		( { itemLimits, columnWidth }: Props ) =>
			useSpanBounds( itemLimits, columnWidth, 16, 80, 6 ),
		{ initialProps }
	);
}

describe( 'useSpanBounds', () => {
	const itemLimits = { a: { minWidth: 300, maxHeight: 250 } };

	it( 'quantizes limits to whole tracks', () => {
		const { result } = renderSpanBounds( { itemLimits, columnWidth: 100 } );
		expect( result.current.get( 'a' ) ).toEqual( {
			minWidth: 3,
			minHeight: 1,
			maxWidth: 6,
			maxHeight: 2,
		} );
	} );

	it( 'keeps the map identity across geometry ticks that leave the bounds unchanged', () => {
		const { result, rerender } = renderSpanBounds( {
			itemLimits,
			columnWidth: 100,
		} );
		const first = result.current;
		rerender( { itemLimits, columnWidth: 101 } );
		expect( result.current ).toBe( first );
	} );

	it( 'keeps the map identity when an equal itemLimits object is passed', () => {
		const { result, rerender } = renderSpanBounds( {
			itemLimits,
			columnWidth: 100,
		} );
		const first = result.current;
		rerender( { itemLimits: { ...itemLimits }, columnWidth: 100 } );
		expect( result.current ).toBe( first );
	} );

	it( 'returns a new map once a bound crosses a track threshold', () => {
		const { result, rerender } = renderSpanBounds( {
			itemLimits,
			columnWidth: 100,
		} );
		const first = result.current;
		rerender( { itemLimits, columnWidth: 150 } );
		expect( result.current ).not.toBe( first );
		expect( result.current.get( 'a' )?.minWidth ).toBe( 2 );
	} );

	it( 'returns a stable empty map without limits', () => {
		const { result, rerender } = renderSpanBounds( { columnWidth: 100 } );
		const first = result.current;
		expect( first.size ).toBe( 0 );
		rerender( { columnWidth: 120 } );
		expect( result.current ).toBe( first );
	} );
} );

describe( 'useResizePixelLimits', () => {
	it( 'converts bounds to pixel limits for the resize gesture', () => {
		const bounds = new Map( [
			[ 'a', { minWidth: 2, minHeight: 1, maxWidth: 4, maxHeight: 3 } ],
		] );
		const { result } = renderHook( () =>
			useResizePixelLimits( bounds, 100, 16, 80 )
		);
		expect( result.current.get( 'a' ) ).toEqual( {
			minWidthPx: 216,
			minHeightPx: 80,
			maxWidthPx: 448,
			maxHeightPx: 272,
		} );
	} );

	it( 'leaves the height open when the height bound is open', () => {
		const bounds = new Map( [
			[
				'a',
				{
					minWidth: 1,
					minHeight: 1,
					maxWidth: 2,
					maxHeight: Infinity,
				},
			],
		] );
		const { result } = renderHook( () =>
			useResizePixelLimits( bounds, 100, 16, 80 )
		);
		expect( result.current.get( 'a' )?.maxHeightPx ).toBeNull();
	} );
} );
