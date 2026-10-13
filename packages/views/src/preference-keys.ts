/**
 * Generates a unique preference key for a DataViews view.
 *
 * @param kind The entity kind (e.g., 'postType', 'root')
 * @param name The specific entity name (e.g., 'post', 'user', 'site')
 * @param slug The specific entity slug (e.g., 'category', 'post', 'all')
 * @return The preference key string
 */
export function generatePreferenceKey(
	kind: string,
	name: string,
	slug: string
): string {
	return `dataviews-${ kind }-${ name }-${ slug }`;
}
