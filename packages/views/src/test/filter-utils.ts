/**
 * WordPress dependencies
 */
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import {
	mergeActiveViewOverrides,
	stripActiveViewOverrides,
} from '../filter-utils';

const baseView: View = {
	type: 'table',
	filters: [ { field: 'author', operator: 'isAny', value: [ 'admin' ] } ],
	sort: { field: 'date', direction: 'desc' },
	page: 1,
	perPage: 25,
};

const defaultView: View = {
	type: 'table',
	sort: { field: 'date', direction: 'desc' },
};

describe( 'mergeActiveViewOverrides', () => {
	it( 'should return the view unchanged when no overrides are provided', () => {
		expect( mergeActiveViewOverrides( baseView ) ).toBe( baseView );
		expect( mergeActiveViewOverrides( baseView, undefined ) ).toBe(
			baseView
		);
	} );

	describe( 'scalar overrides', () => {
		it( 'should merge titleField override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				titleField: 'name',
			} );
			expect( result.titleField ).toBe( 'name' );
		} );

		it( 'should merge mediaField override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				mediaField: 'thumbnail',
			} );
			expect( result.mediaField ).toBe( 'thumbnail' );
		} );

		it( 'should merge descriptionField override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				descriptionField: 'excerpt',
			} );
			expect( result.descriptionField ).toBe( 'excerpt' );
		} );

		it( 'should merge showTitle override', () => {
			const result = mergeActiveViewOverrides(
				{ ...baseView, showTitle: true },
				{ showTitle: false }
			);
			expect( result.showTitle ).toBe( false );
		} );

		it( 'should merge showMedia override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				showMedia: true,
			} );
			expect( result.showMedia ).toBe( true );
		} );

		it( 'should merge showDescription override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				showDescription: false,
			} );
			expect( result.showDescription ).toBe( false );
		} );

		it( 'should merge showLevels override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				showLevels: true,
			} );
			expect( result.showLevels ).toBe( true );
		} );

		it( 'should merge infiniteScrollEnabled override', () => {
			const result = mergeActiveViewOverrides( baseView, {
				infiniteScrollEnabled: true,
			} );
			expect( result.infiniteScrollEnabled ).toBe( true );
		} );

		it( 'should override existing scalar value on the view', () => {
			const view: View = { ...baseView, titleField: 'old-title' };
			const result = mergeActiveViewOverrides( view, {
				titleField: 'new-title',
			} );
			expect( result.titleField ).toBe( 'new-title' );
		} );

		it( 'should merge multiple scalar overrides at once', () => {
			const result = mergeActiveViewOverrides( baseView, {
				titleField: 'name',
				showTitle: true,
				showMedia: false,
				infiniteScrollEnabled: true,
			} );
			expect( result.titleField ).toBe( 'name' );
			expect( result.showTitle ).toBe( true );
			expect( result.showMedia ).toBe( false );
			expect( result.infiniteScrollEnabled ).toBe( true );
		} );
	} );

	describe( 'filter overrides', () => {
		it( 'should add override filters', () => {
			const result = mergeActiveViewOverrides( baseView, {
				filters: [
					{ field: 'status', operator: 'isAny', value: 'publish' },
				],
			} );
			expect( result.filters ).toHaveLength( 2 );
			expect( result.filters ).toEqual(
				expect.arrayContaining( [
					{ field: 'author', operator: 'isAny', value: [ 'admin' ] },
					{
						field: 'status',
						operator: 'isAny',
						value: 'publish',
					},
				] )
			);
		} );

		it( 'should replace same-field filters', () => {
			const result = mergeActiveViewOverrides( baseView, {
				filters: [
					{
						field: 'author',
						operator: 'isAny',
						value: [ 'editor' ],
					},
				],
			} );
			expect( result.filters ).toHaveLength( 1 );
			expect( result.filters![ 0 ] ).toEqual( {
				field: 'author',
				operator: 'isAny',
				value: [ 'editor' ],
			} );
		} );

		it( 'should handle empty override filters array', () => {
			const result = mergeActiveViewOverrides( baseView, {
				filters: [],
			} );
			// Empty filters array is treated as no override.
			expect( result.filters ).toEqual( baseView.filters );
		} );
	} );

	describe( 'sort overrides', () => {
		it( 'should apply sort override when current sort matches default', () => {
			const result = mergeActiveViewOverrides(
				baseView,
				{ sort: { field: 'title', direction: 'asc' } },
				defaultView
			);
			expect( result.sort ).toEqual( {
				field: 'title',
				direction: 'asc',
			} );
		} );

		it( 'should not apply sort override when user has changed sort', () => {
			const userView: View = {
				...baseView,
				sort: { field: 'title', direction: 'asc' },
			};
			const result = mergeActiveViewOverrides(
				userView,
				{ sort: { field: 'modified', direction: 'desc' } },
				defaultView
			);
			expect( result.sort ).toEqual( {
				field: 'title',
				direction: 'asc',
			} );
		} );

		it( 'should not apply sort override when no default view is provided', () => {
			const result = mergeActiveViewOverrides( baseView, {
				sort: { field: 'title', direction: 'asc' },
			} );
			expect( result.sort ).toEqual( baseView.sort );
		} );
	} );

	describe( 'layout overrides', () => {
		it( 'should merge layout override into existing layout', () => {
			const view: View = {
				...baseView,
				layout: { density: 'compact' },
			};
			const result = mergeActiveViewOverrides( view, {
				layout: { styles: { author: { align: 'end' } } },
			} );
			expect( result.layout ).toEqual( {
				density: 'compact',
				styles: { author: { align: 'end' } },
			} );
		} );

		it( 'should set layout when view has no existing layout', () => {
			const result = mergeActiveViewOverrides( baseView, {
				layout: { styles: { title: { width: '50%' } } },
			} );
			expect( result.layout ).toEqual( {
				styles: { title: { width: '50%' } },
			} );
		} );

		it( 'should override matching layout keys', () => {
			const view: View = {
				...baseView,
				layout: {
					density: 'compact',
					styles: { old: { width: '10%' } },
				},
			};
			const result = mergeActiveViewOverrides( view, {
				layout: { styles: { new: { width: '20%' } } },
			} );
			// Shallow merge: styles key is replaced entirely.
			expect( result.layout ).toEqual( {
				density: 'compact',
				styles: { new: { width: '20%' } },
			} );
		} );
	} );

	describe( 'groupBy overrides', () => {
		it( 'should replace groupBy with override', () => {
			const view: View = {
				...baseView,
				groupBy: {
					field: 'status',
					direction: 'asc',
					showLabel: false,
				},
			};
			const result = mergeActiveViewOverrides( view, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result.groupBy ).toEqual( {
				field: 'category',
				direction: 'desc',
			} );
		} );

		it( 'should set groupBy when view has none', () => {
			const result = mergeActiveViewOverrides( baseView, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result.groupBy ).toEqual( {
				field: 'category',
				direction: 'desc',
			} );
		} );
	} );

	it( 'should not mutate the original view', () => {
		const original = { ...baseView };
		mergeActiveViewOverrides( original, {
			titleField: 'name',
			filters: [
				{ field: 'status', operator: 'isAny', value: 'publish' },
			],
			layout: { styles: {} },
		} );
		expect( original ).toEqual( baseView );
	} );
} );

describe( 'stripActiveViewOverrides', () => {
	it( 'should return the view unchanged when no overrides are provided', () => {
		expect( stripActiveViewOverrides( baseView ) ).toBe( baseView );
		expect( stripActiveViewOverrides( baseView, undefined ) ).toBe(
			baseView
		);
	} );

	describe( 'scalar stripping', () => {
		it( 'should strip a scalar key managed by overrides', () => {
			const view: View = { ...baseView, titleField: 'name' };
			const result = stripActiveViewOverrides( view, {
				titleField: 'name',
			} );
			expect( result ).not.toHaveProperty( 'titleField' );
		} );

		it( 'should strip multiple scalar keys', () => {
			const view: View = {
				...baseView,
				titleField: 'name',
				showTitle: true,
				mediaField: 'thumb',
			};
			const result = stripActiveViewOverrides( view, {
				titleField: 'name',
				showTitle: true,
				mediaField: 'thumb',
			} );
			expect( result ).not.toHaveProperty( 'titleField' );
			expect( result ).not.toHaveProperty( 'showTitle' );
			expect( result ).not.toHaveProperty( 'mediaField' );
		} );

		it( 'should preserve non-overridden scalar keys', () => {
			const view: View = {
				...baseView,
				titleField: 'name',
				descriptionField: 'excerpt',
			};
			const result = stripActiveViewOverrides( view, {
				titleField: 'name',
			} );
			expect( result ).not.toHaveProperty( 'titleField' );
			expect( result.descriptionField ).toBe( 'excerpt' );
		} );
	} );

	describe( 'filter stripping', () => {
		it( 'should remove filters on managed fields', () => {
			const view: View = {
				...baseView,
				filters: [
					{
						field: 'status',
						operator: 'isAny',
						value: 'publish',
					},
					{
						field: 'author',
						operator: 'isAny',
						value: [ 'admin' ],
					},
				],
			};
			const result = stripActiveViewOverrides( view, {
				filters: [
					{
						field: 'status',
						operator: 'isAny',
						value: 'publish',
					},
				],
			} );
			expect( result.filters ).toHaveLength( 1 );
			expect( result.filters?.[ 0 ].field ).toBe( 'author' );
		} );

		it( 'should handle empty override filters', () => {
			const result = stripActiveViewOverrides( baseView, {
				filters: [],
			} );
			expect( result.filters ).toEqual( baseView.filters );
		} );
	} );

	describe( 'sort stripping', () => {
		it( 'should restore default sort when current matches override', () => {
			const view: View = {
				...baseView,
				sort: { field: 'title', direction: 'asc' },
			};
			const result = stripActiveViewOverrides(
				view,
				{ sort: { field: 'title', direction: 'asc' } },
				defaultView
			);
			expect( result.sort ).toEqual( defaultView.sort );
		} );

		it( 'should not change sort when it does not match override', () => {
			const view: View = {
				...baseView,
				sort: { field: 'author', direction: 'asc' },
			};
			const result = stripActiveViewOverrides(
				view,
				{ sort: { field: 'title', direction: 'asc' } },
				defaultView
			);
			expect( result.sort ).toEqual( {
				field: 'author',
				direction: 'asc',
			} );
		} );
	} );

	describe( 'layout stripping', () => {
		it( 'should strip layout keys managed by overrides', () => {
			const view: View = {
				...baseView,
				layout: {
					density: 'compact',
					styles: { author: { align: 'end' } },
				},
			};
			const result = stripActiveViewOverrides( view, {
				layout: { styles: { author: { align: 'end' } } },
			} );
			expect( result.layout ).toEqual( { density: 'compact' } );
		} );

		it( 'should set layout to undefined when all keys are stripped', () => {
			const view: View = {
				...baseView,
				layout: {
					styles: { author: { align: 'end' } },
				},
			};
			const result = stripActiveViewOverrides( view, {
				layout: { styles: { author: { align: 'end' } } },
			} );
			expect( result.layout ).toBeUndefined();
		} );

		it( 'should not touch layout when view has no layout', () => {
			const result = stripActiveViewOverrides( baseView, {
				layout: { styles: {} },
			} );
			expect( result ).not.toHaveProperty( 'layout' );
		} );
	} );

	describe( 'groupBy stripping', () => {
		it( 'should remove groupBy when managed by overrides', () => {
			const view: View = {
				...baseView,
				groupBy: {
					field: 'status',
					direction: 'asc',
					showLabel: true,
				},
			};
			const result = stripActiveViewOverrides( view, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result ).not.toHaveProperty( 'groupBy' );
		} );

		it( 'should not touch groupBy when view has no groupBy', () => {
			const result = stripActiveViewOverrides( baseView, {
				groupBy: { field: 'category', direction: 'asc' },
			} );
			expect( result ).not.toHaveProperty( 'groupBy' );
		} );
	} );

	it( 'should not mutate the original view', () => {
		const view: View = {
			...baseView,
			titleField: 'name',
			layout: { density: 'compact', styles: { a: { width: '1px' } } },
		};
		const original = { ...view, layout: { ...view.layout } };
		stripActiveViewOverrides( view, {
			titleField: 'name',
			layout: { styles: {} },
		} );
		expect( view ).toEqual( original );
	} );
} );

describe( 'merge + strip round-trip', () => {
	it( 'should strip what merge added for scalar overrides', () => {
		const overrides = {
			titleField: 'name' as const,
			showMedia: true as const,
		};
		const merged = mergeActiveViewOverrides( baseView, overrides );
		const stripped = stripActiveViewOverrides( merged, overrides );
		expect( stripped ).not.toHaveProperty( 'titleField' );
		expect( stripped ).not.toHaveProperty( 'showMedia' );
		// Original fields remain.
		expect( stripped.type ).toBe( 'table' );
		expect( stripped.sort ).toEqual( baseView.sort );
	} );

	it( 'should strip what merge added for layout overrides', () => {
		const overrides = {
			layout: { styles: { author: { align: 'end' } } },
		};
		const view: View = {
			...baseView,
			layout: { density: 'compact' },
		};
		const merged = mergeActiveViewOverrides( view, overrides );
		const stripped = stripActiveViewOverrides( merged, overrides );
		expect( stripped.layout ).toEqual( { density: 'compact' } );
	} );

	it( 'should strip what merge added for filter overrides', () => {
		const overrides = {
			filters: [
				{
					field: 'status' as const,
					operator: 'isAny' as const,
					value: 'publish',
				},
			],
		};
		const merged = mergeActiveViewOverrides( baseView, overrides );
		const stripped = stripActiveViewOverrides( merged, overrides );
		// Only the original author filter should remain.
		expect( stripped.filters ).toEqual( [
			{ field: 'author', operator: 'isAny', value: [ 'admin' ] },
		] );
	} );
} );
