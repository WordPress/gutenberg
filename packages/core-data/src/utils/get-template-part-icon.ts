import type { ReactElement } from 'react';
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	navigationOverlay as navigationOverlayIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';

/**
 * Helper function to retrieve the corresponding icon by area name.
 *
 * @param areaOrIconName The area name (e.g., 'header', 'navigation-overlay').
 *
 * @return The corresponding icon.
 */
export function getTemplatePartIcon(
	areaOrIconName: string | undefined
): ReactElement {
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
