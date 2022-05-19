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

	it( 'should delete block when backspace in an empty code', async () => {
		await insertBlock( 'Code' );
		await page.keyboard.type( 'a' );

		await page.keyboard.press( 'Backspace' );
		await page.keyboard.press( 'Backspace' );

		// Expect code block to be deleted.
		expect( await getEditedPostContent() ).toBe( '' );
	} );

	it( 'should paste plain text', async () => {
		await insertBlock( 'Code' );

		// Test to see if HTML and white space is kept.
		await setClipboardData( { plainText: '<img />\n\t<br>' } );

		await pressKeyWithModifier( 'primary', 'v' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
