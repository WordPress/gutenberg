/**
 * WordPress dependencies
 */
import * as icons from '@wordpress/icons';
/**
 * Helper function to retrieve the corresponding icon by name.
 *
 * @param {string} iconName The name of the icon.
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( iconName ) {
	return icons[ iconName ] || icons.layout;
}
