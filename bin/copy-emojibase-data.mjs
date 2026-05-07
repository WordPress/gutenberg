#!/usr/bin/env node
/**
 * Copy the locale data files Frimousse expects from the bundled
 * emojibase-data package into Gutenberg's `build/emojibase-data/`
 * directory so the plugin can serve them via plugins_url() instead of
 * inlining ~770KB of JSON into the editor JS bundle.
 *
 * Runs as a step in `bin/build.mjs`, after wp-build has populated
 * `build/`. Exits 0 even when emojibase-data is missing — the editor
 * gracefully degrades by hiding the "More emojis" trigger.
 */

import { mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '..' );
const SRC_DIR = path.join( ROOT_DIR, 'node_modules', 'emojibase-data' );
const DEST_DIR = path.join( ROOT_DIR, 'build', 'emojibase-data' );

// Frimousse only ever fetches data.json and messages.json. We ship just
// those two files per locale; the rest of the package (~50MB unpacked)
// stays out of the plugin distribution.
const FILES = [ 'data.json', 'messages.json' ];

// Locales the plugin ships. Keep this small for now — adding a locale
// is ~85KB gzipped. English covers the strings shown to users today.
const LOCALES = [ 'en' ];

async function copyEmojibaseData() {
	if ( ! existsSync( SRC_DIR ) ) {
		console.warn(
			'⚠️  emojibase-data not found at',
			SRC_DIR,
			'— skipping. Run `npm install` to fetch it.'
		);
		return;
	}

	for ( const locale of LOCALES ) {
		const localeDest = path.join( DEST_DIR, locale );
		await mkdir( localeDest, { recursive: true } );
		for ( const file of FILES ) {
			const from = path.join( SRC_DIR, locale, file );
			const to = path.join( localeDest, file );
			if ( ! existsSync( from ) ) {
				console.warn( `⚠️  emojibase-data missing ${ from }` );
				continue;
			}
			await copyFile( from, to );
		}
	}
	console.log(
		`   ✔ Copied emojibase data for ${ LOCALES.join(
			', '
		) } to build/emojibase-data/`
	);
}

copyEmojibaseData().catch( ( error ) => {
	console.error( '❌ Failed to copy emojibase data:', error );
	process.exit( 1 );
} );
