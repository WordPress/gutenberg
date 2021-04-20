/**
 * WordPress dependencies
 */
const icons = require( '@wordpress/icons' );
/**
 * Helper function to find the corresponding icon for a template part's 'area'.
 *
 * @param {string} iconName The name of the icon.
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( iconName ) {
	return icons[ iconName ] || icons.layout;
}
