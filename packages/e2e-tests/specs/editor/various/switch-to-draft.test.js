/**
 * WordPress dependencies
 */
import {
	createNewPost,
	publishPost,
	setBrowserViewport,
	trashAllPosts,
} from '@wordpress/e2e-test-utils';

async function publishTestPost( postType, viewport ) {
	// Capitalize postType for use in snackbar XPath
	const capitalizedPostType =
		postType.charAt( 0 ).toUpperCase() + postType.slice( 1 );

	// Create a post
	await createNewPost( { postType } );

	await page.type(
		'.editor-post-title__input',
		`Switch ${ postType } to draft`
	);
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type(
		`This will be a published ${ postType } edited in a ${ viewport } viewport`
	);

	// Unselect the blocks.
	await page.evaluate( () => {
		wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
	} );

	// Publish the post
	await publishPost();

	await page.waitForXPath(
		`//*[contains(@class, "components-snackbar")]/*[text()="${ capitalizedPostType } published."]`
	);

	const closePublishingPanel = await page.waitForXPath(
		'//button[@aria-label="Close panel"]'
	);
	await closePublishingPanel.click();
}

describe( 'Switch to draft button', () => {
	beforeAll( async () => {
		await trashAllPosts( 'post' );
		await trashAllPosts( 'page' );
	} );
	afterEach( async () => {
		await setBrowserViewport( 'large' );
	} );

	[ 'large', 'small' ].forEach( ( viewport ) => {
		describe( `in a ${ viewport } viewport`, () => {
			[ 'post', 'page' ].forEach( ( postType ) => {
				const buttonText =
					viewport === 'large' ? 'Switch to draft' : 'Draft';
				// Capitalize postType for use in snackbar XPath
				beforeEach( async () => {
					await setBrowserViewport( viewport );
				} );

				it( `should leave a ${ postType } published if canceled`, async () => {
					publishTestPost( postType, viewport );

					const switchToDraftButton = await page.waitForXPath(
						`//button[contains(text(), "${ buttonText }")]`
					);
					await switchToDraftButton.click();

					// Process the ConfirmDialog
					await page.waitForXPath(
						'//*[text()="Are you sure you want to unpublish this post?"]'
					);
					const [ cancelButton ] = await page.$x(
						'//*[@role="dialog"][not(@id="wp-link-wrap")]//button[text()="Cancel"]'
					);
					await cancelButton.click();

					// Confirm that the post is still published by verifying the presence of the "Update" button
					const postPublishButton = await page.$(
						'.editor-post-publish-button__button'
					);
					const postPublishButtonText = await page.evaluate(
						( button ) => button.textContent,
						postPublishButton
					);

					expect( postPublishButtonText ).toBe( 'Update' );
				} );
				it( `should revert a ${ postType } to a draft if confirmed`, async () => {
					// Switch to draft
					const switchToDraftButton = await page.waitForXPath(
						`//button[contains(text(), "${ buttonText }")]`
					);
					await switchToDraftButton.click();

					// Process the ConfirmDialog
					await page.waitForXPath(
						'//*[text()="Are you sure you want to unpublish this post?"]'
					);
					const [ confirmButton ] = await page.$x(
						'//*[@role="dialog"]//button[text()="OK"]'
					);
					await confirmButton.click();

					// Confirm that the post is now a draft by verifying the presence of the "Publish" button
					await page.waitForXPath(
						'//button[contains(@class,"editor-post-publish-button__button")][not(contains(@class,"is-busy"))]'
					);

					const postPublishButton = await page.$(
						'.editor-post-publish-button__button'
					);
					const postPublishButtonText = await page.evaluate(
						( button ) => button.textContent,
						postPublishButton
					);

					expect( postPublishButtonText ).toBe( 'Publish' );
				} );
			} );
		} );
	} );
} );
