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
	// Capitalize postType for use in snackbar XPath
	const capitalizedPostType =
		postType.charAt( 0 ).toUpperCase() + postType.slice( 1 );

	// Create a post
	await prepTestPost( postType, viewport );

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
		await page.$x(
			'//td[contains(concat(" ", @class, " "), " CalendarDay ")]/div[contains(concat(" ", @class, " "), " components-datetime__date__day ")][text() = "15"]'
		)
	 )[ 0 ].click();

	await page.click( '.edit-post-post-schedule__toggle' );

	if ( viewport === 'small' ) {
		const closeDocumentSettingsButton = await page.waitForXPath(
			'//div[contains(@class,"interface-complementary-area-header__small")]/button[@aria-label="Close settings"]'
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
				// Capitalize postType for use in snackbar XPath
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
				// Capitalize postType for use in snackbar XPath
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

					// Confirm that the post is now a draft by verifying the presence of the "Publish" button
					await page.waitForXPath(
						'//button[contains(@class,"editor-post-publish-button__button")][not(contains(@class,"is-busy"))]'
					);

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
