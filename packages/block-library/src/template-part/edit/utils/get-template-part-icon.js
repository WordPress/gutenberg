/**
 * WordPress dependencies
 */
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	navigationOverlay as navigationOverlayIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';

/**
 * Helper function to retrieve the corresponding icon by area name or icon name.
 *
 * @param {string} areaOrIconName The area name (e.g., 'header', 'navigation-overlay') or icon name (e.g., 'menu').
 *
 * @return {Object} The corresponding icon.
 */
export const getTemplatePartIcon = ( areaOrIconName ) => {
	// Handle area names first
	if ( 'header' === areaOrIconName ) {
		return headerIcon;
	} else if ( 'footer' === areaOrIconName ) {
		return footerIcon;
	} else if ( 'sidebar' === areaOrIconName ) {
		return sidebarIcon;
	} else if (
		'overlay' === areaOrIconName || // Backwards compat: remove once Core PR is merged and packages sync (see #75249).
		'navigation-overlay' === areaOrIconName
	) {
		return navigationOverlayIcon;
	}
	// Handle icon names for backwards compatibility.
	if ( 'menu' === areaOrIconName ) {
		return navigationOverlayIcon;
	}
	return symbolFilledIcon;
};
