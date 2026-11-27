/**
 * Generates a template part Id based on slug and theme inputs.
 *
 * @param theme the template part's theme.
 * @param slug  the template part's slug
 * @return the template part's Id.
 */
export function createTemplatePartId(
	theme?: string,
	slug?: string
): string | null {
	return theme && slug ? theme + '//' + slug : null;
}
