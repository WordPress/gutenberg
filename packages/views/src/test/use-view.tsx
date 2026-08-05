/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
import { store as preferencesStore } from '@wordpress/preferences';
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { useView } from '../use-view';

const PREFERENCE_KEY = 'dataviews-postType-page-default';

const BASE_PROPS = {
	kind: 'postType',
	name: 'page',
	slug: 'default',
} as const;

function createTestRegistry() {
	const registry = createRegistry();
	registry.register( preferencesStore );
	return registry;
}

function getPreference( registry: ReturnType< typeof createRegistry > ) {
	return registry
		.select( preferencesStore )
		.get( 'core/views', PREFERENCE_KEY );
}

function setPreference(
	registry: ReturnType< typeof createRegistry >,
	value: unknown
) {
	registry
		.dispatch( preferencesStore )
		.set( 'core/views', PREFERENCE_KEY, value );
}

function renderUseView(
	registry: ReturnType< typeof createRegistry >,
	config: Parameters< typeof useView >[ 0 ]
) {
	return renderHook( ( props ) => useView( props ), {
		initialProps: config,
		wrapper: ( { children } ) => (
			<RegistryProvider value={ registry }>{ children }</RegistryProvider>
		),
	} );
}

/**
 * The resolution order under test (later layers override earlier ones):
 *
 * 1. defaultView
 * 2. defaultLayouts (for the effective type)
 * 3. activeViewOverrides
 * 4. the user's persisted preference
 * 5. the URL query params (`page` and `search` only)
 */
describe( 'useView', () => {
	describe( 'resolution order', () => {
		it( 'should fall back to the default view when no other layer applies', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					perPage: 20,
					fields: [ 'author' ],
					sort: { field: 'title', direction: 'asc' },
				},
			} );
			expect( result.current.view ).toMatchObject( {
				type: 'table',
				perPage: 20,
				fields: [ 'author' ],
				sort: { field: 'title', direction: 'asc' },
			} );
		} );

		it( 'should let the default layouts override the default view', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
				defaultLayouts: {
					table: {
						perPage: 50,
						layout: { styles: { author: { align: 'start' } } },
					},
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.perPage ).toBe( 50 );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: { author: { align: 'start' } },
			} );
		} );

		it( 'should let the active view overrides override the default layouts', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
				defaultLayouts: { table: { perPage: 50 } },
				activeViewOverrides: { perPage: 10 },
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.perPage ).toBe( 10 );
		} );

		it( 'should let the active view overrides override the default view', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'list',
					perPage: 20,
					fields: [ 'author' ],
					sort: { field: 'title', direction: 'asc' },
					filters: [
						{ field: 'status', operator: 'is', value: 'draft' },
					],
				},
				activeViewOverrides: {
					type: 'table',
					perPage: 50,
					fields: [ 'date' ],
					sort: { field: 'date', direction: 'desc' },
					filters: [
						{ field: 'status', operator: 'is', value: 'publish' },
					],
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view ).toMatchObject( {
				type: 'table',
				perPage: 50,
				fields: [ 'date' ],
				sort: { field: 'date', direction: 'desc' },
				filters: [
					{ field: 'status', operator: 'is', value: 'publish' },
				],
			} );
		} );

		it( 'should let the user preference override the active view overrides', () => {
			const registry = createTestRegistry();
			setPreference( registry, {
				type: 'grid',
				perPage: 100,
				fields: [ 'title' ],
				sort: { field: 'title', direction: 'desc' },
				filters: [
					{ field: 'status', operator: 'is', value: 'trash' },
				],
			} );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'list', perPage: 20 },
				defaultLayouts: { table: { perPage: 50 } },
				activeViewOverrides: {
					type: 'table',
					perPage: 10,
					fields: [ 'date' ],
					sort: { field: 'date', direction: 'desc' },
					filters: [
						{ field: 'status', operator: 'is', value: 'publish' },
					],
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view ).toMatchObject( {
				type: 'grid',
				perPage: 100,
				fields: [ 'title' ],
				sort: { field: 'title', direction: 'desc' },
				filters: [
					{ field: 'status', operator: 'is', value: 'trash' },
				],
			} );
		} );

		it( 'should let a lower layer show through the properties the higher layers omit', () => {
			const registry = createTestRegistry();
			setPreference( registry, { perPage: 100 } );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'list',
					perPage: 20,
					fields: [ 'author' ],
					titleField: 'title',
				},
				activeViewOverrides: { type: 'table' },
			} as Parameters< typeof useView >[ 0 ] );
			// `perPage` from the preference, `type` from the override, the
			// rest from the default view.
			expect( result.current.view ).toMatchObject( {
				type: 'table',
				perPage: 100,
				fields: [ 'author' ],
				titleField: 'title',
			} );
		} );
	} );

	describe( 'effective type for the default layouts', () => {
		it( 'should use the type of the default view', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'list' },
				defaultLayouts: {
					table: { perPage: 50 },
					list: { perPage: 30 },
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.perPage ).toBe( 30 );
		} );

		it( 'should use the type an override sets', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'list' },
				activeViewOverrides: { type: 'table' },
				defaultLayouts: {
					table: {
						layout: { styles: { author: { align: 'start' } } },
					},
					list: { layout: { styles: { date: { align: 'end' } } } },
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.type ).toBe( 'table' );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: { author: { align: 'start' } },
			} );
		} );

		it( 'should use the type the user persisted, over the one an override sets', () => {
			const registry = createTestRegistry();
			setPreference( registry, { type: 'grid' } );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'list' },
				activeViewOverrides: { type: 'table' },
				defaultLayouts: {
					table: { perPage: 50 },
					grid: { perPage: 40 },
					list: { perPage: 30 },
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.type ).toBe( 'grid' );
			expect( result.current.view.perPage ).toBe( 40 );
		} );

		it( 'should ignore a `true` layout entry', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
				defaultLayouts: { table: true },
			} as unknown as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.perPage ).toBe( 20 );
		} );

		it( 'should ignore a missing layout entry for the effective type', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
				defaultLayouts: { list: { perPage: 30 } },
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.perPage ).toBe( 20 );
		} );
	} );

	describe( 'nested properties', () => {
		it( 'should merge `layout` leaf by leaf across the layers', () => {
			const registry = createTestRegistry();
			setPreference( registry, {
				layout: { styles: { author: { width: '20%' } } },
			} );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					layout: { styles: { author: { align: 'start' } } },
				},
				defaultLayouts: {
					table: { layout: { styles: { date: { align: 'end' } } } },
				},
				activeViewOverrides: {
					layout: { styles: { title: { width: '50%' } } },
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: {
					author: { align: 'start', width: '20%' },
					date: { align: 'end' },
					title: { width: '50%' },
				},
			} );
		} );

		it( 'should let a higher layer replace a leaf without wiping its siblings', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					layout: {
						styles: {
							author: { align: 'start' },
							date: { align: 'start' },
						},
					},
				},
				activeViewOverrides: {
					layout: { styles: { author: { align: 'end' } } },
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: {
					author: { align: 'end' },
					date: { align: 'start' },
				},
			} );
		} );

		it( 'should merge `groupBy` leaf by leaf across the layers', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					groupBy: { field: 'author', direction: 'asc' },
				},
				activeViewOverrides: { groupBy: { direction: 'desc' } },
			} as unknown as Parameters< typeof useView >[ 0 ] );
			expect( ( result.current.view as any ).groupBy ).toEqual( {
				field: 'author',
				direction: 'desc',
			} );
		} );

		it( 'should merge a partial `sort` override over the default view sort', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					sort: { field: 'title', direction: 'asc' },
				},
				activeViewOverrides: { sort: { direction: 'desc' } },
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.sort ).toEqual( {
				field: 'title',
				direction: 'desc',
			} );
		} );

		it( 'should replace arrays wholesale rather than merging them', () => {
			const registry = createTestRegistry();
			setPreference( registry, { fields: [ 'title' ] } );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					fields: [ 'author', 'date', 'status' ],
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.fields ).toEqual( [ 'title' ] );
		} );

		it( 'should let the user persist an empty array over a populated lower layer', () => {
			const registry = createTestRegistry();
			setPreference( registry, { filters: [] } );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
				activeViewOverrides: {
					filters: [
						{ field: 'status', operator: 'is', value: 'publish' },
					],
				},
			} as Parameters< typeof useView >[ 0 ] );
			expect( result.current.view.filters ).toEqual( [] );
		} );
	} );

	describe( '`page` and `search`', () => {
		it( 'should be taken from the URL query params', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
				queryParams: { search: 'from-url', page: 5 },
			} );
			expect( result.current.view.search ).toBe( 'from-url' );
			expect( result.current.view.page ).toBe( 5 );
		} );

		it( 'should default to the first page and an empty search', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		// The URL is their only source: an absent param is indistinguishable
		// from the user having cleared the value, so any fallback from a lower
		// layer would resurrect a cleared search on the next read.
		it( 'should ignore the values the default view carries', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', search: 'level', page: 2 },
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should ignore the values a persisted preference carries', () => {
			const registry = createTestRegistry();
			setPreference( registry, {
				type: 'table',
				search: 'stale',
				page: 4,
			} );
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should ignore the values an active view override carries', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
				// A server-provided `view_list` entry may carry them, but
				// they are URL-managed and must never take effect.
				activeViewOverrides: { search: 'override', page: 3 },
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should be reported through `onChangeQueryParams` instead of being persisted', () => {
			const registry = createTestRegistry();
			const onChangeQueryParams = jest.fn();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
				onChangeQueryParams,
			} );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					search: 'typed',
					page: 3,
				} );
			} );
			expect( onChangeQueryParams ).toHaveBeenCalledWith( {
				search: 'typed',
				page: 3,
			} );
			expect( getPreference( registry ) ).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
		} );

		it( 'should not report unchanged query params', () => {
			const registry = createTestRegistry();
			const onChangeQueryParams = jest.fn();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table' },
				queryParams: { search: 'level', page: 2 },
				onChangeQueryParams,
			} );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					perPage: 50,
				} );
			} );
			expect( onChangeQueryParams ).not.toHaveBeenCalled();
		} );

		it( 'should keep the search cleared when the consumer drops the emptied URL param', () => {
			const registry = createTestRegistry();
			let queryParams: { page?: number; search?: string } = {
				search: 'level',
			};
			const onChangeQueryParams = jest.fn(
				( newParams: { page?: number; search?: string } ) => {
					// Mirrors real consumers, which drop an empty search from
					// the URL instead of serializing `?search=`.
					queryParams = {
						...queryParams,
						...newParams,
						search: newParams.search || undefined,
					};
				}
			);
			const props = {
				...BASE_PROPS,
				defaultView: { type: 'table', search: 'level' },
				queryParams,
				onChangeQueryParams,
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			expect( result.current.view.search ).toBe( 'level' );

			// The user clears the search input.
			act( () => {
				result.current.updateView( {
					...result.current.view,
					search: '',
				} );
			} );
			expect( onChangeQueryParams ).toHaveBeenCalledWith( {
				page: 1,
				search: '',
			} );

			// The consumer feeds the updated URL params back into the hook.
			rerender( { ...props, queryParams } );
			expect( result.current.view.search ).toBe( '' );
		} );
	} );

	describe( 'persistence', () => {
		it( 'should persist only the properties the user actually changed', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					perPage: 20,
					fields: [ 'author' ],
					sort: { field: 'title', direction: 'asc' },
				},
			} );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					perPage: 50,
				} );
			} );
			expect( getPreference( registry ) ).toEqual( { perPage: 50 } );
			expect( result.current.isModified ).toBe( true );
		} );

		it( 'should not persist anything when nothing changed', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					perPage: 20,
					sort: { field: 'title', direction: 'asc' },
				},
				defaultLayouts: { table: { perPage: 50 } },
				activeViewOverrides: { fields: [ 'date' ] },
			} as Parameters< typeof useView >[ 0 ] );
			act( () => {
				result.current.updateView( result.current.view );
			} );
			expect( getPreference( registry ) ).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
		} );

		it( 'should not persist a value the lower layers already resolve to', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
				defaultLayouts: { table: { perPage: 50 } },
			} as Parameters< typeof useView >[ 0 ] );
			act( () => {
				// 50 is what the default layouts already provide.
				result.current.updateView( {
					...result.current.view,
					perPage: 50,
				} );
			} );
			expect( getPreference( registry ) ).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
		} );

		describe( 'switching layout types', () => {
			const defaultLayouts = {
				grid: {
					showMedia: true,
					layout: { badgeFields: [ 'status' ] },
				},
				table: {
					showMedia: false,
					layout: { styles: { title: { minWidth: 320 } } },
				},
			};
			const props = {
				...BASE_PROPS,
				defaultView: { type: 'grid' },
				defaultLayouts,
			} as Parameters< typeof useView >[ 0 ];

			function switchLayout(
				view: View,
				type: keyof typeof defaultLayouts
			) {
				const { layout, ...rest } = view as View & {
					layout?: unknown;
				};
				return { ...rest, type, ...defaultLayouts[ type ] } as View;
			}

			it( 'should persist only the type, not the layout defaults it selects', () => {
				const registry = createTestRegistry();
				const { result, rerender } = renderUseView( registry, props );
				act( () => {
					result.current.updateView(
						switchLayout( result.current.view, 'table' )
					);
				} );
				rerender( props );

				expect( getPreference( registry ) ).toEqual( {
					type: 'table',
				} );
				expect( result.current.view ).toMatchObject( {
					type: 'table',
					showMedia: false,
				} );
			} );

			it( 'should clear the preference on a round trip back to the default type', () => {
				const registry = createTestRegistry();
				const { result, rerender } = renderUseView( registry, props );
				act( () => {
					result.current.updateView(
						switchLayout( result.current.view, 'table' )
					);
				} );
				rerender( props );
				act( () => {
					result.current.updateView(
						switchLayout( result.current.view, 'grid' )
					);
				} );
				rerender( props );

				expect( getPreference( registry ) ).toBeUndefined();
				expect( result.current.isModified ).toBe( false );
				expect( result.current.view ).toMatchObject( {
					type: 'grid',
					showMedia: true,
				} );
			} );
		} );

		// A value the user picks that happens to be the one a lower layer
		// carries is still their pick: it has to be persisted, otherwise the
		// override would bounce it back on the next read.
		it.each( [
			{
				property: 'type',
				defaultView: { type: 'table' },
				activeViewOverrides: { type: 'grid' },
				overridden: 'grid',
				picked: 'table',
			},
			{
				property: 'perPage',
				defaultView: { type: 'table', perPage: 20 },
				activeViewOverrides: { perPage: 50 },
				overridden: 50,
				picked: 20,
			},
			{
				property: 'fields',
				defaultView: { type: 'table', fields: [ 'author' ] },
				activeViewOverrides: { fields: [ 'date' ] },
				overridden: [ 'date' ],
				picked: [ 'author' ],
			},
			{
				property: 'sort',
				defaultView: {
					type: 'table',
					sort: { field: 'title', direction: 'asc' },
				},
				activeViewOverrides: {
					sort: { field: 'date', direction: 'desc' },
				},
				overridden: { field: 'date', direction: 'desc' },
				picked: { field: 'title', direction: 'asc' },
			},
			{
				property: 'filters',
				defaultView: {
					type: 'table',
					filters: [
						{ field: 'status', operator: 'is', value: 'draft' },
					],
				},
				activeViewOverrides: {
					filters: [
						{ field: 'status', operator: 'is', value: 'publish' },
					],
				},
				overridden: [
					{ field: 'status', operator: 'is', value: 'publish' },
				],
				picked: [ { field: 'status', operator: 'is', value: 'draft' } ],
			},
		] )(
			'should let the user pick the $property the default view carries while an override is active',
			( {
				property,
				defaultView: propsDefaultView,
				activeViewOverrides,
				overridden,
				picked,
			} ) => {
				const registry = createTestRegistry();
				const props = {
					...BASE_PROPS,
					defaultView: propsDefaultView,
					activeViewOverrides,
				} as Parameters< typeof useView >[ 0 ];
				const { result, rerender } = renderUseView( registry, props );
				// The override wins while the user has not picked a value.
				expect( ( result.current.view as any )[ property ] ).toEqual(
					overridden
				);

				act( () => {
					result.current.updateView( {
						...result.current.view,
						[ property ]: picked,
					} );
				} );
				rerender( props );

				// It must stick: the override may not bounce the pick back.
				expect( ( result.current.view as any )[ property ] ).toEqual(
					picked
				);
				expect( getPreference( registry ) ).toEqual( {
					[ property ]: picked,
				} );
				expect( result.current.isModified ).toBe( true );
			}
		);

		it( 'should let the user remove a filter an override provides', () => {
			const registry = createTestRegistry();
			const props = {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					filters: [
						{ field: 'status', operator: 'is', value: 'draft' },
					],
				},
				activeViewOverrides: {
					filters: [
						{ field: 'status', operator: 'is', value: 'publish' },
					],
				},
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			expect( result.current.view.filters ).toEqual( [
				{ field: 'status', operator: 'is', value: 'publish' },
			] );

			// Removing the filter is a pick too: an absent filter must not
			// read as "the user has not picked".
			act( () => {
				result.current.updateView( {
					...result.current.view,
					filters: [],
				} );
			} );
			rerender( props );

			expect( result.current.view.filters ).toEqual( [] );
			expect( getPreference( registry ) ).toEqual( { filters: [] } );
			expect( result.current.isModified ).toBe( true );
		} );

		it( 'should persist only the changed leaf of a nested property', () => {
			const registry = createTestRegistry();
			const props = {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					layout: {
						styles: {
							author: { align: 'start' },
							date: { align: 'start' },
						},
					},
				},
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					layout: {
						styles: {
							author: { align: 'start' },
							date: { align: 'end' },
						},
					},
				} as View );
			} );
			rerender( props );

			expect( getPreference( registry ) ).toEqual( {
				layout: { styles: { date: { align: 'end' } } },
			} );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: {
					author: { align: 'start' },
					date: { align: 'end' },
				},
			} );
		} );

		it( 'should drop a property from the preference when the user reverts it', () => {
			const registry = createTestRegistry();
			setPreference( registry, { perPage: 50, fields: [ 'title' ] } );
			const props = {
				...BASE_PROPS,
				defaultView: {
					type: 'table',
					perPage: 20,
					fields: [ 'author' ],
				},
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					perPage: 20,
				} );
			} );
			rerender( props );

			// The reverted key is removed, not stored as `undefined`.
			const preference = getPreference( registry );
			expect( preference ).toEqual( { fields: [ 'title' ] } );
			expect( Object.keys( preference ) ).not.toContain( 'perPage' );
			expect( result.current.isModified ).toBe( true );
		} );

		it( 'should clear the preference when the user reverts every property', () => {
			const registry = createTestRegistry();
			setPreference( registry, { perPage: 50 } );
			const props = {
				...BASE_PROPS,
				defaultView: { type: 'table', perPage: 20 },
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					perPage: 20,
				} );
			} );
			rerender( props );

			expect( getPreference( registry ) ).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
		} );

		// The preference key is shared by every tab of a screen: the tabs are
		// the same kind/name/slug and differ only in `activeViewOverrides`.
		// See https://github.com/WordPress/gutenberg/pull/80832#discussion_r3692195664.
		it( 'should keep a modification persisted from another tab when updating an unrelated property', () => {
			const registry = createTestRegistry();
			const defaultView = {
				type: 'table',
				perPage: 20,
				sort: { field: 'title', direction: 'asc' },
			};
			// Tab A overrides the sort; Tab B has no overrides.
			const tabAProps = {
				...BASE_PROPS,
				defaultView,
				activeViewOverrides: {
					sort: { field: 'date', direction: 'desc' },
				},
			} as Parameters< typeof useView >[ 0 ];
			const tabBProps = {
				...BASE_PROPS,
				defaultView,
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, tabAProps );

			// In Tab A, the user explicitly picks the sort back to the
			// default the override replaced. The pick is persisted.
			act( () => {
				result.current.updateView( {
					...result.current.view,
					sort: { field: 'title', direction: 'asc' },
				} );
			} );
			rerender( tabAProps );
			expect( getPreference( registry ) ).toEqual( {
				sort: { field: 'title', direction: 'asc' },
			} );

			// In Tab B — where that sort equals the base — the user changes
			// only `perPage`.
			rerender( tabBProps );
			act( () => {
				result.current.updateView( {
					...result.current.view,
					perPage: 50,
				} );
			} );
			rerender( tabBProps );
			expect( result.current.view.perPage ).toBe( 50 );

			// Back in Tab A, the sort pick must survive: the update made in
			// Tab B touched an unrelated property.
			rerender( tabAProps );
			expect( result.current.view.sort ).toEqual( {
				field: 'title',
				direction: 'asc',
			} );
			expect( getPreference( registry ) ).toEqual( {
				perPage: 50,
				sort: { field: 'title', direction: 'asc' },
			} );
		} );

		it( 'should reset to the resolved default', () => {
			const registry = createTestRegistry();
			setPreference( registry, { perPage: 100, type: 'grid' } );
			const props = {
				...BASE_PROPS,
				defaultView: { type: 'list', perPage: 20 },
				activeViewOverrides: { type: 'table' },
			} as Parameters< typeof useView >[ 0 ];
			const { result, rerender } = renderUseView( registry, props );
			expect( result.current.isModified ).toBe( true );

			act( () => {
				result.current.resetToDefault();
			} );
			rerender( props );

			expect( getPreference( registry ) ).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
			expect( result.current.view ).toMatchObject( {
				type: 'table',
				perPage: 20,
			} );
		} );
	} );
} );
