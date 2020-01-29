/**
 * WordPress dependencies
 */
import {
	insertBlock,
	getEditedPostContent,
	createNewPost,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Buttons', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'has focus on button content', async () => {
		await insertBlock( 'Buttons' );
		await page.keyboard.type( 'Content' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'dismisses link editor when escape is pressed', async () => {
		// Regression: https://github.com/WordPress/gutenberg/pull/19885
		await insertBlock( 'Buttons' );
		await pressKeyWithModifier( 'primary', 'k' );
		await page.keyboard.press( 'Escape' );
		await page.keyboard.type( 'WordPress' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );

	it( 'can jump to the link editor using the keyboard shortcut', async () => {
		await insertBlock( 'Buttons' );
		await page.keyboard.type( 'WordPress' );
		await pressKeyWithModifier( 'primary', 'k' );
		await page.keyboard.type( 'https://www.wordpress.org/' );
		await page.keyboard.press( 'Enter' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
