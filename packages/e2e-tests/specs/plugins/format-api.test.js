/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockAppender,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	pressKeyWithModifier,
} from '@wordpress/e2e-test-utils';

describe( 'Using Format API', () => {
	beforeAll( async () => {
		await activatePlugin( 'gutenberg-test-format-api' );
	} );

	afterAll( async () => {
		await deactivatePlugin( 'gutenberg-test-format-api' );
	} );

	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'Format toolbar is present in a paragraph block', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await page.mouse.move( 200, 300, { steps: 10 } );
		expect( await page.$( '[aria-label="Custom Link"]' ) ).not.toBeNull();
	} );

	it( 'Clicking the control wraps the selected text properly with HTML code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await pressKeyWithModifier( 'primary', 'A' );
		await page.mouse.move( 200, 300, { steps: 10 } );
		await page.click( '[aria-label="Custom Link"]' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
