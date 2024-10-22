/**
 * Internal dependencies
 */
import { TEMPLATE_ORIGINS } from '../constants';

// Copy of the function from packages/edit-site/src/utils/is-template-revertable.js

/**
 * Check if a template or template part is revertable to its original theme-provided file.
 *
 * @param {Object} templateOrTemplatePart The entity to check.
 * @return {boolean} Whether the entity is revertable.
 */
export default function isTemplateRevertable( templateOrTemplatePart ) {
	if ( ! templateOrTemplatePart ) {
		return false;
	}

	return (
		templateOrTemplatePart.source === TEMPLATE_ORIGINS.custom &&
		( Boolean( templateOrTemplatePart?.plugin ) ||
			templateOrTemplatePart?.has_theme_file )
	);
}
