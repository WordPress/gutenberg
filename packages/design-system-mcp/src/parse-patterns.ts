import { posix } from 'node:path';
import type { ManifestComponent, ManifestDoc, Pattern } from './types.ts';

/**
 * Storybook docs ID prefix shared by every document under the "Design System/
 * Patterns" title, e.g. `design-system-patterns-destructive-actions--docs`.
 */
const PATTERN_ID_PREFIX = 'design-system-patterns-';

/**
 * Convert a story's export name to the story's part of its Storybook ID, as
 * Storybook does, e.g. `SaveFormLayoutCard` to `save-form-layout-card`.
 *
 * @param exportName - The story's export name.
 * @return The story's part of its ID.
 */
function storyIdFromExport( exportName: string ): string {
	return exportName
		.replace( /([a-z\d])([A-Z])/g, '$1-$2' )
		.replace( /([A-Z]+)([A-Z][a-z\d])/g, '$1-$2' )
		.toLowerCase();
}

/**
 * Replace each `<Canvas of={ Stories.Name } />` block with the code of the
 * story it shows, taken from the story's snippet in the components manifest.
 * A block stays as it is when its story has no snippet.
 *
 * @param content    - The document content.
 * @param source     - The full MDX source, which has the story file imports.
 * @param path       - The document's path in the manifest.
 * @param components - The components manifest entries.
 * @return The content with the examples expanded.
 */
function expandCanvases(
	content: string,
	source: string,
	path: string,
	components: Record< string, ManifestComponent >
): string {
	const files = new Map< string, string >();
	for ( const [ , name, file ] of source.matchAll(
		/^import \* as (\w+) from '(.+)';$/gm
	) ) {
		files.set( name, posix.join( posix.dirname( path ), file ) );
	}

	return content.replace(
		/^<Canvas of=\{ (\w+)\.(\w+) \} \/>$/gm,
		( canvas, name: string, exportName: string ) => {
			const file = files.get( name );
			const component = Object.values( components ).find(
				( entry ) =>
					posix.join( entry.path ).replace( /\.[jt]sx?$/, '' ) ===
					file
			);
			const id = `${ component?.id }--${ storyIdFromExport( exportName ) }`;
			const snippet = component?.stories?.find(
				( story ) => story.id === id
			)?.snippet;

			if ( ! snippet ) {
				return canvas;
			}

			const code = [ component?.import, snippet ]
				.filter( Boolean )
				.join( '\n\n' );
			return '```tsx\n' + code + '\n```';
		}
	);
}

/**
 * Parse a docs manifest entry into a pattern. The title is the last segment of
 * the Storybook title, as shown in the sidebar, and the description is the
 * document's lead paragraph (see the "Manifests" section of
 * `storybook/README.md`).
 *
 * @param doc        - The docs manifest entry.
 * @param components - The components manifest entries, for the examples.
 * @return The pattern, or null if the entry is not a pattern or has no heading.
 */
function parsePattern(
	doc: ManifestDoc,
	components: Record< string, ManifestComponent >
): Pattern | null {
	const [ componentId ] = doc.id.split( '--' );
	const source = doc.content ?? '';
	// The document starts at its heading. Anything before it, such as imports
	// and the `<Meta />` block, only sets up the Storybook page.
	const start = source.search( /^# /m );
	if ( ! componentId.startsWith( PATTERN_ID_PREFIX ) || start === -1 ) {
		return null;
	}

	const slug = componentId.slice( PATTERN_ID_PREFIX.length );
	const content = expandCanvases(
		source.slice( start ).trim(),
		source,
		doc.path ?? '',
		components
	);
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
 * @param docs       - The docs manifest entries, keyed by docs ID.
 * @param components - The components manifest entries, for the examples.
 * @return The patterns.
 */
export function parsePatterns(
	docs: Record< string, ManifestDoc >,
	components: Record< string, ManifestComponent > = {}
): Pattern[] {
	return Object.values( docs )
		.map( ( doc ) => parsePattern( doc, components ) )
		.filter( ( pattern ): pattern is Pattern => !! pattern );
}
