/**
 * Generates a template part Id based on slug and theme inputs.
 *
 * @param {string} slug the template part's slug
 * @param {string} theme the template part's theme.
 * @return {string|null} the template part's Id.
 */
export function createTemplatePartId( slug, theme ) {
	return theme && slug ? theme + '//' + slug : null;
}
