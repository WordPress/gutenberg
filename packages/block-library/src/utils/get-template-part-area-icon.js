import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	navigationOverlay as navigationOverlayIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';

/**
 * Returns the icon of a template part area.
 *
 * @param {string} areaOrIconName The area name (e.g., 'header', 'navigation-overlay').
 *
 * @return {Object} The corresponding icon.
 */
export const getTemplatePartAreaIcon = ( areaOrIconName ) => {
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
};
