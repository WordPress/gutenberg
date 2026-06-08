/**
 * Collects `synonyms` from `@wordpress/ui` Storybook CSF files for manager search.
 */
import { readdirSync, readFileSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = fileURLToPath( new URL( '.', import.meta.url ) );
const uiStoriesRoot = resolve( __dirname, '../../packages/ui/src' );

/**
 * @param {string} dir Directory to scan.
 * @return {Iterable<string>} Paths to story files.
 */
function* walkStoryFiles( dir ) {
	for ( const entry of readdirSync( dir, { withFileTypes: true } ) ) {
		const entryPath = join( dir, entry.name );

		if ( entry.isDirectory() ) {
			yield* walkStoryFiles( entryPath );
			continue;
		}

		if ( entry.isFile() && entry.name.endsWith( '.story.tsx' ) ) {
			yield entryPath;
		}
	}
}

/**
 * @param {string} content Story file source.
 * @return {{ title: string, synonyms: string[] } | null} Parsed title and synonyms.
 */
function parseStorySynonyms( content ) {
	const titleMatch = content.match( /^\s*title:\s*['"]([^'"]+)['"]/m );

	if ( ! titleMatch ) {
		return null;
	}

	const synonymsMatch = content.match( /^\s*synonyms:\s*\[([\s\S]*?)\]/m );

	if ( ! synonymsMatch ) {
		return null;
	}

	const synonyms = [
		...synonymsMatch[ 1 ].matchAll( /['"]([^'"]+)['"]/g ),
	].map( ( match ) => match[ 1 ] );

	if ( synonyms.length === 0 ) {
		return null;
	}

	return {
		title: titleMatch[ 1 ],
		synonyms,
	};
}

/**
 * @return {Record<string, string[]>} Synonyms keyed by story `title`.
 */
export function collectUiStorySynonyms() {
	/** @type {Record<string, string[]>} */
	const byTitle = {};

	for ( const filePath of walkStoryFiles( uiStoriesRoot ) ) {
		const parsed = parseStorySynonyms( readFileSync( filePath, 'utf8' ) );

		if ( parsed ) {
			byTitle[ parsed.title ] = parsed.synonyms;
		}
	}

	return byTitle;
}
