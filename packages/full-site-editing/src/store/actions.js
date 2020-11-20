/**
 * Returns an action object used to update the default template types.
 *
 * @param {Array} defaultTemplateTypes New default template types.
 *
 * @return {Object} Action object.
 */
export function updateDefaultTemplateTypes( defaultTemplateTypes ) {
	return {
		type: 'UPDATE_DEFAULT_TEMPLATE_TYPES',
		defaultTemplateTypes,
	};
}
