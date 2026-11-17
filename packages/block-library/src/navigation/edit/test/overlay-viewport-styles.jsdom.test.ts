import { beforeEach, describe, expect, it, vi, type Mock } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSettings, useStyleOverride } from '@wordpress/block-editor';
import useOverlayViewportStyles from '../use-overlay-viewport-styles';
import type { OverlayViewportMap } from '../../overlay-viewports';
import type { unlock } from '../../../lock-unlock';

const mockGetResponsiveMediaQueries = vi.fn();

vi.mock( import( '@wordpress/block-editor' ), () => ( {
	useSettings: vi.fn(),
	useStyleOverride: vi.fn(),
} ) );

vi.mock( import( '@wordpress/global-styles-engine' ), () => ( {
	privateApis: {},
} ) );

vi.mock( import( '../../../lock-unlock' ), () => ( {
	unlock: ( () => ( {
		getResponsiveMediaQueries: ( ...args: unknown[] ) =>
			mockGetResponsiveMediaQueries( ...args ),
	} ) ) as typeof unlock,
} ) );

const VIEWPORT_SETTINGS = { mobile: 480, tablet: 782 };

const MEDIA_QUERIES = {
	'@mobile': '@media (width <= 480px)',
	'@tablet': '@media (480px < width <= 782px)',
	'@desktop': '@media (width > 782px)',
};

/**
 * Returns the rules expected inside a viewport's media query, written out in
 * full so that drift from the PHP renderer is caught.
 *
 * @param base The selector of the Navigation wrapper.
 * @return The expected rules.
 */
function getExpectedRules( base: string ) {
	const container = `${ base } .wp-block-navigation__responsive-container`;
	const inline = `${ container }:not(.hidden-by-default):not(.is-menu-open)`;
	return (
		`${ inline } {display: block;width: 100%;position: relative;z-index: auto;background-color: inherit;}` +
		`${ inline } .wp-block-navigation__responsive-container-close {display: none;}` +
		`${ container }.is-menu-open .wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container.wp-block-navigation__submenu-container {left: 0;}` +
		`${ base } .wp-block-navigation__responsive-container-open:not(.always-shown) {display: none;}`
	);
}

function renderOverlayViewportStyles(
	overlayViewports: OverlayViewportMap | null
) {
	renderHook( () =>
		useOverlayViewportStyles( { clientId: 'test', overlayViewports } )
	);
	return ( useStyleOverride as Mock ).mock.calls.at( -1 )?.[ 0 ];
}

describe( 'useOverlayViewportStyles', () => {
	beforeEach( () => {
		vi.clearAllMocks();
		( useSettings as Mock ).mockReturnValue( [ VIEWPORT_SETTINGS ] );
		mockGetResponsiveMediaQueries.mockReturnValue( MEDIA_QUERIES );
	} );

	it( 'shows the links inline on desktop for the tablet overlay', () => {
		expect(
			renderOverlayViewportStyles( {
				mobile: true,
				tablet: true,
				desktop: false,
			} )
		).toEqual( {
			css: `@media (width > 782px){${ getExpectedRules(
				'#block-test'
			) }}`,
		} );
	} );

	it( 'asks for the desktop media query', () => {
		renderOverlayViewportStyles( {
			mobile: true,
			tablet: true,
			desktop: false,
		} );

		expect( mockGetResponsiveMediaQueries ).toHaveBeenCalledWith(
			VIEWPORT_SETTINGS,
			{ includeDesktop: true }
		);
	} );

	it.each< [ string, OverlayViewportMap | null ] >( [
		[ 'the default mobile overlay', null ],
		[
			'an overlay that is never shown',
			{ mobile: false, tablet: false, desktop: false },
		],
		[
			'an overlay that is always shown',
			{ mobile: true, tablet: true, desktop: true },
		],
	] )( 'does not emit styles for %s', ( _, overlayViewports ) => {
		expect( renderOverlayViewportStyles( overlayViewports ) ).toEqual( {
			css: '',
		} );
	} );

	it( 'only emits rules for the viewports where the links are inline', () => {
		const { css } = renderOverlayViewportStyles( {
			mobile: false,
			tablet: true,
			desktop: true,
		} );

		expect( css ).toBe(
			`@media (width <= 480px){${ getExpectedRules( '#block-test' ) }}`
		);
	} );

	it( 'skips viewports without a media query', () => {
		mockGetResponsiveMediaQueries.mockReturnValue( {
			'@mobile': MEDIA_QUERIES[ '@mobile' ],
			'@desktop': MEDIA_QUERIES[ '@desktop' ],
		} );

		const { css } = renderOverlayViewportStyles( {
			mobile: true,
			tablet: false,
			desktop: false,
		} );

		expect( css ).toBe(
			`@media (width > 782px){${ getExpectedRules( '#block-test' ) }}`
		);
	} );
} );
