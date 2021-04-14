/**
 * WordPress dependencies
 */
const icons = require( '@wordpress/icons' );
/**
 * Helper function to find the corresponding icon for a template part's 'area'.
 *
 * @param {string} iconName The value of the template part 'area' tax term.
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIcon( iconName ) {
	return icons[ iconName ] || icons.layout;
}
