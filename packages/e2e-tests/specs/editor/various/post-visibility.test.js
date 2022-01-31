/**
 * WordPress dependencies
 */
import {
	setBrowserViewport,
	createNewPost,
	openDocumentSettingsSidebar,
} from '@wordpress/e2e-test-utils';

describe( 'Post visibility', () => {
	afterEach( async () => {
		await setBrowserViewport( 'large' );
	} );
	[ 'large', 'small' ].forEach( ( viewport ) => {
		it( `can be changed when the viewport is ${ viewport }`, async () => {
			await setBrowserViewport( viewport );

			await createNewPost();

			await openDocumentSettingsSidebar();

			await page.click( '.edit-post-post-visibility__toggle' );

			const [ privateLabel ] = await page.$x(
				'//label[text()="Private"]'
			);
			await privateLabel.click();

			await page.waitForSelector( '.components-confirm-dialog' );

			const [ confirmButton ] = await page.$x( '//button[text()="OK"]' );
			await confirmButton.click();

			const currentStatus = await page.evaluate( () => {
				return wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( 'private' );
		} );

		it( `can be canceled when the viewport is ${ viewport }`, async () => {
			await setBrowserViewport( viewport );

			await createNewPost();

			await openDocumentSettingsSidebar();

			const initialStatus = await page.evaluate( () => {
				return wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			await page.click( '.edit-post-post-visibility__toggle' );

			const [ privateLabel ] = await page.$x(
				'//label[text()="Private"]'
			);
			await privateLabel.click();
			await page.waitForSelector( '.components-confirm-dialog' );
			const cancelButton = await page.waitForXPath(
				'//*[@role="dialog"][not(@id="wp-link-wrap")]//button[text()="Cancel"]'
			);
			await cancelButton.click();

			const currentStatus = await page.evaluate( () => {
				return wp.data
					.select( 'core/editor' )
					.getEditedPostAttribute( 'status' );
			} );

			expect( currentStatus ).toBe( initialStatus );
		} );
	} );

	it( 'visibility remains private even if the publish date is in the future', async () => {
		await createNewPost();

		// Enter a title for this post.
		await page.type( '.editor-post-title__input', 'Title' );

		await openDocumentSettingsSidebar();

		// Set a publish date for the next month.
		await page.click( '.edit-post-post-schedule__toggle' );
		await page.click(
			'div[aria-label="Move forward to switch to the next month."]'
		);
		await (
			await page.$x(
				'//td[contains(concat(" ", @class, " "), " CalendarDay ")]/div[contains(concat(" ", @class, " "), " components-datetime__date__day ")][text() = "15"]'
			)
		 )[ 0 ].click();

		await page.click( '.edit-post-post-visibility__toggle' );

		const [ privateLabel ] = await page.$x( '//label[text()="Private"]' );
		await privateLabel.click();

		await page.waitForSelector( '.components-confirm-dialog' );

		const [ confirmButton ] = await page.$x( '//button[text()="OK"]' );
		await confirmButton.click();

		// Enter a title for this post.
		await page.type( '.editor-post-title__input', ' Changed' );

		// Wait for the button to be clickable before attempting to click.
		// This could cause errors when we try to click before changes are registered.
		await page.waitForSelector(
			'.editor-post-publish-button[aria-disabled="false"]'
		);
		await page.click( '.editor-post-publish-button' );

		const currentStatus = await page.evaluate( () => {
			return wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'status' );
		} );

		expect( currentStatus ).toBe( 'private' );
	} );
} );
