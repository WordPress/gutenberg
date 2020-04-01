/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	disablePrePublishChecks,
	publishPostWithPrePublishChecksDisabled,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import {
	enableExperimentalFeatures,
	disableExperimentalFeatures,
} from '../../experimental-features';

describe( 'Multi-entity save flow', () => {
	// Selectors.
	const checkboxSelector = '.components-checkbox-control__checked';
	const templatePartSelector = '*[data-type="core/template-part"]';
	const saveButtonSelector = '.editor-post-publish-button__button';
	const multisaveSelector =
		'.editor-post-publish-button__button.has-changes-dot';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const saveSiteSelector = '.edit-site-save-button__button';

	// Setup & Teardown.
	const requiredExperiments = [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	];
	beforeAll( async () => {
		await enableExperimentalFeatures( requiredExperiments );
	} );
	afterAll( async () => {
		await disableExperimentalFeatures( requiredExperiments );
	} );

	describe( 'Post Editor', () => {
		const assertMultiSaveEnabled = async () => {
			const multiSaveButton = await page.waitForSelector(
				multisaveSelector
			);
			expect( multiSaveButton ).not.toBeNull();
		};

		const assertMultiSaveDisabled = async () => {
			const multiSaveButton = await page.$( multisaveSelector );
			expect( multiSaveButton ).toBeNull();
		};

		describe( 'Pre-Publish state', () => {
			it( 'Should not trigger multi-entity save button with only post edited', async () => {
				await createNewPost();
				await disablePrePublishChecks();
				// Edit the page some.
				await page.click( '.editor-post-title' );
				await page.keyboard.type( 'Test Post...' );
				await page.keyboard.press( 'Enter' );

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
					`${ templatePartSelector } .block-editor-inner-blocks`
				);
				await page.click( templatePartSelector );
				await page.keyboard.type( 'some words...' );

				await assertMultiSaveEnabled();
			} );

			it( 'Clicking should open modal with boxes checked by default', async () => {
				await page.click( saveButtonSelector );
				const checkedBoxes = await page.$$( checkboxSelector );
				expect( checkedBoxes.length ).toBe( 2 );
			} );

			it( 'Saving should result in items being saved', async () => {
				await page.click( entitiesSaveSelector );

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
				const disabledSaveButton = await page.$(
					`${ saveButtonSelector }[aria-disabled=true]`
				);
				expect( disabledSaveButton ).not.toBeNull();
			} );

			it( 'Update button enabled after editing post', async () => {
				await page.click( '.editor-post-title' );
				await page.keyboard.type( '...more title!' );

				// Verify update button is enabled.
				const enabledSaveButton = await page.$(
					`${ saveButtonSelector }[aria-disabled=false]`
				);
				expect( enabledSaveButton ).not.toBeNull();

				// Verify is not for multi-entity saving.
				await assertMultiSaveDisabled();
			} );

			it( 'Multi-save button triggered after editing template part.', async () => {
				await page.click( templatePartSelector );
				await page.keyboard.type( '...some more words...' );
				await page.keyboard.press( 'Enter' );
				await assertMultiSaveEnabled();
			} );
		} );
	} );

	describe( 'Site Editor', () => {
		async function assertSaveDisabled() {
			const disabledButton = await page.waitForSelector(
				`${ saveSiteSelector }[aria-disabled=true]`
			);
			expect( disabledButton ).not.toBeNull();
		}
		const activeButtonSelector = `${ saveSiteSelector }[aria-disabled=false]`;

		it( 'Save button should be disabled by default', async () => {
			// Navigate to site editor.
			const query = addQueryArgs( '', {
				page: 'gutenberg-edit-site',
			} ).slice( 1 );
			await visitAdminPage( 'admin.php', query );

			await assertSaveDisabled();
		} );

		it( 'Should be enabled after edits', async () => {
			await page.click( templatePartSelector );
			await page.keyboard.type( 'some words...' );
			const enabledButton = await page.waitForSelector(
				activeButtonSelector
			);
			expect( enabledButton ).not.toBeNull();
		} );

		it( 'Clicking button should open modal with boxes checked', async () => {
			await page.click( activeButtonSelector );
			const checkedBoxes = await page.$$( checkboxSelector );
			expect( checkedBoxes ).not.toHaveLength( 0 );
		} );

		it( 'Saving should result in items being saved', async () => {
			await page.click( entitiesSaveSelector );
			await assertSaveDisabled();
		} );
	} );
} );
