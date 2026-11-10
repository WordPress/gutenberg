/**
 * The properties of a post or a template the helpers read.
 */
type Entity = { id: number | string };

/**
 * Returns the template the canvas renders around a post.
 *
 * A host editing a template names that template as its template too, so that
 * the canvas stands for it: the extensible site editor always has, and the
 * site editor does for a template that names no other template to render
 * inside. There is nothing to render around a template then, unlike one that
 * names another, or a page.
 *
 * @param post     The post being edited.
 * @param template The template the host names for it.
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
 * Returns the rendering mode the editor starts in.
 *
 * A template standing for itself starts in the `post-only` mode, so that it is
 * edited on its own whatever mode its post type or a preference names: there
 * is no other template to show around it.
 *
 * @param options                        Options.
 * @param options.renderingMode          The mode the host asks for, if any.
 * @param options.standsForOwnTemplate   Whether the post is the template the host names for it.
 * @param options.getPostTypeDefaultMode Returns the default mode of the post type, or `undefined` while it resolves. Only called when neither of the above settles the mode.
 * @return The mode, or `undefined` while it resolves.
 */
export function getStartingRenderingMode( {
	renderingMode,
	standsForOwnTemplate,
	getPostTypeDefaultMode,
}: {
	renderingMode?: string;
	standsForOwnTemplate: boolean;
	getPostTypeDefaultMode: () => string | undefined;
} ): string | undefined {
	if ( renderingMode ) {
		return renderingMode;
	}

	if ( standsForOwnTemplate ) {
		return 'post-only';
	}

	return getPostTypeDefaultMode();
}
