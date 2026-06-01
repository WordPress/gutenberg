/**
 * Internal dependencies
 */
import { migrateLayout } from '../migrate-layout';
import type { DashboardWidget } from '../../../types';

function widget( uuid: string, placement: object | undefined = undefined ) {
	return {
		uuid,
		type: 'core/test' as const,
		placement,
	} as DashboardWidget;
}

describe( 'migrateLayout', () => {
	it( 'returns input unchanged when source and target match', () => {
		const layout: DashboardWidget[] = [
			widget( 'a', { width: 2, height: 1 } ),
		];
		expect( migrateLayout( layout, 'grid', 'grid' ) ).toBe( layout );
	} );

	it( 'treats undefined source as grid', () => {
		const layout: DashboardWidget[] = [
			widget( 'a', { width: 'full', height: 1 } ),
		];
		const migrated = migrateLayout( layout, undefined, 'masonry', {
			columns: 4,
		} );
		expect( migrated[ 0 ].placement ).toEqual( { width: 4 } );
	} );

	describe( 'grid to masonry', () => {
		it( "expands 'full' to the target column count", () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 'full', height: 1 } ),
			];
			const migrated = migrateLayout( layout, 'grid', 'masonry', {
				columns: 6,
			} );
			expect( migrated[ 0 ].placement ).toEqual( { width: 6 } );
		} );

		it( "collapses 'fill' to a single column", () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 'fill', height: 2 } ),
			];
			const migrated = migrateLayout( layout, 'grid', 'masonry', {
				columns: 6,
			} );
			expect( migrated[ 0 ].placement ).toEqual( {} );
		} );

		it( 'preserves numeric width and drops height and explicit width=1', () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 3, height: 2, order: 5 } ),
				widget( 'b', { width: 1, height: 1 } ),
			];
			const migrated = migrateLayout( layout, 'grid', 'masonry', {
				columns: 6,
			} );
			expect( migrated[ 0 ].placement ).toEqual( {
				width: 3,
				order: 5,
			} );
			expect( migrated[ 1 ].placement ).toEqual( {} );
		} );

		it( 'falls back to a default column count when not provided', () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 'full', height: 1 } ),
			];
			const migrated = migrateLayout( layout, 'grid', 'masonry' );
			expect( migrated[ 0 ].placement ).toEqual( { width: 6 } );
		} );

		it( 'handles widgets without a placement', () => {
			const layout: DashboardWidget[] = [ widget( 'a' ) ];
			const migrated = migrateLayout( layout, 'grid', 'masonry' );
			expect( migrated[ 0 ].placement ).toEqual( {} );
		} );
	} );

	describe( 'masonry to grid', () => {
		it( 'seeds height=1 and preserves width and order', () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 2, order: 1 } ),
			];
			const migrated = migrateLayout( layout, 'masonry', 'grid' );
			expect( migrated[ 0 ].placement ).toEqual( {
				width: 2,
				height: 1,
				order: 1,
			} );
		} );

		it( 'drops the lane field', () => {
			const layout: DashboardWidget[] = [
				widget( 'a', { width: 1, lane: 2 } ),
			];
			const migrated = migrateLayout( layout, 'masonry', 'grid' );
			expect( migrated[ 0 ].placement ).toEqual( {
				width: 1,
				height: 1,
			} );
		} );

		it( 'handles widgets without a placement', () => {
			const layout: DashboardWidget[] = [ widget( 'a' ) ];
			const migrated = migrateLayout( layout, 'masonry', 'grid' );
			expect( migrated[ 0 ].placement ).toEqual( { height: 1 } );
		} );
	} );
} );
