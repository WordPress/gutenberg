#!/usr/bin/env node
/**
 * Copy Emojibase locale data into `build/emojibase-data/` so the emoji
 * picker fetches labels same-origin rather than inlining them into the
 * JS bundle. One locale is fetched per editor session, so the disk cost
 * is not a network cost.
 *
 * Runs from `tools/build-scripts/build.mjs` after wp-build populates
 * `build/`. Exits 0 when emojibase-data is missing: the editor degrades
 * by hiding the "More emojis" trigger.
 */

import { mkdir, copyFile } from 'fs/promises';
import { existsSync } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';

const require = createRequire( import.meta.url );
const __dirname = path.dirname( fileURLToPath( import.meta.url ) );
const ROOT_DIR = path.resolve( __dirname, '../..' );

/*
 * Resolved through node so a hoisted or nested install both work. An
 * unresolvable module is the same "not installed" case the copy step
 * skips, so it must not throw and take the plugin build down with it.
 */
const SRC_DIR = resolveEmojibaseDir();

function resolveEmojibaseDir() {
	try {
		return path.dirname( require.resolve( 'emojibase-data/package.json' ) );
	} catch {
		return null;
	}
}

const DEST_DIR = path.join( ROOT_DIR, 'build', 'emojibase-data' );

/*
 * Only this one is fetched; the rest of the ~49MB package is skipped.
 * Category headings come from Unicode's own group names, translated in
 * the picker, so `messages.json` is not copied.
 */
const FILES = [ 'data.json' ];

/*
 * Every locale Emojibase translates. Must stay in sync with
 * `EMOJIBASE_LOCALES` in
 * `packages/editor/src/components/collab-sidebar/emojibase-data.ts`.
 * Each locale costs ~780KB on disk (~22MB total), ~95KB gzipped over the
 * wire, and only the active one is fetched per editor session.
 */
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
	if ( ! SRC_DIR || ! existsSync( SRC_DIR ) ) {
		console.warn(
			'⚠️  emojibase-data not found',
			SRC_DIR ? `at ${ SRC_DIR }` : '',
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
