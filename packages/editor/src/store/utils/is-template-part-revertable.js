/**
 * Internal dependencies
 */
import { TEMPLATE_ORIGINS } from '../constants';

/**
 * Check if a template part is revertable to its original theme-provided template file.
 *
 * @param {Object} templatePart The template part entity to check.
 * @return {boolean} Whether the template part is revertable.
 */
export default function isTemplatePartRevertable( templatePart ) {
	if ( ! templatePart ) {
		return false;
	}

	return (
		templatePart.has_theme_file &&
		templatePart.source === TEMPLATE_ORIGINS.custom
	);
}
