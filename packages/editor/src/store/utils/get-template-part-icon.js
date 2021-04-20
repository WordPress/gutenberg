/**
 * WordPress dependencies
 */
const icons = require( '@wordpress/icons' );
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
