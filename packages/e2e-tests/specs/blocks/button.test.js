/**
 * WordPress dependencies
 */
import {
	insertBlock,
	getEditedPostContent,
	createNewPost,
} from '@wordpress/e2e-test-utils';

describe( 'Button', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'has focus on button content', async () => {
		await insertBlock( 'Button' );
		await page.keyboard.type( 'Content' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can jump focus back & forth', async () => {
		await insertBlock( 'Button' );
		await page.keyboard.type( 'WordPress' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.type( 'https://wordpress.org' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
