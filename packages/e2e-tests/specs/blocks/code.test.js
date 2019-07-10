/**
 * WordPress dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	createNewPost,
	switchToEditMode,
} from '@wordpress/e2e-test-utils';

describe( 'Code', () => {
	beforeEach( async () => {
		await createNewPost();
		await switchToEditMode();
	} );

	it( 'can be created by three backticks and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
