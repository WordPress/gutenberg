import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { describe, expect, it } from 'vitest';

type StoryIndexEntry = {
	title: string;
};

type StoryIndex = {
	entries: Record< string, StoryIndexEntry >;
};

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

describe( 'Storybook sidebar', () => {
	it( 'has only the agreed top-level folders', async () => {
		const indexPath = path.join( __dirname, '../build/index.json' );
		const contents = await readFile( indexPath, 'utf8' );
		let storyIndex: unknown;

		try {
			storyIndex = JSON.parse( contents );
		} catch ( error ) {
			throw new Error( `Could not parse ${ indexPath }.`, {
				cause: error,
			} );
		}

		if ( ! isStoryIndex( storyIndex ) ) {
			throw new Error(
				`${ indexPath } does not contain a valid Storybook index.`
			);
		}

		const roots = new Set< string >();
		for ( const { title } of Object.values( storyIndex.entries ) ) {
			roots.add( title.split( '/' )[ 0 ] );
		}

		expect( [ ...roots ].sort() ).toEqual( ROOT_FOLDERS );
	} );
} );

function isStoryIndex( value: unknown ): value is StoryIndex {
	if ( ! isRecord( value ) || ! isRecord( value.entries ) ) {
		return false;
	}

	return Object.values( value.entries ).every(
		( entry ) => isRecord( entry ) && typeof entry.title === 'string'
	);
}

function isRecord( value: unknown ): value is Record< string, unknown > {
	return (
		typeof value === 'object' && value !== null && ! Array.isArray( value )
	);
}
