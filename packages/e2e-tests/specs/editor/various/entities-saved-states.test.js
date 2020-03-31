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
				await page.keyboard.type( 'Test Post...' );
				await page.keyboard.press( 'Enter' );

				// Button should not have has-changes-dot class.
				const saveButton = await page.$(
					'.editor-post-publish-button__button.has-changes-dot'
				);
				expect( saveButton ).toBeNull();
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
				const tempPart = await page.waitForSelector(
					'*[data-type="core/template-part"] .block-editor-inner-blocks'
				);
				await tempPart.focus();
				await page.keyboard.press( 'Tab' );
				await page.keyboard.type( 'some words...' );

				// Button should have has-changes-dot class
				const saveButton = await page.$(
					'.editor-post-publish-button__button.has-changes-dot'
				);
				expect( saveButton ).not.toBeNull();
			} );
			// open save modal, => all boxes checked
			it( 'Clicking should open modal with boxes checked by default', async () => {
				await page.click( '.editor-post-publish-button__button' );
				const checkedBoxes = await page.$$(
					'.components-checkbox-control__checked'
				);
				expect( checkedBoxes.length ).toBe( 2 );
			} );
			// save modal => draft saved + no dot on publish
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
				const saveButton = await page.$(
					'.editor-post-publish-button__button.has-changes-dot'
				);
				expect( saveButton ).toBeNull();
			} );
		} );
		// from published state?
		describe( 'Published state', () => {
			it( 'Should not trigger multi-entity save button with only post edited', async () => {
				await publishPostWithPrePublishChecksDisabled();
				const saveButton = await page.$(
					'.editor-post-publish-button__button[aria-disabled=true]'
				);
				expect( saveButton ).not.toBeNull();
			} );
		} );
		// edit post =>
	} );
} );
