/**
 * WordPress dependencies
 */
import {
	header as headerIcon,
	footer as footerIcon,
	sidebar as sidebarIcon,
	symbolFilled as symbolFilledIcon,
} from '@wordpress/icons';
/**
 * Helper function to retrieve the corresponding icon by name.
 *
 * @param {string} iconName The name of the icon.
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( iconName ) {
	if ( 'header' === iconName ) {
		return headerIcon;
	} else if ( 'footer' === iconName ) {
		return footerIcon;
	} else if ( 'sidebar' === iconName ) {
		return sidebarIcon;
	}
	return symbolFilledIcon;
}
