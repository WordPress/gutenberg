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

// This mirrors `@wordpress/editor`'s util of the same name. It is duplicated
// here (rather than shared) to keep this package free of any dependency on the
// `editor` package.

/**
 * Helper function to retrieve the corresponding icon by area name.
 *
 * @param {string} areaOrIconName The area name (e.g., 'header', 'navigation-overlay').
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( areaOrIconName ) {
	if ( 'header' === areaOrIconName ) {
		return headerIcon;
	} else if ( 'footer' === areaOrIconName ) {
		return footerIcon;
	} else if ( 'sidebar' === areaOrIconName ) {
		return sidebarIcon;
	} else if ( 'navigation-overlay' === areaOrIconName ) {
		return navigationOverlayIcon;
	}
	return symbolFilledIcon;
}
