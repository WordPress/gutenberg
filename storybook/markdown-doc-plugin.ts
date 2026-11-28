import { readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import type { Plugin } from 'vite';

const QUERY = '?doc';

const REPOSITORY_ROOT = path.resolve( import.meta.dirname, '..' );
const GITHUB_URL = 'https://github.com/WordPress/gutenberg';
const STORYBOOK_URL = 'https://wordpress.github.io/gutenberg/';

const ASSET_EXTENSIONS = /\.(?:svg|png|jpe?g|gif|webp|avif)$/i;

/*
 * Link and image destinations, in Markdown (`](target)`) and in HTML
 * (`src="target"` or `href="target"`). Titles after the target are left alone.
 */
const DESTINATION = /(\]\()(<[^>]+>|[^)\s]+)|(\s(?:src|href)=")([^"]+)(")/g;

/*
 * Lines that open or close a fenced code block. Destinations inside fences are
 * example code, not links, and stay as they are.
 */
const FENCE = /^ {0,3}(`{3,}|~{3,})/;

type Part = { text: string } | { asset: string };

/**
 * Splits a Markdown document into fenced code blocks and the prose around
 * them, so that only the prose is rewritten.
 *
 * @param markdown The Markdown document.
 * @return Segments in document order, each flagged as code or prose.
 */
function splitFences( markdown: string ) {
	const segments: Array< { code: boolean; text: string } > = [];
	let fence: string | null = null;
	let text = '';

	for ( const line of markdown.split( /(?<=\n)/ ) ) {
		const match = line.match( FENCE );
		const opens = ! fence && match;
		const closes = fence && match && match[ 1 ].startsWith( fence );

		if ( opens ) {
			segments.push( { code: false, text } );
			text = '';
			fence = match[ 1 ];
		}

		text += line;

		if ( closes ) {
			segments.push( { code: true, text } );
			text = '';
			fence = null;
		}
	}

	segments.push( { code: fence !== null, text } );

	return segments;
}

/**
 * Rewrites one link or image destination of a document for Storybook.
 *
 * @param target   The destination as written in the document.
 * @param fromFile Absolute path of the document.
 * @return The new destination, or an asset to import in its place.
 */
function rewriteDestination( target: string, fromFile: string ): Part {
	// Storybook links in the published Storybook stay in the current one.
	if ( target.startsWith( `${ STORYBOOK_URL }?path=` ) ) {
		return { text: target.slice( STORYBOOK_URL.length ) };
	}

	// Leave URLs, protocol links, same-page anchors and queries untouched.
	if ( /^(?:[a-z][a-z\d+.-]*:|\/\/|#|\?)/i.test( target ) ) {
		return { text: target };
	}

	const [ filePath, hash = '' ] = target.split( /(?=#)/ );
	// GitHub resolves a leading slash from the repository root.
	const absolutePath = filePath.startsWith( '/' )
		? path.join( REPOSITORY_ROOT, filePath )
		: path.resolve( path.dirname( fromFile ), filePath );

	// Bundle images and diagrams, so Storybook serves them from its own build.
	if ( ASSET_EXTENSIONS.test( filePath ) ) {
		return { asset: absolutePath };
	}

	// Other repository files open on GitHub, where Storybook has no page.
	const repositoryPath = path.relative( REPOSITORY_ROOT, absolutePath );

	if ( repositoryPath.startsWith( '..' ) ) {
		return { text: target };
	}

	let kind = 'blob';

	try {
		kind = statSync( absolutePath ).isDirectory() ? 'tree' : 'blob';
	} catch {
		// A missing file still gets a GitHub link, which shows the 404.
	}

	return {
		text: `${ GITHUB_URL }/${ kind }/trunk/${ repositoryPath
			.split( path.sep )
			.join( '/' ) }${ hash }`,
	};
}

/**
 * Rewrites a Markdown document written for GitHub so it renders in Storybook.
 *
 * @param markdown The Markdown document.
 * @param fromFile Absolute path of the document.
 * @return The document as text parts and assets to import, in order.
 */
export function rewriteMarkdown( markdown: string, fromFile: string ) {
	const parts: Part[] = [];
	let text = '';

	for ( const segment of splitFences( markdown ) ) {
		if ( segment.code ) {
			text += segment.text;
			continue;
		}

		let lastIndex = 0;

		for ( const match of segment.text.matchAll( DESTINATION ) ) {
			const [ whole, mdOpen, mdTarget, htmlOpen, htmlTarget, htmlClose ] =
				match;
			const isAngled = mdTarget?.startsWith( '<' );
			const target = isAngled
				? mdTarget.slice( 1, -1 )
				: ( mdTarget ?? htmlTarget );
			const rewritten = rewriteDestination( target, fromFile );

			text += segment.text.slice( lastIndex, match.index );
			text += mdOpen ?? htmlOpen;

			if ( 'asset' in rewritten ) {
				parts.push( { text } );
				parts.push( rewritten );
				text = '';
			} else {
				text += isAngled ? `<${ rewritten.text }>` : rewritten.text;
			}

			text += htmlClose ?? '';
			lastIndex = match.index + whole.length;
		}

		text += segment.text.slice( lastIndex );
	}

	parts.push( { text } );

	return parts;
}

/**
 * Vite plugin for Markdown documents that are read on GitHub and rendered in
 * Storybook. Import a document with the `?doc` query to get its text with:
 *
 * - relative images bundled and pointed at their built URL,
 * - relative links to other repository files pointed at GitHub,
 * - links to the published Storybook made relative to the current Storybook.
 *
 * Write the document for GitHub, with relative paths, and pass the import to
 * Storybook's `Markdown` block.
 *
 * @return The Vite plugin.
 */
export function markdownDoc(): Plugin {
	return {
		name: 'wordpress-markdown-doc',
		enforce: 'pre',
		load( id ) {
			if ( ! id.endsWith( `.md${ QUERY }` ) ) {
				return null;
			}

			const file = id.slice( 0, -QUERY.length );
			this.addWatchFile( file );

			const parts = rewriteMarkdown( readFileSync( file, 'utf8' ), file );
			const imports: string[] = [];
			const expression = parts.map( ( part ) => {
				if ( 'text' in part ) {
					return JSON.stringify( part.text );
				}
				const name = `asset${ imports.length }`;
				imports.push(
					`import ${ name } from ${ JSON.stringify(
						`${ part.asset }?url`
					) };`
				);
				return name;
			} );

			return [
				...imports,
				`export default ${ expression.join( ' + ' ) };`,
			].join( '\n' );
		},
	};
}
