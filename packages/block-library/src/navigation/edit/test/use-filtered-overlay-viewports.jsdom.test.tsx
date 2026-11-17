import { afterEach, describe, expect, it, vi } from 'vitest';
import type { ReactNode } from 'react';
import { act, renderHook } from '@testing-library/react';
import { createReduxStore, dispatch, register, select } from '@wordpress/data';
import { addFilter, removeAllFilters } from '@wordpress/hooks';
import useFilteredOverlayViewports from '../use-filtered-overlay-viewports';
import OverlayPreviewContext from '../overlay-preview-context';

const HOOK = 'blocks.navigation.overlayViewports';

// Stands in for a multilingual plugin's store of the current language.
const languageStore = createReduxStore( 'test/navigation-overlay-language', {
	reducer: (
		state: string = 'en',
		action: { type: string; language?: string }
	) =>
		action.type === 'SET_LANGUAGE' && action.language
			? action.language
			: state,
	actions: {
		setLanguage: ( language: string ) => ( {
			type: 'SET_LANGUAGE',
			language,
		} ),
	},
	selectors: {
		getLanguage: ( state: string ) => state,
	},
} );
register( languageStore );

const TABLET = { mobile: true, tablet: true, desktop: false };

// Defined once, so that the hook's dependencies are stable across renders.
const attributes = { overlayMenu: 'mobile', ref: 12 };

/**
 * Collapses the menu at the tablet breakpoint for German.
 *
 * @param value Viewport map, or `null` for the default behavior.
 * @return Filtered viewport map.
 */
function collapseGermanAtTablet( value: unknown ) {
	return select( languageStore ).getLanguage() === 'de' ? TABLET : value;
}

describe( 'useFilteredOverlayViewports', () => {
	afterEach( () => {
		removeAllFilters( HOOK );
		act( () => {
			dispatch( languageStore ).setLanguage( 'en' );
		} );
	} );

	it( 'updates when a store read by the filter changes', () => {
		addFilter( HOOK, 'test/overlay-viewports', collapseGermanAtTablet );
		const { result } = renderHook( () =>
			useFilteredOverlayViewports( attributes, 'client-1' )
		);
		expect( result.current ).toBeNull();

		act( () => {
			dispatch( languageStore ).setLanguage( 'de' );
		} );

		expect( result.current ).toEqual( TABLET );
	} );

	it( 'keeps the same map while its values are unchanged', () => {
		addFilter( HOOK, 'test/overlay-viewports', () => ( { ...TABLET } ) );
		const { result, rerender } = renderHook( () =>
			useFilteredOverlayViewports( attributes, 'client-1' )
		);
		const first = result.current;

		rerender();
		act( () => {
			dispatch( languageStore ).setLanguage( 'de' );
		} );

		expect( result.current ).toEqual( TABLET );
		expect( result.current ).toBe( first );
	} );

	it( 'skips the filter inside an overlay template part', () => {
		const callback = vi.fn( () => TABLET );
		addFilter( HOOK, 'test/overlay-viewports', callback );
		const { result } = renderHook( () =>
			useFilteredOverlayViewports( attributes, 'client-1', {
				isWithinOverlay: true,
			} )
		);

		expect( result.current ).toEqual( {
			mobile: false,
			tablet: false,
			desktop: false,
		} );
		expect( callback ).not.toHaveBeenCalled();
	} );

	it( 'skips the filter inside an overlay preview', () => {
		const callback = vi.fn( () => TABLET );
		addFilter( HOOK, 'test/overlay-viewports', callback );
		const { result } = renderHook(
			() => useFilteredOverlayViewports( attributes, 'client-1' ),
			{
				wrapper: ( { children }: { children: ReactNode } ) => (
					<OverlayPreviewContext.Provider value>
						{ children }
					</OverlayPreviewContext.Provider>
				),
			}
		);

		expect( result.current ).toEqual( {
			mobile: false,
			tablet: false,
			desktop: false,
		} );
		expect( callback ).not.toHaveBeenCalled();
	} );
} );
