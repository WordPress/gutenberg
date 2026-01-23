/**
 * Internal dependencies
 */
import { TEMPLATE_ORIGINS } from './constants';

/**
 * Check if a template is removable.
 *
 * @param {Object} template The template entity to check.
 * @return {boolean} Whether the template is removable.
 */
export default function isTemplateRemovable( template ) {
	if ( ! template ) {
		return false;
	}

	return (
		template.source === TEMPLATE_ORIGINS.custom &&
		! Boolean( template.plugin ) &&
		! template.has_theme_file
	);
}
