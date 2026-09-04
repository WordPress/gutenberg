import path from 'node:path';
import { buildIndex } from 'storybook/internal/core-server';
import { describe, expect, it } from 'vitest';

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
		const { entries } = await buildIndex( {
			configDir: path.join( __dirname, '..' ),
		} );
		const roots = new Set< string >();
		for ( const { title } of Object.values( entries ) ) {
			roots.add( title.split( '/' )[ 0 ] );
		}

		expect( [ ...roots ].sort() ).toEqual( ROOT_FOLDERS );
	}, 120_000 ); // Building the index reads every story file from source.
} );
