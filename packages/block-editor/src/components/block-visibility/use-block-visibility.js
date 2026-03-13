/**
 * WordPress dependencies
 */
import { useMediaQuery } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';
import { useBlockVisibilityViewports } from './use-block-visibility-viewports';

/**
 * Returns information about the current block visibility state.
 *
 * @param {Object}         options                 Parameters to avoid extra store subscriptions.
 * @param {Object|boolean} options.blockVisibility Block visibility metadata.
 * @param {string}         options.deviceType      Current device type ('desktop', 'tablet', 'mobile').
 * @return {Object} Object with `isBlockCurrentlyHidden` (boolean) and `currentViewport` (string) properties.
 */
export default function useBlockVisibility( options = {} ) {
	const {
		blockVisibility = undefined,
		deviceType = BLOCK_VISIBILITY_VIEWPORTS.desktop.key,
	} = options;

	const viewports = useBlockVisibilityViewports();
	// @todo Consolidate default breakpoint values into a single source of truth
	// shared between constants.js, use-block-visibility.js, and lib/theme.json.
	// See https://github.com/WordPress/gutenberg/issues/75707.
	const mobileSize = viewports.mobile.size ?? '480px';
	const tabletSize = viewports.tablet.size ?? '782px';

	const isLargerThanMobile = useMediaQuery( `(min-width: ${ mobileSize })` );
	const isLargerThanTablet = useMediaQuery( `(min-width: ${ tabletSize })` );

	/*
	 * Priority:
	 * 1. Device type override (Mobile/Tablet) - uses device type to determine viewport
	 * 2. Actual window size (Desktop mode) - uses viewport detection
	 */
	let currentViewport;
	if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.key ) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	} else if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.key ) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
	} else if ( ! isLargerThanMobile ) {
		currentViewport = BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	} else if ( isLargerThanMobile && ! isLargerThanTablet ) {
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
