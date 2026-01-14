/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useMemo } from '@wordpress/element';

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
 * @return {Object} Object with `isBlockCurrentlyHidden` and `currentViewport` boolean properties.
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
	const currentViewport = useMemo( () => {
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.key ) {
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
		}
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.key ) {
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
		}
		if ( ! isLargerThanMobile ) {
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
		}
		if ( isLargerThanMobile && ! isLargerThanTablet ) {
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
		}
		return BLOCK_VISIBILITY_VIEWPORTS.desktop.key;
	}, [ deviceType, isLargerThanMobile, isLargerThanTablet ] );

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden = useMemo( () => {
		if ( blockVisibility === false ) {
			return true;
		}

		if (
			window.__experimentalHideBlocksBasedOnScreenSize &&
			blockVisibility?.viewport?.[ currentViewport ] === false
		) {
			return true;
		}

		return false;
	}, [ blockVisibility, currentViewport ] );

	return {
		isBlockCurrentlyHidden,
		currentViewport,
	};
}
