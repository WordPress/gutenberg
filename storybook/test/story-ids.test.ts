import { globSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { analyzeMdx } from 'storybook/internal/core-server';
import { loadCsf } from 'storybook/internal/csf-tools';
import { describe, expect, it } from 'vitest';
import { storyGlobs } from '../story-globs';

const CONFIG_DIR = path.join( __dirname, '..' );

/**
 * Lists every story and doc Storybook indexes.
 *
 * @return Paths relative to the Storybook config directory.
 */
function findStoryFiles() {
	return globSync( storyGlobs, { cwd: CONFIG_DIR } ).sort();
}

/**
 * Whether a story or doc pins its own URL with an `id`.
 *
 * An MDX doc attached to a CSF file with `of={ ... }` inherits that file's ID,
 * so it has nothing of its own to declare.
 *
 * @param file Path to the story or doc, relative to the Storybook config.
 * @return Resolves to `true` when the file's URL cannot move with its title.
 */
async function hasStableId( file: string ) {
	const source = readFileSync( path.join( CONFIG_DIR, file ), 'utf8' );

	if ( file.endsWith( '.mdx' ) ) {
		// Storybook's own MDX analyzer, which the indexer builds docs IDs from.
		const { id, of } = await analyzeMdx( source );
		return Boolean( id || of );
	}

	// Storybook's own CSF parser only fills in `id` when the meta declares one.
	const csf = loadCsf( source, {
		fileName: file,
		makeTitle: ( title ) => title,
	} ).parse();
	return Boolean( csf._meta?.id );
}

describe( 'story IDs', () => {
	const files = findStoryFiles();

	it( 'covers every story and doc', () => {
		// Guards against the walk silently matching nothing, which would let
		// the check below pass without reading a single file.
		expect( files.length ).toBeGreaterThan( 250 );
	} );

	// A story's URL is built from its `id`, falling back to its `title`. Only a
	// declared `id` keeps the URL from moving when the story does.
	it.each( files )( '%s declares an id', async ( file ) => {
		expect( await hasStableId( file ) ).toBe( true );
	} );
} );
