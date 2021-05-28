/**
 * Generates a template part Id based on slug and theme inputs.
 *
 * @param {string} theme the template part's theme.
 * @param {string} slug the template part's slug
 * @return {string|null} the template part's Id.
 */
export function createTemplatePartId( theme, slug ) {
	return theme && slug ? theme + '//' + slug : null;
}
