/**
 * Internal dependencies
 */
import {
	clickBlockAppender,
	getEditedPostContent,
	newPost,
} from '../../support/utils';

describe( 'Code', () => {
	beforeEach( async () => {
		await newPost();
	} );

	it( 'can be created by three backticks and enter', async () => {
		await clickBlockAppender();
		await page.keyboard.type( '```' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '<?php' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
