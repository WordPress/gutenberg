/**
 * WordPress dependencies
 */
import {
	createNewPost,
	getEditedPostContent,
	clickBlockAppender,
	pressKeyWithModifier,
	clickBlockToolbarButton,
} from '@wordpress/e2e-test-utils';

describe( 'RichText', () => {
	beforeEach( async () => {
		await createNewPost();
	} );

	it( 'should remove highlighting element', async () => {
		await clickBlockAppender();

		// Add text and select to color.
		await page.keyboard.type( '1' );
		await pressKeyWithModifier( 'primary', 'a' );
		await clickBlockToolbarButton( 'More' );

		const button = await page.waitForXPath(
			`//button[text()='Highlight']`
		);
		// Clicks may fail if the button is out of view. Assure it is before click.
		await button.evaluate( ( element ) => element.scrollIntoView() );
		await button.click();

		// Tab to the "Text" tab.
		await page.keyboard.press( 'Tab' );
		// Tab to black.
		await page.keyboard.press( 'Tab' );
		// Select color other than black.
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Tab' );
		await page.keyboard.press( 'Space' );

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await page.keyboard.press( 'Space' );

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
