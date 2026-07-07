/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';

/**
 * Internal dependencies
 */
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';
import { resolveCurrentViewport } from './resolve-current-viewport';

/**
 * Returns information about the current block visibility state.
 *
 * @param {Object}         options                 Parameters to avoid extra store subscriptions.
 * @param {Object|boolean} options.blockVisibility Block visibility metadata.
 * @param {string}         options.deviceType      Current device type ('desktop', 'tablet', 'mobile').
 * @param {Window?}        options.view            Window instance in which to perform viewport matching
 * @return {Object} Object with `isBlockCurrentlyHidden` (boolean) and `currentViewport` (string) properties.
 */
export default function useBlockVisibility( options = {} ) {
	const {
		blockVisibility = undefined,
		deviceType = BLOCK_VISIBILITY_VIEWPORTS.desktop.key,
		view = window,
	} = options;

	const isLargerThanMobile = useViewportMatch( 'mobile', '>=', view ); // >= 480px
	const isLargerThanTablet = useViewportMatch( 'medium', '>=', view ); // >= 782px

	const currentViewport = resolveCurrentViewport(
		deviceType,
		isLargerThanMobile,
		isLargerThanTablet
	);

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden =
		blockVisibility === false ||
		blockVisibility?.viewport?.[ currentViewport ] === false;

	return { isBlockCurrentlyHidden, currentViewport };
}
