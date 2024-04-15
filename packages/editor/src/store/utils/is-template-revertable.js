/**
 * Internal dependencies
 */
import {
	TEMPLATE_ORIGINS,
	TEMPLATE_POST_TYPE,
	TEMPLATE_PART_POST_TYPE,
} from '../constants';

// Copy of the function from packages/edit-site/src/utils/is-template-revertable.js

/**
 * Check if a template is revertable to its original theme-provided template file.
 *
 * @param {Object} template The template entity to check.
 * @return {boolean} Whether the template is revertable.
 */
export default function isTemplateRevertable( template ) {
	if (
		! template ||
		( template.type !== TEMPLATE_POST_TYPE &&
			template.type !== TEMPLATE_PART_POST_TYPE )
	) {
		return false;
	}
	/* eslint-disable camelcase */
	return (
		template?.source === TEMPLATE_ORIGINS.custom && template?.has_theme_file
	);
	/* eslint-enable camelcase */
}
