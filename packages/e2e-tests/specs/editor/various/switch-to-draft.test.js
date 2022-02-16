/**
 * WordPress dependencies
 */
import {
	createNewPost,
	openDocumentSettingsSidebar,
	publishPost,
	setBrowserViewport,
	trashAllPosts,
} from '@wordpress/e2e-test-utils';

async function prepTestPost( postType, viewport ) {
	// Create a post
	await createNewPost( { postType } );

	await page.type(
		'.editor-post-title__input',
		`Switch scheduled ${ postType } to draft`
	);
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type(
		`This will be a scheduled ${ postType } edited in a ${ viewport } viewport`
	);

	// Unselect the blocks.
	await page.evaluate( () => {
		wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
	} );
}

async function publishTestPost( postType, viewport ) {
	// Create a post
	await prepTestPost( postType, viewport );

	// Publish the post
	await publishPost();

	const publishedSnackBar = await page.waitForXPath(
		`//*[@aria-label="Dismiss this notice"][@role="button"]/div[contains(text(),"published")]`
	);

	const snackBarText = await (
		await publishedSnackBar.getProperty( 'textContent' )
	 ).jsonValue();

	expect( snackBarText.toLowerCase() ).toBe(
		`${ postType } published.view ${ postType }`
	);

	const closePublishingPanel = await page.waitForXPath(
		'//button[@aria-label="Close panel"]'
	);
	await closePublishingPanel.click();
}

async function scheduleTestPost( postType, viewport ) {
	// Create a post
	await prepTestPost( postType, viewport );

	if ( viewport === 'small' ) {
		await openDocumentSettingsSidebar();
	}
	// Set a publish date for the next month.
	await page.click( '.edit-post-post-schedule__toggle' );
	await page.click(
		'div[aria-label="Move forward to switch to the next month."]'
	);

	await (
		await page.$x( '//td[@role="button"]/*[text() = "15"]' )
	 )[ 0 ].click();

	await page.click( '.edit-post-post-schedule__toggle' );

	if ( viewport === 'small' ) {
		const closeDocumentSettingsButton = await page.waitForXPath(
			'//div[@aria-label="Editor settings"]//button[@aria-label="Close settings"]'
		);
		await closeDocumentSettingsButton.click();
	}

	// Important: target an ellipsis (…) and not three dots (...)
	const scheduleButton = await page.waitForXPath(
		'//button[text()="Schedule…"]'
	);
	await scheduleButton.click();
	const secondScheduleButton = await page.waitForXPath(
		'//button[text()="Schedule"]'
	);
	await secondScheduleButton.click();

	const closePublishingPanel = await page.waitForXPath(
		'//button[@aria-label="Close panel"]'
	);
	await closePublishingPanel.click();
}

async function verifyRevertToDraft( postType ) {
	const revertedSnackBar = await page.waitForXPath(
		`//*[@aria-label="Dismiss this notice"][@role="button"]/div[contains(text(),"reverted")]`
	);

	const revertedSnackBarText = await (
		await revertedSnackBar.getProperty( 'textContent' )
	 ).jsonValue();

	expect( revertedSnackBarText.toLowerCase() ).toBe(
		`${ postType } reverted to draft.`
	);
}

describe( 'Clicking "Switch to draft" on a published post/page', () => {
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
				beforeEach( async () => {
					await setBrowserViewport( viewport );
				} );

				it( `should leave a published ${ postType } published if canceled`, async () => {
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

					const postStatus = await page.evaluate( () => {
						return wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'status' );
					} );
					expect( postStatus ).toBe( 'publish' );
				} );
				it( `should revert a published ${ postType } to a draft if confirmed`, async () => {
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

					await verifyRevertToDraft( postType );

					const postStatus = await page.evaluate( () => {
						return wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'status' );
					} );
					expect( postStatus ).toBe( 'draft' );
				} );
			} );
		} );
	} );
} );
describe( 'Clicking "Switch to draft" on a scheduled post/page', () => {
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
				beforeEach( async () => {
					await setBrowserViewport( viewport );
				} );

				it( `should leave a scheduled ${ postType } scheduled if canceled`, async () => {
					scheduleTestPost( postType, viewport );

					const switchToDraftButton = await page.waitForXPath(
						`//button[contains(text(), "${ buttonText }")]`
					);
					await switchToDraftButton.click();

					// Process the ConfirmDialog
					await page.waitForXPath(
						'//*[text()="Are you sure you want to unschedule this post?"]'
					);
					const [ cancelButton ] = await page.$x(
						'//*[@role="dialog"][not(@id="wp-link-wrap")]//button[text()="Cancel"]'
					);
					await cancelButton.click();

					// Confirm post is still scheduled
					const postStatus = await page.evaluate( () => {
						return wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'status' );
					} );
					expect( postStatus ).toBe( 'future' );
				} );
				it( `should revert a scheduled ${ postType } to a draft if confirmed`, async () => {
					// Switch to draft
					const switchToDraftButton = await page.waitForXPath(
						`//button[contains(text(), "${ buttonText }")]`
					);
					await switchToDraftButton.click();

					// Process the ConfirmDialog
					await page.waitForXPath(
						'//*[text()="Are you sure you want to unschedule this post?"]'
					);
					const [ confirmButton ] = await page.$x(
						'//*[@role="dialog"]//button[text()="OK"]'
					);
					await confirmButton.click();

					await verifyRevertToDraft( postType );

					const postStatus = await page.evaluate( () => {
						return wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'status' );
					} );
					expect( postStatus ).toBe( 'draft' );
				} );
			} );
		} );
	} );
} );
