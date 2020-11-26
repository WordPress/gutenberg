/**
 * WordPress dependencies
 */
import {
	insertBlock,
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	setClipboardData,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Code', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'can be created by three backticks and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'should paste plain text', async () => {
		await insertBlock( 'Code' );

		// Test to see if HTML and white space is kept.
		await setClipboardData( { plainText: '<img />\n\t<br>' } );

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
