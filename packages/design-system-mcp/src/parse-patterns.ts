import type { ManifestDoc, Pattern } from './types.ts';

/**
 * Storybook docs ID prefix shared by every document under the "Design System/
 * Patterns" title, e.g. `design-system-patterns-destructive-actions--docs`.
 */
const PATTERN_ID_PREFIX = 'design-system-patterns-';

/**
 * Parse a docs manifest entry into a pattern. The title is the last segment of
 * the Storybook title, as shown in the sidebar, and the description is the
 * document's lead paragraph (see the "Manifests" section of
 * `storybook/README.md`).
 *
 * @param doc - The docs manifest entry.
 * @return The pattern, or null if the entry is not a pattern or has no heading.
 */
function parsePattern( doc: ManifestDoc ): Pattern | null {
	const [ componentId ] = doc.id.split( '--' );
	const source = doc.content ?? '';
	// The document starts at its heading. Anything before it, such as imports
	// and the `<Meta />` block, only sets up the Storybook page.
	const start = source.search( /^# /m );
	if ( ! componentId.startsWith( PATTERN_ID_PREFIX ) || start === -1 ) {
		return null;
	}

	const slug = componentId.slice( PATTERN_ID_PREFIX.length );
	const content = source.slice( start ).trim();
	const title = doc.title?.split( '/' ).pop() ?? slug;
	const [ , description = '' ] = content.split( /\n{2,}/ );

	return {
		slug,
		title,
		description: description.replace( /\s*\n\s*/g, ' ' ),
		content,
	};
}

/**
 * Parse the design system patterns from the entries of a Storybook docs
 * manifest.
 *
 * @param docs - The manifest entries, keyed by docs ID.
 * @return The patterns.
 */
export function parsePatterns(
	docs: Record< string, ManifestDoc >
): Pattern[] {
	return Object.values( docs )
		.map( parsePattern )
		.filter( ( pattern ): pattern is Pattern => !! pattern );
}
