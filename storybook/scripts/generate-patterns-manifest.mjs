#!/usr/bin/env node
/**
 * Generates the design system patterns manifest.
 *
 * Pattern guidance is authored as MDX under
 * `storybook/stories/design-system/patterns`, which the Storybook renders for
 * human readers. This manifest publishes the same documents as plain markdown
 * so that machine consumers, such as the design system MCP server, can serve
 * the guidance without scraping a client-rendered application.
 *
 * Every document in the directory is included, so a new pattern needs no
 * registration anywhere.
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import assert from 'node:assert';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const PATTERNS_DIR = fileURLToPath(
	new URL( '../stories/design-system/patterns/', import.meta.url )
);

/**
 * Strip the Storybook-specific syntax from an MDX document, leaving plain
 * markdown. Pattern documents use MDX only for their Storybook framing: module
 * imports and self-closing blocks such as `<Meta />` and `<Canvas />`, none of
 * which carry guidance a reader can act on.
 *
 * @param {string} source The raw MDX source.
 * @return {string} The document as markdown.
 */
export function stripMdx( source ) {
	return source
		.replace( /^import\s[^\n]*\n/gm, '' )
		.replace( /^<[A-Z][^>]*\/>\n/gm, '' )
		.replace( /\n{3,}/g, '\n\n' )
		.trim();
}

/**
 * @typedef {Object} PatternManifestEntry
 * @property {string} slug        The pattern slug, matching its file name.
 * @property {string} title       The document's top-level heading.
 * @property {string} description The document's introductory paragraph.
 * @property {string} content     The document as plain markdown.
 */

/**
 * Parse a pattern document into its manifest entry. The title and description
 * come from the document itself, so that the manifest cannot describe a pattern
 * differently from how the Storybook presents it.
 *
 * @param {string} slug   The pattern slug, from the file name.
 * @param {string} source The raw MDX source.
 * @return {PatternManifestEntry} The manifest entry.
 */
export function parsePatternDocument( slug, source ) {
	const content = stripMdx( source );
	const [ , title ] = content.match( /^#\s+(.+)$/m ) ?? [];

	assert(
		title,
		`Pattern "${ slug }" has no top-level markdown heading to use as its title.`
	);

	const body = content.slice(
		content.indexOf( `# ${ title }` ) + title.length + 2
	);
	const [ description ] = body
		.split( /\n{2,}/ )
		.map( ( paragraph ) => paragraph.trim() )
		.filter( Boolean );

	assert(
		description,
		`Pattern "${ slug }" has no introductory paragraph to use as its description.`
	);

	return {
		slug,
		title,
		description: description.replace( /\s*\n\s*/g, ' ' ),
		content,
	};
}

/**
 * Build the manifest from every pattern document in a directory.
 *
 * @param {string} patternsDir Directory holding the pattern documents.
 * @return {Promise<{v: number, patterns: Record<string, PatternManifestEntry>}>} The manifest.
 */
export async function generatePatternsManifest( patternsDir = PATTERNS_DIR ) {
	const files = ( await readdir( patternsDir ) )
		.filter( ( file ) => file.endsWith( '.mdx' ) )
		.sort();

	/** @type {Record<string, PatternManifestEntry>} */
	const patterns = {};
	for ( const file of files ) {
		const slug = path.basename( file, '.mdx' );
		const source = await readFile( path.join( patternsDir, file ), 'utf8' );
		patterns[ slug ] = parsePatternDocument( slug, source );
	}

	return { v: 0, patterns };
}

if ( process.argv[ 1 ] === fileURLToPath( import.meta.url ) ) {
	const manifestPath = process.argv[ 2 ];

	assert( manifestPath, 'Manifest path is required' );

	const manifest = await generatePatternsManifest();
	await writeFile(
		manifestPath,
		JSON.stringify( manifest, null, '\t' ) + '\n'
	);
}
