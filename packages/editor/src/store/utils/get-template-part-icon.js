/**
 * WordPress dependencies
 */
import { layout, header, footer } from '@wordpress/icons';

/**
 * Helper function to find the corresponding icon for a template part's 'area'.
 *
 * @param {string} area The value of the template part 'area' tax term.
 *
 * @return {Object} The corresponding icon.
 */
export function getTemplatePartIconByArea( area ) {
	const iconsByArea = {
		footer,
		header,
	};
	return iconsByArea[ area ] || layout;
}
