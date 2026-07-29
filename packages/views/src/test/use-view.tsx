/**
 * External dependencies
 */
import { renderHook } from '@testing-library/react';

/**
 * WordPress dependencies
 */
import { createRegistry, RegistryProvider } from '@wordpress/data';
// @ts-ignore - Preferences package is not typed
import { store as preferencesStore } from '@wordpress/preferences';

/**
 * Internal dependencies
 */
import { useView } from '../use-view';

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

describe( 'useView', () => {
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
