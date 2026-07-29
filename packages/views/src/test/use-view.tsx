/**
 * External dependencies
 */
import { act, renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
// @ts-ignore - Preferences package is not typed
import { store as preferencesStore } from '@wordpress/preferences';
import type { View } from '@wordpress/dataviews';

/**
 * Internal dependencies
 */
import { useView } from '../use-view';
import type { ActiveViewOverrides } from '../types';

const PREFERENCE_KEY = 'dataviews-postType-page-default';

function createTestRegistry() {
	const registry = createRegistry();
	registry.register( preferencesStore );
	return registry;
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

const defaultView: View = {
	type: 'table',
	perPage: 20,
	sort: { field: 'title', direction: 'asc' },
	search: 'level',
	page: 2,
};

describe( 'useView', () => {
	describe( 'search and page resolution', () => {
		it( 'should ignore the default view search and page', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should ignore the default view search and page after a preference is persisted', () => {
			const registry = createTestRegistry();
			// Simulate a persisted user preference. Persisted views never
			// contain `search`/`page` (they are URL-managed and stripped
			// before persisting).
			registry
				.dispatch( preferencesStore )
				.set( 'core/views', PREFERENCE_KEY, {
					type: 'table',
					perPage: 50,
					sort: { field: 'title', direction: 'asc' },
				} );
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should ignore a legacy search and page carried by a persisted preference', () => {
			const registry = createTestRegistry();
			registry
				.dispatch( preferencesStore )
				.set( 'core/views', PREFERENCE_KEY, {
					type: 'table',
					perPage: 50,
					search: 'stale',
					page: 4,
				} );
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should ignore search and page from active view overrides', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView: { type: 'table', perPage: 20 },
				activeViewOverrides: {
					// Not part of `ActiveViewOverrides`; a server-provided
					// `view_list` entry may still carry them at runtime.
					search: 'override',
					page: 3,
				} as ActiveViewOverrides,
			} );
			expect( result.current.view.search ).toBe( '' );
			expect( result.current.view.page ).toBe( 1 );
		} );

		it( 'should not persist a preference when the default view has search and page and the view content is unchanged', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
			} );
			act( () => {
				result.current.updateView( result.current.view );
			} );
			expect(
				registry
					.select( preferencesStore )
					.get( 'core/views', PREFERENCE_KEY )
			).toBeUndefined();
			expect( result.current.isModified ).toBe( false );
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
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
				queryParams,
				onChangeQueryParams,
			};
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

		it( 'should take search and page from the URL query params', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView,
				queryParams: { search: 'from-url', page: 5 },
			} );
			expect( result.current.view.search ).toBe( 'from-url' );
			expect( result.current.view.page ).toBe( 5 );
		} );
	} );

	describe( 'active view overrides', () => {
		it( 'should apply a type override from the active view', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView: { type: 'list' },
				activeViewOverrides: { type: 'table' },
			} );
			expect( result.current.view.type ).toBe( 'table' );
		} );

		it( 'should apply the layout defaults of the overridden type', () => {
			const registry = createTestRegistry();
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView: { type: 'list' },
				activeViewOverrides: { type: 'table' },
				defaultLayouts: {
					table: {
						layout: { styles: { author: { align: 'start' } } },
					},
					list: {},
				},
			} );
			expect( result.current.view.type ).toBe( 'table' );
			expect( ( result.current.view as any ).layout ).toEqual( {
				styles: { author: { align: 'start' } },
			} );
		} );

		it( 'should not apply a type override when the user has persisted a different type', () => {
			const registry = createTestRegistry();
			registry
				.dispatch( preferencesStore )
				.set( 'core/views', PREFERENCE_KEY, { type: 'grid' } );
			const { result } = renderUseView( registry, {
				kind: 'postType',
				name: 'page',
				slug: 'default',
				defaultView: { type: 'list' },
				activeViewOverrides: { type: 'table' },
			} );
			expect( result.current.view.type ).toBe( 'grid' );
		} );
	} );
} );
