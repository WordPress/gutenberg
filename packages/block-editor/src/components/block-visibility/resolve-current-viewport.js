/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';

/**
 * Resolves the effective viewport used for visibility checks.
 *
 * @param {string}  deviceType         Current preview device type.
 * @param {boolean} isLargerThanMobile Whether viewport is >= mobile breakpoint.
 * @param {boolean} isLargerThanTablet Whether viewport is >= tablet breakpoint.
 *
 * @return {string} Effective viewport key ('desktop'|'tablet'|'mobile').
 */
export function resolveCurrentViewport(
	deviceType,
	isLargerThanMobile,
	isLargerThanTablet
) {
	const normalizedDeviceType = deviceType?.toLowerCase();

	if ( normalizedDeviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.key ) {
		return BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	}

	if ( normalizedDeviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.key ) {
		return BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
	}

	// Desktop preview falls back to current window width breakpoints.
	if ( ! isLargerThanMobile ) {
		return BLOCK_VISIBILITY_VIEWPORTS.mobile.key;
	}

	if ( ! isLargerThanTablet ) {
		return BLOCK_VISIBILITY_VIEWPORTS.tablet.key;
	}

	return BLOCK_VISIBILITY_VIEWPORTS.desktop.key;
}
