/**
 * WordPress dependencies
 */
import { useViewportMatch } from '@wordpress/compose';
import { useSelect } from '@wordpress/data';
import { useMemo } from '@wordpress/element';

/**
 * Internal dependencies
 */
import { store as blockEditorStore } from '../../store';
import { deviceTypeKey } from '../../store/private-keys';
import { BLOCK_VISIBILITY_VIEWPORTS } from './constants';

/**
 * Determines if a block should be hidden based on visibility settings.
 *
 * Priority:
 * 1. Device type override (Mobile/Tablet) - uses device type to determine viewport
 * 2. Actual window size (Desktop mode) - uses viewport detection
 *
 * @param {string} clientId Block client ID.
 * @return {Object} Object with `isBlockCurrentlyHidden` boolean property.
 */
export function useBlockVisibility( clientId ) {
	// Get visibility settings from block attributes and device type from settings
	const { blockVisibility, deviceType } = useSelect(
		( select ) => {
			const block = select( blockEditorStore ).getBlock( clientId );
			const metadata = block?.attributes?.metadata;
			const settings = select( blockEditorStore ).getSettings();
			return {
				blockVisibility: metadata?.blockVisibility,
				deviceType:
					settings?.[ deviceTypeKey ]?.toLowerCase() || 'desktop',
			};
		},
		[ clientId ]
	);

	// When Desktop is selected, use actual viewport detection
	// When Mobile/Tablet is selected, override with device type
	// All hooks must be called unconditionally
	const isLargerThanMobile = useViewportMatch( 'mobile', '>=' ); // >= 480px
	const isLargerThanTablet = useViewportMatch( 'medium', '>=' ); // >= 782px

	// Determine current viewport based on deviceType and/or viewport detection.
	const currentViewport = useMemo( () => {
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.mobile.value ) {
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.value;
		}
		if ( deviceType === BLOCK_VISIBILITY_VIEWPORTS.tablet.value ) {
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.value;
		}
		if ( ! isLargerThanMobile ) {
			// Desktop: use actual viewport detection
			// Mobile: viewport < 480px (matches block-visibility.php: max-width: 479px)
			return BLOCK_VISIBILITY_VIEWPORTS.mobile.value;
		}
		if ( isLargerThanMobile && ! isLargerThanTablet ) {
			// Tablet: viewport >= 480px and < 782px (matches block-visibility.php: 480px-781px)
			return BLOCK_VISIBILITY_VIEWPORTS.tablet.value;
		}
		// Desktop: viewport >= 782px (matches block-visibility.php: min-width: 782px)
		return BLOCK_VISIBILITY_VIEWPORTS.desktop.value;
	}, [ deviceType, isLargerThanMobile, isLargerThanTablet ] );

	// Determine if block is currently hidden.
	const isBlockCurrentlyHidden = useMemo( () => {
		// Hidden everywhere takes precedence.
		if ( blockVisibility === false ) {
			return true;
		}

		// Check if hidden on current viewport (false means hidden). Only apply when the experimental flag is enabled.
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
