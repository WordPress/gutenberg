/**
 * Internal dependencies
 */
import { resolveFillWidths } from '../resolve-fill-widths';
import type { GridLayoutItem } from '../types';

function makeMap( items: GridLayoutItem[] ): Map< string, GridLayoutItem > {
	const map = new Map< string, GridLayoutItem >();
	items.forEach( ( item ) => map.set( item.key, item ) );
	return map;
}

function keys( items: GridLayoutItem[] ): string[] {
	return items.map( ( item ) => item.key );
}

describe( 'resolveFillWidths', () => {
	it( 'returns empty map when no items have fillWidth', () => {
		const items: GridLayoutItem[] = [
			{ key: 'a', width: 2 },
			{ key: 'b', width: 4 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.size ).toBe( 0 );
	} );

	it( 'fill item takes all columns when alone', () => {
		const items: GridLayoutItem[] = [ { key: 'fill', fillWidth: true } ];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 6 );
	} );

	it( 'fill item takes remaining columns after fixed items', () => {
		const items: GridLayoutItem[] = [
			{ key: 'sidebar', width: 1 },
			{ key: 'fill', fillWidth: true },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 5 );
	} );

	it( 'fill item reserves space for subsequent fixed items', () => {
		const items: GridLayoutItem[] = [
			{ key: 'left', width: 1 },
			{ key: 'fill', fillWidth: true },
			{ key: 'right', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'fill after fullWidth starts a new row', () => {
		const items: GridLayoutItem[] = [
			{ key: 'full', fullWidth: true },
			{ key: 'fill', fillWidth: true },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 5 );
	} );

	it( 'consecutive fills each take a full row', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill-1', fillWidth: true },
			{ key: 'fill-2', fillWidth: true },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 6 );
		expect( result.get( 'fill-2' ) ).toBe( 6 );
	} );

	it( 'does not reserve items that overflow the row', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill', fillWidth: true },
			{ key: 'a', width: 3 },
			{ key: 'b', width: 4 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'clamps item widths to maxColumns', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill', fillWidth: true },
			{ key: 'wide', width: 10 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 4 );
		expect( result.get( 'fill' ) ).toBe( 4 );
	} );

	it( 'fill in the middle of a row', () => {
		const items: GridLayoutItem[] = [
			{ key: 'a', width: 1 },
			{ key: 'b', width: 1 },
			{ key: 'fill', fillWidth: true },
			{ key: 'c', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 3 );
	} );

	it( 'multiple fills in different rows', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill-1', fillWidth: true },
			{ key: 'sidebar-1', width: 1 },
			{ key: 'full', fullWidth: true },
			{ key: 'fill-2', fillWidth: true },
			{ key: 'sidebar-2', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 5 );
		expect( result.get( 'fill-2' ) ).toBe( 4 );
	} );

	it( 'fill gets minimum of 1 column when row is almost full', () => {
		const items: GridLayoutItem[] = [
			{ key: 'a', width: 3 },
			{ key: 'b', width: 2 },
			{ key: 'fill', fillWidth: true },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 1 );
	} );

	it( 'adapts to different column counts (responsive)', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill', fillWidth: true },
			{ key: 'sidebar', width: 1 },
		];
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 6 ).get(
				'fill'
			)
		).toBe( 5 );
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 4 ).get(
				'fill'
			)
		).toBe( 3 );
		expect(
			resolveFillWidths( keys( items ), makeMap( items ), 2 ).get(
				'fill'
			)
		).toBe( 1 );
	} );

	it( 'look-ahead stops at fillWidth boundary', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill-1', fillWidth: true },
			{ key: 'fill-2', fillWidth: true },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill-1' ) ).toBe( 6 );
		expect( result.get( 'fill-2' ) ).toBe( 5 );
	} );

	it( 'look-ahead stops at fullWidth boundary', () => {
		const items: GridLayoutItem[] = [
			{ key: 'fill', fillWidth: true },
			{ key: 'full', fullWidth: true },
			{ key: 'sidebar', width: 1 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 6 );
	} );

	it( 'every item gets 1 column when maxColumns is 1', () => {
		const items: GridLayoutItem[] = [
			{ key: 'a', width: 3 },
			{ key: 'fill', fillWidth: true },
			{ key: 'b', width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 1 );
		expect( result.get( 'fill' ) ).toBe( 1 );
	} );

	it( 'returns empty map for an empty layout', () => {
		const result = resolveFillWidths( [], new Map(), 6 );
		expect( result.size ).toBe( 0 );
	} );

	it( 'fill item with explicit width still gets resolved fill span', () => {
		const items: GridLayoutItem[] = [
			{ key: 'sidebar', width: 1 },
			{ key: 'fill', fillWidth: true, width: 2 },
		];
		const result = resolveFillWidths( keys( items ), makeMap( items ), 6 );
		expect( result.get( 'fill' ) ).toBe( 5 );
	} );
} );
