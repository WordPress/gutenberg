#!/usr/bin/env node

/**
 * Check documentation image sources.
 *
 * Scans all markdown files under `docs/` and verifies that image references
 * do not use `raw.githubusercontent.com`. Images must be hosted in the
 * developer.wordpress.org Media Library so they aren't subject to rate
 * limiting when the Block Editor Handbook is rendered.
 *
 * @see https://github.com/WordPress/gutenberg/issues/79521
 */

import { readFileSync } from 'node:fs';
import { dirname, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import glob from 'glob';

const __dirname = dirname( fileURLToPath( import.meta.url ) );
const REPO_ROOT = resolve( __dirname, '../..' );
const DOCS_DIR = resolve( REPO_ROOT, 'docs' );

// Match markdown image syntax: ![alt](url) and HTML <img> tags with src attribute.
const IMAGE_PATTERNS = [
	// Markdown images: ![...](https://raw.githubusercontent.com/...)
	/!\[[^\]]*\]\(https?:\/\/raw\.githubusercontent\.com[^)]*\)/g,
	// HTML img tags: <img ... src="https://raw.githubusercontent.com/..." ...>
	/<img\b[^>]*\bsrc\s*=\s*["']https?:\/\/raw\.githubusercontent\.com[^"']*["'][^>]*>/gi,
];

const mdFiles = glob.sync( '**/*.md', { cwd: DOCS_DIR, absolute: true } );

let totalViolations = 0;
const violations = [];

for ( const filePath of mdFiles ) {
	const content = readFileSync( filePath, 'utf8' );
	const lines = content.split( '\n' );

	for ( let i = 0; i < lines.length; i++ ) {
		const line = lines[ i ];
		for ( const pattern of IMAGE_PATTERNS ) {
			// Reset lastIndex since we reuse the regex.
			pattern.lastIndex = 0;
			let match;
			while ( ( match = pattern.exec( line ) ) !== null ) {
				totalViolations++;
				violations.push( {
					file: relative( REPO_ROOT, filePath ),
					line: i + 1,
					match: match[ 0 ],
				} );
			}
		}
	}
}

if ( totalViolations > 0 ) {
	console.error(
		`\nFound ${ totalViolations } image(s) hosted on GitHub in documentation:\n`
	);

	for ( const { file, line, match } of violations ) {
		console.error( `  ${ file }:${ line }` );
		console.error( `    ${ match }\n` );
	}

	console.error(
		'Images in documentation must be hosted in the developer.wordpress.org'
	);
	console.error(
		'Media Library, not on GitHub. GitHub-hosted images are rate-limited'
	);
	console.error(
		'and may break when rendered in the Block Editor Handbook.'
	);
	console.error(
		'\nSee: https://developer.wordpress.org/block-editor/contributors/documentation/#using-images\n'
	);

	process.exitCode = 1;
} else {
	console.log(
		'All documentation images are properly hosted. No GitHub-hosted images found.'
	);
}
