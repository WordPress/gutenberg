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

const FIXTURES_FOLDER_PATH = './test/integration/fixtures/blocks';

function getFixtureFiles( fixturesFolderPath ) {
	const fixtureFolder = fs.readdirSync( fixturesFolderPath );
	return fixtureFolder.filter(
		( file ) =>
			file.endsWith( '.html' ) &&
			! file.endsWith( '.serialized.html' ) &&
			! file.includes( '_deprecated' )
	);
}

function readFixtureContent( fixturePath ) {
	return fs.readFileSync( fixturePath, 'utf8' );
}

describe( 'A11y tests for Gutenberg Blocks', () => {
	const fixtures = getFixtureFiles( FIXTURES_FOLDER_PATH );

	beforeAll( async () => {
		// Activates the latest default theme
		await installTheme("twentytwentytwo");
		await activateTheme("twentytwentytwo");
	} );

	for ( const fixture of fixtures ) {
		const blockName = fixture.replace( '.html', '' );
		const fixtureContent = readFixtureContent(
			path.join( FIXTURES_FOLDER_PATH, fixture )
		);

		it( `${ blockName } should pass a11y tests`, async () => {
			// Create a new post contining the block
			const post = await apiFetch( {
				path: '/wp/v2/posts',
				method: 'POST',
				data: {
					title: blockName,
					content: fixtureContent,
					status: 'publish',
				},
			} );
			// Navigate to the post
			await page.goto( post.link, {
				waitUntil: 'networkidle0',
			} );
			// Test the block for a11y issues
			await expect( page ).toPassAxeTests( {
				include: '.entry-content',
			} );
		} );
	}
} );
