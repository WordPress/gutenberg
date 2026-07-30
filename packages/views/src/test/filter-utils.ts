/**
 * WordPress dependencies
 */
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { mergeOverrides, stripOverrides } from '../filter-utils';

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

describe( 'mergeOverrides', () => {
	it( 'should return the view unchanged when no overrides are provided', () => {
		expect( mergeOverrides( baseView ) ).toBe( baseView );
		expect( mergeOverrides( baseView, undefined ) ).toBe( baseView );
	} );

	describe( 'scalar overrides', () => {
		it( 'should merge titleField override', () => {
			const result = mergeOverrides( baseView, {
				titleField: 'name',
			} );
			expect( result.titleField ).toBe( 'name' );
		} );

		it( 'should merge mediaField override', () => {
			const result = mergeOverrides( baseView, {
				mediaField: 'thumbnail',
			} );
			expect( result.mediaField ).toBe( 'thumbnail' );
		} );

		it( 'should merge descriptionField override', () => {
			const result = mergeOverrides( baseView, {
				descriptionField: 'excerpt',
			} );
			expect( result.descriptionField ).toBe( 'excerpt' );
		} );

		it( 'should merge showTitle override', () => {
			const result = mergeOverrides(
				{ ...baseView, showTitle: true },
				{ showTitle: false }
			);
			expect( result.showTitle ).toBe( false );
		} );

		it( 'should merge showMedia override', () => {
			const result = mergeOverrides( baseView, {
				showMedia: true,
			} );
			expect( result.showMedia ).toBe( true );
		} );

		it( 'should merge showDescription override', () => {
			const result = mergeOverrides( baseView, {
				showDescription: false,
			} );
			expect( result.showDescription ).toBe( false );
		} );

		it( 'should merge showLevels override', () => {
			const result = mergeOverrides( baseView, {
				showLevels: true,
			} );
			expect( result.showLevels ).toBe( true );
		} );

		it( 'should merge infiniteScrollEnabled override', () => {
			const result = mergeOverrides( baseView, {
				infiniteScrollEnabled: true,
			} );
			expect( result.infiniteScrollEnabled ).toBe( true );
		} );

		it( 'should override existing scalar value on the view', () => {
			const view: View = { ...baseView, titleField: 'old-title' };
			const result = mergeOverrides( view, {
				titleField: 'new-title',
			} );
			expect( result.titleField ).toBe( 'new-title' );
		} );

		it( 'should merge multiple scalar overrides at once', () => {
			const result = mergeOverrides( baseView, {
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

	describe( 'default-bound overrides (type, perPage, fields)', () => {
		it( 'should apply type override when current type matches the default', () => {
			const result = mergeOverrides(
				baseView,
				{ type: 'grid' },
				defaultView
			);
			expect( result.type ).toBe( 'grid' );
		} );

		it( 'should not apply type override when the user has changed the type', () => {
			const userView: View = { ...baseView, type: 'list' };
			const result = mergeOverrides(
				userView,
				{ type: 'grid' },
				defaultView
			);
			expect( result.type ).toBe( 'list' );
		} );

		it( 'should not apply type override when the default view has no type', () => {
			const result = mergeOverrides( baseView, { type: 'grid' }, {} );
			expect( result.type ).toBe( 'table' );
		} );

		it( 'should apply perPage override when current perPage matches the default', () => {
			const result = mergeOverrides(
				baseView,
				{ perPage: 10 },
				{ ...defaultView, perPage: 25 }
			);
			expect( result.perPage ).toBe( 10 );
		} );

		it( 'should not apply perPage override when the user has changed perPage', () => {
			const userView: View = { ...baseView, perPage: 50 };
			const result = mergeOverrides(
				userView,
				{ perPage: 10 },
				{ ...defaultView, perPage: 25 }
			);
			expect( result.perPage ).toBe( 50 );
		} );

		it( 'should apply fields override when current fields match the default', () => {
			const view: View = { ...baseView, fields: [ 'author' ] };
			const result = mergeOverrides(
				view,
				{ fields: [ 'date' ] },
				{ ...defaultView, fields: [ 'author' ] }
			);
			expect( result.fields ).toEqual( [ 'date' ] );
		} );

		it( 'should not apply fields override when the user has changed fields', () => {
			const view: View = { ...baseView, fields: [ 'author', 'status' ] };
			const result = mergeOverrides(
				view,
				{ fields: [ 'date' ] },
				{ ...defaultView, fields: [ 'author' ] }
			);
			expect( result.fields ).toEqual( [ 'author', 'status' ] );
		} );
	} );

	describe( 'filter overrides', () => {
		it( 'should add override filters', () => {
			const result = mergeOverrides( baseView, {
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

		it( 'should always replace same-field filters when the override is locked', () => {
			const result = mergeOverrides( baseView, {
				filters: [
					{
						field: 'author',
						operator: 'isAny',
						value: [ 'editor' ],
						isLocked: true,
					},
				],
			} );
			expect( result.filters ).toHaveLength( 1 );
			expect( result.filters![ 0 ] ).toEqual( {
				field: 'author',
				operator: 'isAny',
				value: [ 'editor' ],
				isLocked: true,
			} );
		} );

		it( 'should not replace a user-modified same-field filter when the override is unlocked', () => {
			// The view's author filter differs from the default view's, meaning
			// the user has modified it: the unlocked override must not win.
			const result = mergeOverrides(
				baseView,
				{
					filters: [
						{
							field: 'author',
							operator: 'isAny',
							value: [ 'editor' ],
						},
					],
				},
				defaultView
			);
			expect( result.filters ).toHaveLength( 1 );
			expect( result.filters![ 0 ] ).toEqual( {
				field: 'author',
				operator: 'isAny',
				value: [ 'admin' ],
			} );
		} );

		it( 'should replace a same-field filter that still matches the default view when the override is unlocked', () => {
			const defaultWithFilter: View = {
				...defaultView,
				filters: [
					{ field: 'author', operator: 'isAny', value: [ 'admin' ] },
				],
			};
			const result = mergeOverrides(
				baseView,
				{
					filters: [
						{
							field: 'author',
							operator: 'isAny',
							value: [ 'editor' ],
						},
					],
				},
				defaultWithFilter
			);
			expect( result.filters ).toHaveLength( 1 );
			expect( result.filters![ 0 ] ).toEqual( {
				field: 'author',
				operator: 'isAny',
				value: [ 'editor' ],
			} );
		} );

		it( 'should preserve the order of the view filters when an unlocked override applies to a non-last field', () => {
			const filters = [
				{ field: 'status', operator: 'isAny', value: [ 'publish' ] },
				{ field: 'author', operator: 'isAny', value: [ 'admin' ] },
			];
			const viewWithFilters: View = { ...baseView, filters };
			const defaultWithFilters: View = { ...defaultView, filters };
			const result = mergeOverrides(
				viewWithFilters,
				{ filters: [ filters[ 0 ] ] },
				defaultWithFilters
			);
			expect( result.filters ).toEqual( filters );
		} );

		it( 'should handle empty override filters array', () => {
			const result = mergeOverrides( baseView, {
				filters: [],
			} );
			// Empty filters array is treated as no override.
			expect( result.filters ).toEqual( baseView.filters );
		} );
	} );

	describe( 'sort overrides', () => {
		it( 'should apply sort override when current sort matches default', () => {
			const result = mergeOverrides(
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
			const result = mergeOverrides(
				userView,
				{ sort: { field: 'modified', direction: 'desc' } },
				defaultView
			);
			expect( result.sort ).toEqual( {
				field: 'title',
				direction: 'asc',
			} );
		} );

		it( 'should not apply sort override when the default view has no sort', () => {
			const result = mergeOverrides(
				baseView,
				{ sort: { field: 'title', direction: 'asc' } },
				{}
			);
			expect( result.sort ).toEqual( baseView.sort );
		} );
	} );

	describe( 'layout overrides', () => {
		it( 'should merge layout override into existing layout', () => {
			const view: View = {
				...baseView,
				layout: { density: 'compact' },
			};
			const result = mergeOverrides( view, {
				layout: { styles: { author: { align: 'end' } } },
			} );
			expect( result.layout ).toEqual( {
				density: 'compact',
				styles: { author: { align: 'end' } },
			} );
		} );

		it( 'should set layout when view has no existing layout', () => {
			const result = mergeOverrides( baseView, {
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
			const result = mergeOverrides( view, {
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
		it( 'should replace the overridden groupBy keys, leaving the others', () => {
			const view: View = {
				...baseView,
				groupBy: {
					field: 'status',
					direction: 'asc',
					showLabel: false,
				},
			};
			const result = mergeOverrides( view, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result.groupBy ).toEqual( {
				field: 'category',
				direction: 'desc',
				showLabel: false,
			} );
		} );

		it( 'should set groupBy when view has none', () => {
			const result = mergeOverrides( baseView, {
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
		mergeOverrides( original, {
			titleField: 'name',
			filters: [
				{ field: 'status', operator: 'isAny', value: 'publish' },
			],
			layout: { styles: {} },
		} );
		expect( original ).toEqual( baseView );
	} );
} );

describe( 'stripOverrides', () => {
	it( 'should return the view unchanged when no overrides are provided', () => {
		expect( stripOverrides( baseView ) ).toBe( baseView );
		expect( stripOverrides( baseView, undefined ) ).toBe( baseView );
	} );

	describe( 'scalar stripping', () => {
		it( 'should strip a scalar key managed by overrides', () => {
			const view: View = { ...baseView, titleField: 'name' };
			const result = stripOverrides( view, {
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
			const result = stripOverrides( view, {
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
			const result = stripOverrides( view, {
				titleField: 'name',
			} );
			expect( result ).not.toHaveProperty( 'titleField' );
			expect( result.descriptionField ).toBe( 'excerpt' );
		} );
	} );

	describe( 'default-bound stripping (type, perPage, fields)', () => {
		it( 'should restore the default type when current matches the override', () => {
			const view: View = { ...baseView, type: 'grid' };
			const result = stripOverrides(
				view,
				{ type: 'grid' },
				defaultView
			);
			expect( result.type ).toBe( 'table' );
		} );

		it( 'should keep a user-modified type that differs from the override', () => {
			const view: View = { ...baseView, type: 'list' };
			const result = stripOverrides(
				view,
				{ type: 'grid' },
				defaultView
			);
			expect( result.type ).toBe( 'list' );
		} );

		it( 'should restore the default perPage when current matches the override', () => {
			const view: View = { ...baseView, perPage: 10 };
			const result = stripOverrides(
				view,
				{ perPage: 10 },
				{ ...defaultView, perPage: 25 }
			);
			expect( result.perPage ).toBe( 25 );
		} );

		it( 'should keep a user-modified perPage that differs from the override', () => {
			const view: View = { ...baseView, perPage: 50 };
			const result = stripOverrides(
				view,
				{ perPage: 10 },
				{ ...defaultView, perPage: 25 }
			);
			expect( result.perPage ).toBe( 50 );
		} );

		it( 'should restore the default fields when current matches the override', () => {
			const view: View = { ...baseView, fields: [ 'date' ] };
			const result = stripOverrides(
				view,
				{ fields: [ 'date' ] },
				{ ...defaultView, fields: [ 'author' ] }
			);
			expect( result.fields ).toEqual( [ 'author' ] );
		} );

		it( 'should keep user-modified fields that differ from the override', () => {
			const view: View = { ...baseView, fields: [ 'author', 'status' ] };
			const result = stripOverrides(
				view,
				{ fields: [ 'date' ] },
				{ ...defaultView, fields: [ 'author' ] }
			);
			expect( result.fields ).toEqual( [ 'author', 'status' ] );
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
			const result = stripOverrides( view, {
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
			const result = stripOverrides( baseView, {
				filters: [],
			} );
			expect( result.filters ).toEqual( baseView.filters );
		} );

		it( 'should keep a user-modified filter on a field managed by an unlocked override', () => {
			const view: View = {
				...baseView,
				filters: [
					{ field: 'status', operator: 'isAny', value: 'draft' },
				],
			};
			const result = stripOverrides( view, {
				filters: [
					{ field: 'status', operator: 'isAny', value: 'publish' },
				],
			} );
			expect( result.filters ).toEqual( [
				{ field: 'status', operator: 'isAny', value: 'draft' },
			] );
		} );

		it( 'should never persist filters on a field managed by a locked override', () => {
			const view: View = {
				...baseView,
				filters: [
					{ field: 'status', operator: 'isAny', value: 'draft' },
				],
			};
			const result = stripOverrides( view, {
				filters: [
					{
						field: 'status',
						operator: 'isAny',
						value: 'trash',
						isLocked: true,
					},
				],
			} );
			expect( result.filters ).toEqual( [] );
		} );

		it( 'should restore the default filter when current matches an unlocked override', () => {
			const defaultWithFilter: View = {
				...defaultView,
				filters: [
					{ field: 'status', operator: 'isAny', value: 'any' },
				],
			};
			const view: View = {
				...baseView,
				filters: [
					{ field: 'status', operator: 'isAny', value: 'publish' },
				],
			};
			const result = stripOverrides(
				view,
				{
					filters: [
						{
							field: 'status',
							operator: 'isAny',
							value: 'publish',
						},
					],
				},
				defaultWithFilter
			);
			expect( result.filters ).toEqual( [
				{ field: 'status', operator: 'isAny', value: 'any' },
			] );
		} );
	} );

	describe( 'sort stripping', () => {
		it( 'should restore default sort when current matches override', () => {
			const view: View = {
				...baseView,
				sort: { field: 'title', direction: 'asc' },
			};
			const result = stripOverrides(
				view,
				{ sort: { field: 'title', direction: 'asc' } },
				defaultView
			);
			expect( result.sort ).toEqual( defaultView.sort );
		} );

		it( 'should restore default sort when a partial override is applied and the rest still matches the default', () => {
			// The override only sets `field`, so `direction` comes from the
			// default view: the resulting sort is not user-modified and must
			// not be persisted.
			const merged = mergeOverrides(
				baseView,
				{ sort: { field: 'title' } },
				defaultView
			);
			expect( merged.sort ).toEqual( {
				field: 'title',
				direction: 'desc',
			} );

			const result = stripOverrides(
				{ ...baseView, sort: merged.sort },
				{ sort: { field: 'title' } },
				defaultView
			);
			expect( result.sort ).toEqual( defaultView.sort );
		} );

		it( 'should keep sort when the user changed a key not covered by a partial override', () => {
			const view: View = {
				...baseView,
				sort: { field: 'title', direction: 'asc' },
			};
			const result = stripOverrides(
				view,
				{ sort: { field: 'title' } },
				defaultView
			);
			expect( result.sort ).toEqual( {
				field: 'title',
				direction: 'asc',
			} );
		} );

		it( 'should not change sort when it does not match override', () => {
			const view: View = {
				...baseView,
				sort: { field: 'author', direction: 'asc' },
			};
			const result = stripOverrides(
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
			const result = stripOverrides( view, {
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
			const result = stripOverrides( view, {
				layout: { styles: { author: { align: 'end' } } },
			} );
			expect( result.layout ).toBeUndefined();
		} );

		it( 'should not touch layout when view has no layout', () => {
			const result = stripOverrides( baseView, {
				layout: { styles: {} },
			} );
			expect( result ).not.toHaveProperty( 'layout' );
		} );
	} );

	describe( 'groupBy stripping', () => {
		it( 'should remove the overridden groupBy keys, leaving the others', () => {
			const view: View = {
				...baseView,
				groupBy: {
					field: 'status',
					direction: 'asc',
					showLabel: true,
				},
			};
			const result = stripOverrides( view, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result.groupBy ).toEqual( { showLabel: true } );
		} );

		it( 'should remove groupBy entirely when every key is managed by overrides', () => {
			const view: View = {
				...baseView,
				groupBy: { field: 'status', direction: 'asc' },
			};
			const result = stripOverrides( view, {
				groupBy: { field: 'category', direction: 'desc' },
			} );
			expect( result.groupBy ).toBeUndefined();
		} );

		it( 'should not touch groupBy when view has no groupBy', () => {
			const result = stripOverrides( baseView, {
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
		stripOverrides( view, {
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
		const merged = mergeOverrides( baseView, overrides );
		const stripped = stripOverrides( merged, overrides );
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
		const merged = mergeOverrides( view, overrides );
		const stripped = stripOverrides( merged, overrides );
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
		const merged = mergeOverrides( baseView, overrides );
		const stripped = stripOverrides( merged, overrides );
		// Only the original author filter should remain.
		expect( stripped.filters ).toEqual( [
			{ field: 'author', operator: 'isAny', value: [ 'admin' ] },
		] );
	} );
} );
