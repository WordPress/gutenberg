#!/usr/bin/env node
/**
 * Generates a snapshot of every Storybook story and doc URL.
 *
 * A story's URL is its ID, and every published link, bookmark, handbook page
 * and deprecation notice points at one. The snapshot records the full set so
 * that losing one has to be a deliberate act rather than a side effect of a
 * rename nobody looked at twice.
 *
 * The snapshot is regenerated in CI, which fails if an ID it used to contain
 * is gone. Removing a page on purpose still works: delete it and commit the
 * regenerated snapshot in the same change, where the loss is visible in the
 * diff. New IDs are written without complaint.
 *
 * The story index is built from source, so this needs no Storybook build.
 *
 * Usage: node generate-story-id-snapshot.mjs
 */
import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { buildIndex } from 'storybook/internal/core-server';

const CONFIG_DIR = path.join( import.meta.dirname, '..' );
const SNAPSHOT_PATH = path.join( CONFIG_DIR, 'story-ids.txt' );

const HEADER =
	'# Auto-generated snapshot of every Storybook story and doc URL.\n' +
	'# Do not edit by hand. Regenerate with `npm run storybook:story-id-snapshot`\n' +
	'# and commit the result. See `storybook/README.md` for details.\n';

/**
 * Reads the IDs out of the committed snapshot, ignoring its header.
 *
 * @return {Promise<string[]>} The IDs, or an empty list if there is no
 *                             snapshot yet.
 */
async function readSnapshot() {
	try {
		const raw = await readFile( SNAPSHOT_PATH, 'utf8' );
		return raw
			.split( '\n' )
			.map( ( line ) => line.trim() )
			.filter( ( line ) => line && ! line.startsWith( '#' ) );
	} catch ( error ) {
		if (
			/** @type {NodeJS.ErrnoException} */ ( error ).code !== 'ENOENT'
		) {
			throw error;
		}
		return [];
	}
}

const { entries } = await buildIndex( { configDir: CONFIG_DIR } );
const current = Object.keys( entries ).sort();

if ( current.length === 0 ) {
	console.error(
		'No stories were indexed. The Storybook configuration may have changed.'
	);
	process.exit( 1 );
}

const committed = await readSnapshot();
const currentIds = new Set( current );
const committedIds = new Set( committed );
const removed = committed.filter( ( id ) => ! currentIds.has( id ) );
const added = current.filter( ( id ) => ! committedIds.has( id ) );

await writeFile( SNAPSHOT_PATH, HEADER + current.join( '\n' ) + '\n' );

if ( added.length > 0 ) {
	console.log( `Added ${ added.length } story ID(s) to the snapshot.` );
}

if ( removed.length > 0 ) {
	console.error(
		`${ removed.length } story URL(s) no longer exist:\n\n` +
			removed.map( ( id ) => `  - ${ id }` ).join( '\n' ) +
			`\n\nEach of these is a published URL that will start 404ing. If a story moved\n` +
			`in the sidebar, give it back its original \`id\` so the URL follows it.\n` +
			`Documentation for a deprecated component is usually better marked deprecated\n` +
			`than deleted. If the removal is intended, commit the regenerated\n` +
			`storybook/story-ids.txt so the lost URLs show up in the diff.\n`
	);
	process.exitCode = 1;
}
