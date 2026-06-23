/*
 * Renders a server-defined widget's composition.
 *
 * Stub: surfaces the raw composition markup as text so a code-registered or
 * cpt widget is observably routed here. Step 09 replaces it with the
 * single-tree renderer that parses the composition and mounts each block as
 * its registered admin component.
 */
interface AdminBlockRendererProps {
	/* Raw block markup for the widget's composition. */
	content: string;

	/* Resolved instance attributes; consumed by the step 09 renderer. */
	attributes?: Record< string, unknown >;
}

export function AdminBlockRenderer( { content }: AdminBlockRendererProps ) {
	return <div>{ content }</div>;
}
