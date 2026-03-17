/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';

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

	const isLargerThanMobile = useViewportMatch( 'mobile', '>=' ); // >= 480px
	const isLargerThanTablet = useViewportMatch( 'medium', '>=' ); // >= 782px

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
