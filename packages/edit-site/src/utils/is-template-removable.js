/**
 * Check if a template is removable.
 *
 * @param {Object} template The template entity to check.
 * @return {boolean} Whether the template is revertable.
 */
export default function isTemplateRemovable( template ) {
	if ( ! template ) {
		return false;
	}

	return template.source === 'custom' && ! template.has_theme_file;
}
