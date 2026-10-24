import { packageNameFromPath } from './parse-components.ts';
import type {
	GuidanceDoc,
	GuidanceSummary,
	ManifestComponent,
	ManifestDoc,
} from './types.ts';

/**
 * Convert the MDX source of a Storybook docs page to plain markdown an agent
 * can read. Storybook-only constructs (imports, `<Meta>`, `<Canvas>`,
 * `<Story>`) carry no information outside Storybook and are dropped, and
 * `<Markdown>{ `...` }</Markdown>` wrappers are unwrapped. Storybook links
 * (`?path=/docs/...`) are reduced to their text since they can't be followed.
 *
 * @param mdx - The MDX source.
 * @return Markdown.
 */
export function mdxToMarkdown( mdx: string ): string {
	return (
		mdx
			// Unwrap <Markdown>{ `...` }</Markdown>, unescaping the template
			// literal's backticks.
			.replace(
				/<Markdown>\s*\{\s*`([\s\S]*?)`\s*\}\s*<\/Markdown>/g,
				( _match, body: string ) => body.replace( /\\`/g, '`' )
			)
			.replace( /^import\s.+$/gm, '' )
			// Self-closing or paired Storybook blocks, possibly multi-line.
			.replace( /<(Meta|Canvas|Story|Controls|ArgTypes)\b[^>]*\/>/g, '' )
			.replace( /<(Canvas|Source|Unstyled)\b[^>]*>[\s\S]*?<\/\1>/g, '' )
			// Links that only resolve inside Storybook.
			.replace( /\[([^\]]+)\]\(\?path=[^)]*\)/g, '$1' )
			.replace( /\n{3,}/g, '\n\n' )
			.trim()
	);
}

function docTitle( doc: ManifestDoc ): string {
	if ( doc.title ) {
		return doc.title;
	}
	const heading = doc.content?.match( /^#\s+(.+)$/m );
	return heading ? heading[ 1 ].trim() : doc.name;
}

function usableDocs(
	components: Record< string, ManifestComponent >,
	standalone: Record< string, ManifestDoc >
): Map< string, GuidanceDoc > {
	const byId = new Map< string, GuidanceDoc >();

	const add = ( doc: ManifestDoc, componentName?: string ) => {
		if ( doc.error || ! doc.content ) {
			return;
		}
		const existing = byId.get( doc.id );
		if ( existing ) {
			if (
				componentName &&
				! existing.components.includes( componentName )
			) {
				existing.components.push( componentName );
			}
			return;
		}
		byId.set( doc.id, {
			id: doc.id,
			title: docTitle( doc ),
			summary: doc.summary || '',
			components: componentName ? [ componentName ] : [],
			content: mdxToMarkdown( doc.content ),
		} );
	};

	for ( const component of Object.values( components ) ) {
		if ( ! packageNameFromPath( component.path ) ) {
			continue;
		}
		const name = component.name.split( '.', 1 )[ 0 ];
		for ( const doc of Object.values( component.docs ?? {} ) ) {
			add( doc, name );
		}
	}
	for ( const doc of Object.values( standalone ) ) {
		add( doc );
	}

	return byId;
}

/**
 * List the guidance pages (usage guidelines, best practices, migration
 * guides, etc.) available from the manifests, sorted by title.
 *
 * @param components - The manifest components record, with attached docs.
 * @param standalone - The standalone docs manifest record.
 * @return Guidance summaries.
 */
export function parseGuidanceList(
	components: Record< string, ManifestComponent >,
	standalone: Record< string, ManifestDoc > = {}
): GuidanceSummary[] {
	return Array.from( usableDocs( components, standalone ).values() )
		.map( ( { id, title, summary, components: names } ) => ( {
			id,
			title,
			summary,
			components: names,
		} ) )
		.sort( ( a, b ) => a.title.localeCompare( b.title ) );
}

/**
 * Find guidance pages by id, title, or attached component name
 * (case-insensitive).
 *
 * @param components - The manifest components record, with attached docs.
 * @param standalone - The standalone docs manifest record.
 * @param topic      - A page id or title, or a component name.
 * @return Matching pages, in listing order.
 */
export function parseGuidanceDocs(
	components: Record< string, ManifestComponent >,
	standalone: Record< string, ManifestDoc >,
	topic: string
): GuidanceDoc[] {
	const needle = topic.toLowerCase();
	const all = Array.from( usableDocs( components, standalone ).values() );

	const exact = all.filter(
		( doc ) =>
			doc.id.toLowerCase() === needle ||
			doc.title.toLowerCase() === needle
	);
	if ( exact.length > 0 ) {
		return exact;
	}
	return all.filter( ( doc ) =>
		doc.components.some( ( name ) => name.toLowerCase() === needle )
	);
}
