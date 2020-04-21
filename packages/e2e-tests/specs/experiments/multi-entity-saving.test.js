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
import { trashExistingPosts } from '../../config/setup-test-framework';

describe( 'Multi-entity save flow', () => {
	// Selectors.
	const checkedBoxSelector = '.components-checkbox-control__checked';
	const checkboxInputSelector = '.components-checkbox-control__input';
	const demoTemplateSelector = '//button[contains(., "front-page")]';
	const draftSavedSelector = '.editor-post-saved-state.is-saved';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const multiSaveSelector =
		'.editor-post-publish-button__button.has-changes-dot';
	const savePostSelector = '.editor-post-publish-button__button';
	const disabledSavePostSelector = `${ savePostSelector }[aria-disabled=true]`;
	const enabledSavePostSelector = `${ savePostSelector }[aria-disabled=false]`;
	const saveSiteSelector = '.edit-site-save-button__button';
	const activeSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=false]`;
	const disabledSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=true]`;
	const templateDropdownSelector =
		'.components-dropdown-menu__toggle[aria-label="Switch Template"]';
	const templatePartSelector = '*[data-type="core/template-part"]';
	const activatedTemplatePartSelector = `${ templatePartSelector } .block-editor-inner-blocks`;

	// Reusable assertions across Post/Site editors.
	const assertAllBoxesChecked = async () => {
		const checkedBoxes = await page.$$( checkedBoxSelector );
		const checkboxInputs = await page.$$( checkboxInputSelector );
		expect( checkedBoxes.length - checkboxInputs.length ).toBe( 0 );
	};
	// Setup & Teardown.
	const requiredExperiments = [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	];
	beforeAll( async () => {
		await enableExperimentalFeatures( requiredExperiments );
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );
	afterAll( async () => {
		await disableExperimentalFeatures( requiredExperiments );
	} );

	describe( 'Post Editor', () => {
		// Reusable assertions inside Post editor.
		const assertMultiSaveEnabled = async () => {
			const multiSaveButton = await page.waitForSelector(
				multiSaveSelector
			);
			expect( multiSaveButton ).not.toBeNull();
		};
		const assertMultiSaveDisabled = async () => {
			const multiSaveButton = await page.$( multiSaveSelector );
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
				await page.waitForSelector( activatedTemplatePartSelector );
				await page.click( templatePartSelector );
				await page.keyboard.type( 'some words...' );

				await assertMultiSaveEnabled();
			} );

			it( 'Clicking should open modal with boxes checked by default', async () => {
				await page.click( savePostSelector );
				await assertAllBoxesChecked();
			} );

			it( 'Saving should result in items being saved', async () => {
				await page.click( entitiesSaveSelector );

				// Verify post is saved.
				const draftSaved = await page.waitForSelector(
					draftSavedSelector
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
					disabledSavePostSelector
				);
				expect( disabledSaveButton ).not.toBeNull();
			} );

			it( 'Update button enabled after editing post', async () => {
				await page.click( '.editor-post-title' );
				await page.keyboard.type( '...more title!' );

				// Verify update button is enabled.
				const enabledSaveButton = await page.$(
					enabledSavePostSelector
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
		it( 'Should be enabled after edits', async () => {
			// Navigate to site editor.
			const query = addQueryArgs( '', {
				page: 'gutenberg-edit-site',
			} ).slice( 1 );
			await visitAdminPage( 'admin.php', query );

			// Ensure we are on 'front-page' demo template.
			await page.click( templateDropdownSelector );
			const [ demoTemplateButton ] = await page.$x(
				demoTemplateSelector
			);
			await demoTemplateButton.click();

			// Insert a new template part placeholder.
			await insertBlock( 'Template Part' );

			const enabledButton = await page.waitForSelector(
				activeSaveSiteSelector
			);
			expect( console ).toHaveWarnedWith(
				'useApiFetch is deprecated and will be removed from Gutenberg in version 8.1.0. Please use apiFetch instead.'
			);
			expect( enabledButton ).not.toBeNull();
		} );

		it( 'Clicking button should open modal with boxes checked', async () => {
			await page.click( activeSaveSiteSelector );
			await assertAllBoxesChecked();
		} );

		it( 'Saving should result in items being saved', async () => {
			await page.click( entitiesSaveSelector );
			const disabledButton = await page.waitForSelector(
				disabledSaveSiteSelector
			);
			expect( disabledButton ).not.toBeNull();
		} );
	} );
} );
