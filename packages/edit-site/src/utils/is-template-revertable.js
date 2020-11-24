/**
 * Check if a template is revertable to its original theme-provided template file.
 *
 * @param {Object} template The template entity to check.
 * @param {string} currentTheme The current theme slug (stylesheet).
 * @return {boolean} Whether the template is revertable.
 */
export default function isTemplateRevertable( template, currentTheme ) {
	if ( ! template || ! currentTheme ) {
		return false;
	}
	return (
		'auto-draft' !== template.status &&
		/* eslint-disable camelcase */
		template?.file_based &&
		template?.original_file_exists &&
		currentTheme === template?.wp_theme_slug
		/* eslint-enable camelcase */
	);
}
