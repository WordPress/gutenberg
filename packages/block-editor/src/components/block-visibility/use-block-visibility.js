/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';
import { privateApis as globalStylesEnginePrivateApis } from '@wordpress/global-styles-engine';

/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';
import { unlock } from '../../lock-unlock';

const { getViewportBreakpoints } = unlock( globalStylesEnginePrivateApis );

/**
 * Returns information about the current block visibility state.
 *
 * @param {Object}         options                  Parameters to avoid extra store subscriptions.
 * @param {Object|boolean} options.blockVisibility  Block visibility metadata.
 * @param {string}         options.deviceType       Current device type ('desktop', 'tablet', 'mobile').
 * @param {Object}         options.viewportSettings Viewport breakpoint settings.
 * @param {Window?}        options.view             Window instance in which to perform viewport matching
 * @return {Object} Object with `isBlockCurrentlyHidden` (boolean) and `currentViewport` (string) properties.
 */
export default function useBlockVisibility( options = {} ) {
	const {
		blockVisibility = undefined,
		deviceType = BLOCK_VISIBILITY_VIEWPORTS.desktop.key,
		viewportSettings,
		view = window,
	} = options;

	const viewportBreakpoints = getViewportBreakpoints( viewportSettings );
	const mobileMediaQuery = viewportBreakpoints.mobile
		? `(width <= ${ viewportBreakpoints.mobile })`
		: undefined;
	const isMobileViewport = useMediaQuery( mobileMediaQuery, view );
	let tabletMediaQuery;
	if ( viewportBreakpoints.tablet ) {
		tabletMediaQuery = viewportBreakpoints.mobile
			? `(${ viewportBreakpoints.mobile } < width <= ${ viewportBreakpoints.tablet })`
			: `(width <= ${ viewportBreakpoints.tablet })`;
	}
	const isTabletViewport = useMediaQuery( tabletMediaQuery, view );

	/*
	 * Priority:
	 * 1. Device type override (Mobile/Tablet) - uses device type to determine viewport
	 * 2. Actual window size (Desktop mode) - uses viewport detection
	 */
	let currentViewport;
	if (
		deviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.key &&
		viewportBreakpoints.mobile
	) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	} else if (
		deviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.key &&
		viewportBreakpoints.tablet
	) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
	} else if ( isMobileViewport ) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	} else if ( isTabletViewport && viewportBreakpoints.tablet ) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
	} else {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.desktop.key;
	}

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden =
		blockVisibility === false ||
		blockVisibility?.viewport?.[ currentViewport ] === false;

	return { isBlockCurrentlyHidden, currentViewport };
}
