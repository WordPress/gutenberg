/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	disablePrePublishChecks,
	publishPostWithPrePublishChecksDisabled,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../../experimental-features';

async function assertSaveButtonDisabled() {
	const disabledSaveButton = await page.$(
		'.editor-post-publish-button__button[aria-disabled=true]'
	);
	expect( disabledSaveButton ).not.toBeNull();
}

async function assertSaveButtonEnabled() {
	const enabledSaveButton = await page.$(
		'.editor-post-publish-button__button[aria-disabled=false]'
	);
	expect( enabledSaveButton ).not.toBeNull();
}

async function assertMultiSaveEnabled() {
	const multiSaveButton = await page.waitForSelector(
		'.editor-post-publish-button__button.has-changes-dot'
	);
	expect( multiSaveButton ).not.toBeNull();
}

async function assertMultiSaveDisabled() {
	const multiSaveButton = await page.$(
		'.editor-post-publish-button__button.has-changes-dot'
	);
	expect( multiSaveButton ).toBeNull();
}

describe( 'Multi-entity save flow', () => {
	const experimentsSettings = [ '#gutenberg-full-site-editing' ];

	beforeAll( async () => {
		await enableExperimentalFeatures( experimentsSettings );
	} );

	afterAll( async () => {
		await disableExperimentalFeatures( experimentsSettings );
	} );

	describe( 'Post Editor', () => {
		describe( 'Pre-Publish state', () => {
			it( 'Should not trigger multi-entity save button with only post edited', async () => {
				await createNewPost();
				await disablePrePublishChecks();
				// Edit the page some.
				await page.click( '.editor-post-title' );
				await page.keyboard.type( 'Test Post...' );
				await page.keyboard.press( 'Enter' );

				// Button should not have has-changes-dot class.
				await assertMultiSaveDisabled();
			} );

			it( 'Should trigger multi-entity save button once template part edited', async () => {
				// Create new template part.
				await insertBlock( 'Template Part' );
				await page.keyboard.type( 'test-template-part' );
				await page.keyboard.press( 'Tab' );
				await page.keyboard.type( 'test-theme' );
				await page.keyboard.press( 'Tab' );
				await page.keyboard.press( 'Enter' );
				// Make some changes in new Template Part.
				await page.waitForSelector(
					'*[data-type="core/template-part"] .block-editor-inner-blocks'
				);
				await page.click( '*[data-type="core/template-part"]' );
				await page.keyboard.type( 'some words...' );
				// Button should have has-changes-dot class
				await assertMultiSaveEnabled();
			} );

			it( 'Clicking should open modal with boxes checked by default', async () => {
				await page.click( '.editor-post-publish-button__button' );
				const checkedBoxes = await page.$$(
					'.components-checkbox-control__checked'
				);
				expect( checkedBoxes.length ).toBe( 2 );
			} );

			it( 'Saving should result in items being saved', async () => {
				await page.click(
					'.editor-entities-saved-states__save-button'
				);

				// Verify post is saved.
				const draftSaved = await page.waitForSelector(
					'.editor-post-saved-state.is-saved'
				);
				expect( draftSaved ).not.toBeNull();

				// Verify template part is saved.
				await assertMultiSaveDisabled();
			} );
		} );

		describe( 'Published state', () => {
			it( 'Update button disabled after publish', async () => {
				await publishPostWithPrePublishChecksDisabled();
				await assertSaveButtonDisabled();
			} );

			it( 'Update button enabled after editing post', async () => {
				await page.click( '.editor-post-title' );
				await page.keyboard.type( '...more title!' );

				// Verify update button is enabled.
				await assertSaveButtonEnabled();

				// Verify is not for multi-entity saving.
				await assertMultiSaveDisabled();
			} );

			it( 'Multi-save button triggered after editing template part.', async () => {
				const templatePart = await page.waitForSelector(
					'*[data-type="core/template-part"] .block-editor-inner-blocks'
				);
				await templatePart.click();
				await page.keyboard.type( '...some more words...' );
				await page.keyboard.press( 'Enter' );
				await assertMultiSaveEnabled();
			} );
		} );
	} );
} );
