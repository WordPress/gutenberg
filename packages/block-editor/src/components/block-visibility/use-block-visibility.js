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
 * Determines if a block should be hidden based on visibility settings.
 *
 * Priority:
 * 1. Device type override (Mobile/Tablet) - uses device type to determine viewport
 * 2. Actual window size (Desktop mode) - uses viewport detection
 *
 * @param {Object}         options                 Parameters to avoid extra store subscriptions.
 * @param {Object|boolean} options.blockVisibility Block visibility metadata.
 * @param {string}         options.deviceType      Current device type ('desktop', 'tablet', 'mobile').
 * @return {Object} Object with `isBlockCurrentlyHidden` boolean property.
 */
export function useBlockVisibility( options = {} ) {
	const {
		blockVisibility = undefined,
		deviceType = BLOCK_VISIBILITY_VIEWPORTS.desktop.value,
	} = options;

	const isLargerThanMobile = useViewportMatch( 'mobile', '>=' ); // >= 480px
	const isLargerThanTablet = useViewportMatch( 'medium', '>=' ); // >= 782px

	/*
	 * When Desktop is selected, use actual viewport detection.
	 * When Mobile/Tablet is selected, override with device type.
	 */
	const currentViewport = useMemo( () => {
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.value ) {
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.value;
		}
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.value ) {
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.value;
		}
		if ( ! isLargerThanMobile ) {
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.value;
		}
		if ( isLargerThanMobile && ! isLargerThanTablet ) {
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.value;
		}
		return BLOCK_VISIBILITY_VIEWPORTS.desktop.value;
	}, [ deviceType, isLargerThanMobile, isLargerThanTablet ] );

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden = useMemo( () => {
		if ( blockVisibility === false ) {
			return true;
		}

		if (
			window.__experimentalHideBlocksBasedOnScreenSize &&
			blockVisibility?.[ currentViewport ] === false
		) {
			return true;
		}

		return false;
	}, [ blockVisibility, currentViewport ] );

	return useMemo(
		() => ( { isBlockCurrentlyHidden, currentViewport } ),
		[ isBlockCurrentlyHidden, currentViewport ]
	);
}
