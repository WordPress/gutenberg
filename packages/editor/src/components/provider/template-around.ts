/**
 * The properties of a post or a template the helpers read.
 */
type Entity = { id: number | string; type?: string };

/**
 * Post types that are rendered on their own unless the caller names a template
 * to render around them: no template applies to them the way one applies to a
 * page or a post.
 */
const POST_TYPES_RENDERED_ON_THEIR_OWN = [
	'wp_template',
	'wp_template_part',
	'wp_block',
	'wp_navigation',
];

/**
 * Returns the template the canvas renders around a post.
 *
 * A caller editing a template can name that template as its template too, as
 * the extensible site editor does. There is nothing to render around the
 * template then.
 *
 * @param post     The post being edited.
 * @param template The template the caller names for it.
 * @return The template to render around the post, or `undefined` when there is none.
 */
export function getTemplateAround< Template extends Entity >(
	post: Entity,
	template?: Template | null
): Template | undefined {
	if ( ! template || template.id === post.id ) {
		return undefined;
	}

	return template;
}

/**
 * Returns whether a post is rendered on its own, with no template around it
 * now or to come.
 *
 * A page or a post whose template has not loaded yet has no template around it
 * for now, but one is coming. A template, a template part, a pattern or a
 * navigation menu has none unless the caller names one, so its only rendering
 * mode is `post-only`.
 *
 * @param post     The post being edited.
 * @param template The template the caller names for it.
 * @return Whether the post is rendered on its own.
 */
export function isRenderedOnItsOwn(
	post: Entity,
	template?: Entity | null
): boolean {
	return (
		POST_TYPES_RENDERED_ON_THEIR_OWN.includes( post.type ?? '' ) &&
		! getTemplateAround( post, template )
	);
}
