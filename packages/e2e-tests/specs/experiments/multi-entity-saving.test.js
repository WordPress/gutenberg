/**
 * WordPress dependencies
 */
import {
	createNewPost,
	insertBlock,
	publishPost,
	visitAdminPage,
} from '@wordpress/e2e-test-utils';
import { addQueryArgs } from '@wordpress/url';

/**
 * Internal dependencies
 */
import { useExperimentalFeatures } from '../../experimental-features';
import { trashExistingPosts } from '../../config/setup-test-framework';

describe( 'Multi-entity save flow', () => {
	// Selectors - usable between Post/Site editors.
	const checkedBoxSelector = '.components-checkbox-control__checked';
	const checkboxInputSelector = '.components-checkbox-control__input';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const templatePartSelector = '*[data-type="core/template-part"]';
	const activatedTemplatePartSelector = `${ templatePartSelector } .block-editor-inner-blocks`;
	const savePanelSelector = '.entities-saved-states__panel';
	const closePanelButtonSelector = 'button[aria-label="Close panel"]';

	// Reusable assertions across Post/Site editors.
	const assertAllBoxesChecked = async () => {
		// Expand to view savable entities if necessary.
		const reviewChangesButton = await page.$(
			'.entities-saved-states__review-changes-button'
		);
		const [ needsToOpen ] = await reviewChangesButton.$x(
			'//*[contains(text(),"Review changes.")]'
		);
		if ( needsToOpen ) {
			await reviewChangesButton.click();
		}

		const checkedBoxes = await page.$$( checkedBoxSelector );
		const checkboxInputs = await page.$$( checkboxInputSelector );
		expect( checkedBoxes.length - checkboxInputs.length ).toBe( 0 );
	};
	const assertExistance = async ( selector, shouldBePresent ) => {
		const element = await page.$( selector );
		if ( shouldBePresent ) {
			expect( element ).not.toBeNull();
		} else {
			expect( element ).toBeNull();
		}
	};

	useExperimentalFeatures( [
		'#gutenberg-full-site-editing',
		'#gutenberg-full-site-editing-demo',
	] );

	beforeAll( async () => {
		await trashExistingPosts( 'wp_template' );
		await trashExistingPosts( 'wp_template_part' );
	} );

	describe( 'Post Editor', () => {
		// Selectors - Post editor specific.
		const draftSavedSelector = '.editor-post-saved-state.is-saved';
		const multiSaveSelector =
			'.editor-post-publish-button__button.has-changes-dot';
		const savePostSelector = '.editor-post-publish-button__button';
		const disabledSavePostSelector = `${ savePostSelector }[aria-disabled=true]`;
		const enabledSavePostSelector = `${ savePostSelector }[aria-disabled=false]`;
		const publishA11ySelector =
			'.edit-post-layout__toggle-publish-panel-button';
		const saveA11ySelector =
			'.edit-post-layout__toggle-entities-saved-states-panel-button';
		const publishPanelSelector = '.editor-post-publish-panel';

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
				// Edit the page some.
				await page.click( '.editor-post-title' );
				await page.keyboard.type( 'Test Post...' );
				await page.keyboard.press( 'Enter' );

				await assertMultiSaveDisabled();
			} );

			it( 'Should only have publish panel a11y button active with only post edited', async () => {
				await assertExistance( publishA11ySelector, true );
				await assertExistance( saveA11ySelector, false );
				await assertExistance( publishPanelSelector, false );
				await assertExistance( savePanelSelector, false );
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

			it( 'Should only have save panel a11y button active after child entities edited', async () => {
				await assertExistance( publishA11ySelector, false );
				await assertExistance( saveA11ySelector, true );
				await assertExistance( publishPanelSelector, false );
				await assertExistance( savePanelSelector, false );
			} );

			it( 'Clicking should open panel with boxes checked by default', async () => {
				await page.click( savePostSelector );
				await page.waitForSelector( savePanelSelector );
				await assertAllBoxesChecked();
			} );

			it( 'Should not show other panels (or their a11y buttons) while save panel opened', async () => {
				await assertExistance( publishA11ySelector, false );
				await assertExistance( saveA11ySelector, false );
				await assertExistance( publishPanelSelector, false );
			} );

			it( 'Publish panel should open after saving, no other panels (or their a11y buttons) should be present', async () => {
				// Save entities and wait for publish panel.
				await page.click( entitiesSaveSelector );
				await page.waitForSelector( publishPanelSelector );

				await assertExistance( publishA11ySelector, false );
				await assertExistance( saveA11ySelector, false );
				await assertExistance( savePanelSelector, false );

				// Close publish panel.
				await page.click( closePanelButtonSelector );
			} );

			it( 'Saving should result in items being saved', async () => {
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
				await publishPost();
				const disabledSaveButton = await page.$(
					disabledSavePostSelector
				);
				expect( disabledSaveButton ).not.toBeNull();
			} );

			it( 'should not have save a11y button when no changes', async () => {
				await assertExistance( saveA11ySelector, false );
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

			it( 'save a11y button enables after editing template part', async () => {
				await assertExistance( saveA11ySelector, true );
			} );
		} );
	} );

	describe( 'Site Editor', () => {
		// Selectors - Site editor specific.
		const demoTemplateSelector = '//button[contains(., "front-page")]';
		const saveSiteSelector = '.edit-site-save-button__button';
		const activeSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=false]`;
		const disabledSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=true]`;
		const templateDropdownSelector =
			'.components-dropdown-menu__toggle[aria-label="Switch Template"]';
		const saveA11ySelector = '.edit-site-editor__toggle-save-panel-button';

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

			expect( enabledButton ).not.toBeNull();
		} );

		it( 'save a11y button should be present', async () => {
			await assertExistance( saveA11ySelector, true );
		} );

		it( 'Clicking button should open panel with boxes checked', async () => {
			await page.click( activeSaveSiteSelector );
			await page.waitForSelector( savePanelSelector );
			await assertAllBoxesChecked();
		} );

		it( 'save a11y button should not be present with save panel open', async () => {
			await assertExistance( saveA11ySelector, false );
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
