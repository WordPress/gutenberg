/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	insertBlock,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Deprecated Node Matcher', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-deprecated-node-matcher' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-deprecated-node-matcher' );
	} );

	it( 'should insert block with node source', async () => {
		await insertBlock( 'Deprecated Node Matcher' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	// This test isn't reliable on Travis and fails from time to time.
	// See: https://github.com/WordPress/gutenberg/pull/14986.
	it.skip( 'should insert block with children source', async () => {
		await insertBlock( 'Deprecated Children Matcher' );
		await page.keyboard.type( 'test' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'a' );
		await page.keyboard.down( 'Shift' );
		await page.keyboard.press( 'ArrowLeft' );
		await page.keyboard.up( 'Shift' );
		// Skip reason: when it fails the selection above doesn't get applied.
		await pressKeyWithModifier( 'primary', 'b' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
