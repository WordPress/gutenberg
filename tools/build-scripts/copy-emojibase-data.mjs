#!/usr/bin/env node
/**
 * Copy Emojibase locale data into Gutenberg's `build/emojibase-data/`
 * directory so the editor's emoji picker can fetch translated emoji
 * labels and category names same-origin without inlining the data into
 * the JS bundle. Files are loaded per-locale at runtime (one locale per
 * editor session), so the disk cost on the build artifact does not
 * translate into a network cost for users.
 *
 * Runs as a step in `tools/build-scripts/build.mjs`, after wp-build has
 * populated `build/`. Exits 0 even when emojibase-data is missing — the
 * editor gracefully degrades by hiding the "More emojis" trigger.
 */

import { mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire( import.meta.url );
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

// Resolve emojibase-data via node module resolution so this works whether
// the dependency is hoisted to the repo root or nested in this workspace.
const SRC_DIR = path.dirname(
	require.resolve( 'emojibase-data/package.json' )
);
const DEST_DIR = path.join( ROOT_DIR, 'build', 'emojibase-data' );

// We only ever fetch data.json and messages.json. Shipping just those
// two files per locale keeps the rest of the upstream package
// (~50MB unpacked) out of the plugin distribution.
const FILES = [ 'data.json', 'messages.json' ];

// All locales Emojibase ships translated data for. Keep in sync with
// `EMOJIBASE_LOCALES` in `packages/editor/src/components/collab-sidebar/
// emoji-picker.js`. Each locale adds ~85KB gzipped on disk; only the
// active locale is fetched per editor session.
const LOCALES = [
	'bn',
	'da',
	'de',
	'en',
	'en-gb',
	'es',
	'es-mx',
	'et',
	'fi',
	'fr',
	'hi',
	'hu',
	'it',
	'ja',
	'ko',
	'lt',
	'ms',
	'nb',
	'nl',
	'pl',
	'pt',
	'ru',
	'sv',
	'th',
	'uk',
	'vi',
	'zh',
	'zh-hant',
];

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
