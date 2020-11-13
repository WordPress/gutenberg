/**
 * WordPress dependencies
 */
import {
	insertBlock,
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
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
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
