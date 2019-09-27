/**
 * WordPress dependencies
 */
import {
	activatePlugin,
	clickBlockAppender,
	clickBlockToolbarButton,
	createNewPost,
	deactivatePlugin,
	getEditedPostContent,
	pressKeyWithModifier,
	clickButton,
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

	it( 'Clicking the control wraps the selected text properly with HTML code', async () => {
		await clickBlockAppender();
		await page.keyboard.type( 'First paragraph' );
		await pressKeyWithModifier( 'shiftAlt', 'ArrowLeft' );
		await clickBlockToolbarButton( 'More rich text controls' );
		await clickButton( 'Custom Link' );
		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
