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

		// Use a color name with multiple words to ensure that it becomes
		// active. Previously we had a broken regular expression.
		const option = await page.waitForSelector(
			'[aria-label="Color: Cyan bluish gray"]'
		);

		await option.click();

		expect( await getEditedPostContent() ).toMatchSnapshot();

		await option.click();

		expect( await getEditedPostContent() ).toMatchSnapshot();
	} );
} );
