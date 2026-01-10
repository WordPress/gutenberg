/**
 * WordPress dependencies
 */
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	tableColumnAfter as overlayIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';

/**
 * Helper function to retrieve the corresponding icon by area name or icon name.
 *
 * @param {string} areaOrIconName The area name (e.g., 'header', 'navigation-overlay') or icon name (e.g., 'menu').
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( areaOrIconName ) {
	// Handle area names first
	if ( 'header' === areaOrIconName ) {
		return headerIcon;
	} else if ( 'footer' === areaOrIconName ) {
		return footerIcon;
	} else if ( 'sidebar' === areaOrIconName ) {
		return sidebarIcon;
	} else if ( 'navigation-overlay' === areaOrIconName ) {
		// TODO: Replace with a proper overlay icon when available.
		// Using tableColumnAfter as a placeholder.
		return overlayIcon;
	}
	// Handle icon names for backwards compatibility
	if ( 'menu' === areaOrIconName ) {
		// TODO: Replace with a proper overlay icon when available.
		// Using tableColumnAfter as a placeholder.
		return overlayIcon;
	}
	return symbolFilledIcon;
}
