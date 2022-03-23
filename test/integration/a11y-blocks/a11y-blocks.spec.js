/**
 * WordPress dependencies
 */
import { installTheme, activateTheme } from '@wordpress/e2e-test-utils';
import apiFetch from '@wordpress/api-fetch';
/**
 * External dependencies
 */
import path from 'path';
import fs from 'fs';
import glob from 'fast-glob';

const FIXTURES_FOLDER_PATH = './test/integration/fixtures/blocks';

const fixtureFiles = fs
	.readdirSync( FIXTURES_FOLDER_PATH )
	.filter(
		( file ) =>
			file.endsWith( '.json' ) &&
			! file.endsWith( '.parsed.json' ) &&
			! file.includes( '__deprecated' )
	);

const blockMetadataFiles = glob.sync(
	'packages/block-library/src/*/block.json'
);

function getBlockFixtures( blockName ) {
	const underscoredBlockName = blockName.replace( '/', '__' );

	const jsonFixtures = fixtureFiles.filter(
		( filename ) =>
			filename.includes( underscoredBlockName ) &&
			JSON.parse(
				fs.readFileSync(
					path.join( FIXTURES_FOLDER_PATH, filename ),
					'utf-8'
				)
			)[ 0 ].name === blockName
	);

	return jsonFixtures.map( ( filename ) =>
		filename.replace( '.json', '.html' )
	);
}

describe( 'A11y tests for rendered Gutenberg Blocks', () => {
	beforeAll( async () => {
		// Activates the latest default theme
		await installTheme( 'twentytwentytwo' );
		await activateTheme( 'twentytwentytwo' );
	} );

	for ( const blockMetadataFile of blockMetadataFiles ) {
		const blockFile = fs.readFileSync( blockMetadataFile, 'utf-8' );
		const block = JSON.parse( blockFile );
		const fixtureFilenames = getBlockFixtures( block.name );

		it( `${ block.name } block should have fixtures to be tested`, () => {
			expect( fixtureFilenames.length ).toBeGreaterThan( 0 );
		} );

		for ( const file of fixtureFilenames ) {
			const fixture = fs.readFileSync(
				path.join( FIXTURES_FOLDER_PATH, file ),
				'utf-8'
			);

			it( `${ block.name } using ${ file } fixture should pass a11y tests`, async () => {
				// Create a new post contining the block
				const post = await apiFetch( {
					path: '/wp/v2/posts',
					method: 'POST',
					data: {
						title: block.name,
						content: fixture,
						status: 'publish',
					},
				} );
				// Navigate to the post
				await page.goto( post.link );

				// Checks if something was rendered using that fixture
				const element = await page.$( '.entry-content' );
				const renderedContent = await page.evaluate(
					( el ) => el?.innerHTML,
					element
				);

				// If something was rendered by the fixture, run a11y tests
				if ( renderedContent?.[ 0 ] ) {
					// Test the block for a11y issues
					// eslint-disable-next-line jest/no-conditional-expect
					await expect( page ).toPassAxeTests( {
						include: '.entry-content',
						disabledRules: block.a11y?.disabledRules || [],
						options: block.a11y?.options || {},
						config: block.a11y?.config || {},
					} );
				}
			} );
		}
	}
} );
