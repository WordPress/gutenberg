#!/usr/bin/env node
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';

/**
 * The top-level folders of the Storybook sidebar.
 *
 * Each one answers a different question: what do I build new UI with
 * (Design System), what is in @wordpress/components (Classic Components),
 * what UI does the editor expose (Editor), what is there for the dashboard
 * (Widgets), where do I try the whole editor (Playground). Adding a root is a
 * deliberate choice: add it here in the same change so it shows up in review,
 * or nest the new stories under an existing root instead.
 *
 * @see https://github.com/WordPress/gutenberg/issues/82402
 */
const ROOT_FOLDERS = [
	'Classic Components',
	'Design System',
	'Editor',
	'Introduction',
	'Playground',
	'Widgets',
];

const indexPath = process.argv[ 2 ] ?? 'storybook/build/index.json';
const contents = await readFile( indexPath, 'utf8' );
let storyIndex;

try {
	storyIndex = JSON.parse( contents );
} catch ( error ) {
	throw new Error( `Could not parse ${ indexPath }.`, {
		cause: error,
	} );
}

assert(
	isStoryIndex( storyIndex ),
	`${ indexPath } does not contain a valid Storybook index.`
);

const roots = new Set();
for ( const { title } of Object.values( storyIndex.entries ) ) {
	roots.add( title.split( '/' )[ 0 ] );
}

assert.deepEqual(
	[ ...roots ].sort(),
	ROOT_FOLDERS,
	'Storybook has unexpected top-level sidebar folders.'
);

function isStoryIndex( value ) {
	if ( ! isRecord( value ) || ! isRecord( value.entries ) ) {
		return false;
	}

	return Object.values( value.entries ).every(
		( entry ) => isRecord( entry ) && typeof entry.title === 'string'
	);
}

function isRecord( value ) {
	return (
		typeof value === 'object' && value !== null && ! Array.isArray( value )
	);
}
