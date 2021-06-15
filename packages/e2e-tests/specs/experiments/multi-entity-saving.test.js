/**
 * WordPress dependencies
 */
import {
	createNewPost,
	disablePrePublishChecks,
	insertBlock,
	publishPost,
	trashAllPosts,
	activateTheme,
	clickButton,
} from '@wordpress/e2e-test-utils';

/**
 * Internal dependencies
 */
import { navigationPanel, siteEditor } from '../../experimental-features';

describe( 'Multi-entity save flow', () => {
	// Selectors - usable between Post/Site editors.
	const checkedBoxSelector = '.components-checkbox-control__checked';
	const checkboxInputSelector = '.components-checkbox-control__input';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const templatePartSelector = '*[data-type="core/template-part"]';
	const activatedTemplatePartSelector = `${ templatePartSelector }.block-editor-block-list__layout`;
	const savePanelSelector = '.entities-saved-states__panel';
	const closePanelButtonSelector =
		'.editor-post-publish-panel__header-cancel-button button';
	const createNewButtonSelector =
		'//button[contains(text(), "New template part")]';

	// Reusable assertions across Post/Site editors.
	const assertAllBoxesChecked = async () => {
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

	beforeAll( async () => {
		await activateTheme( 'tt1-blocks' );
		await trashAllPosts( 'wp_template' );
		await trashAllPosts( 'wp_template_part' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );
	} );

	describe( 'Post Editor', () => {
		// Selectors - Post editor specific.
		const draftSavedSelector = '.editor-post-saved-state.is-saved';
		const multiSaveSelector =
			'.editor-post-publish-button__button.has-changes-dot';
		const savePostSelector = '.editor-post-publish-button__button';
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
			const multiSaveButton = await page.waitForSelector(
				multiSaveSelector,
				{ hidden: true }
			);
			expect( multiSaveButton ).toBeNull();
		};

		it( 'Save flow should work as expected.', async () => {
			await createNewPost();
			// Edit the page some.
			await page.click( '.editor-post-title' );
			await page.keyboard.type( 'Test Post...' );
			await page.keyboard.press( 'Enter' );

			// Should not trigger multi-entity save button with only post edited
			await assertMultiSaveDisabled();

			// Should only have publish panel a11y button active with only post edited.
			await assertExistance( publishA11ySelector, true );
			await assertExistance( saveA11ySelector, false );
			await assertExistance( publishPanelSelector, false );
			await assertExistance( savePanelSelector, false );

			// Add a template part and edit it.
			await insertBlock( 'Template Part' );
			const [ createNewButton ] = await page.$x(
				createNewButtonSelector
			);
			await createNewButton.click();
			await page.waitForSelector( activatedTemplatePartSelector );
			await page.keyboard.press( 'Tab' );
			await page.keyboard.type( 'test-template-part' );
			await page.click( '.block-editor-button-block-appender' );
			await page.click( '.editor-block-list-item-paragraph' );
			await page.keyboard.type( 'some words...' );

			// Should trigger multi-entity save button once template part edited.
			await assertMultiSaveEnabled();

			// Should only have save panel a11y button active after child entities edited.
			await assertExistance( publishA11ySelector, false );
			await assertExistance( saveA11ySelector, true );
			await assertExistance( publishPanelSelector, false );
			await assertExistance( savePanelSelector, false );

			// Opening panel has boxes checked by default.
			await page.click( savePostSelector );
			await page.waitForSelector( savePanelSelector );
			await assertAllBoxesChecked();

			// Should not show other panels (or their a11y buttons) while save panel opened.
			await assertExistance( publishA11ySelector, false );
			await assertExistance( saveA11ySelector, false );
			await assertExistance( publishPanelSelector, false );

			// Publish panel should open after saving.
			await page.click( entitiesSaveSelector );
			await page.waitForSelector( publishPanelSelector );

			// No other panels (or their a11y buttons) should be present with publish panel open.
			await assertExistance( publishA11ySelector, false );
			await assertExistance( saveA11ySelector, false );
			await assertExistance( savePanelSelector, false );

			// Close publish panel.
			await page.click( closePanelButtonSelector );

			// Verify saving is disabled.
			const draftSaved = await page.waitForSelector( draftSavedSelector );
			expect( draftSaved ).not.toBeNull();
			await assertMultiSaveDisabled();
			await assertExistance( saveA11ySelector, false );

			await publishPost();

			// Update the post.
			await page.click( '.editor-post-title' );
			await page.keyboard.type( '...more title!' );

			// Verify update button is enabled.
			const enabledSaveButton = await page.$( enabledSavePostSelector );
			expect( enabledSaveButton ).not.toBeNull();
			// Verify multi-entity saving not enabled.
			await assertMultiSaveDisabled();
			await assertExistance( saveA11ySelector, false );

			// Update template part.
			await page.click( templatePartSelector );
			await page.keyboard.type( '...some more words...' );
			await page.keyboard.press( 'Enter' );

			// Multi-entity saving should be enabled.
			await assertMultiSaveEnabled();
			await assertExistance( saveA11ySelector, true );
		} );

		it( 'Site blocks should save individually', async () => {
			await createNewPost();
			await disablePrePublishChecks();

			await insertBlock( 'Site Title' );
			// Ensure title is retrieved before typing.
			await page.waitForXPath( '//a[contains(text(), "gutenberg")]' );
			await page.keyboard.type( '...' );
			await insertBlock( 'Site Tagline' );
			// Ensure tagline is retrieved before typing.
			await page.waitForXPath(
				'//p[contains(text(), "Just another WordPress site")]'
			);
			await page.keyboard.type( '...' );

			await clickButton( 'Publish' );
			await page.waitForSelector( savePanelSelector );
			let checkboxInputs = await page.$$( checkboxInputSelector );
			expect( checkboxInputs ).toHaveLength( 3 );

			await checkboxInputs[ 1 ].click();
			await page.click( entitiesSaveSelector );

			await clickButton( 'Update…' );
			await page.waitForSelector( savePanelSelector );
			checkboxInputs = await page.$$( checkboxInputSelector );
			expect( checkboxInputs ).toHaveLength( 1 );

			// Reset site entity to default value to not affect other tests.
			await page.evaluate( () => {
				wp.data
					.dispatch( 'core' )
					.editEntityRecord( 'root', 'site', undefined, {
						title: 'gutenberg',
						description: 'Just another WordPress site',
					} );
				wp.data
					.dispatch( 'core' )
					.saveEditedEntityRecord( 'root', 'site', undefined );
			} );
		} );
	} );

	describe( 'Site Editor', () => {
		// Selectors - Site editor specific.
		const saveSiteSelector = '.edit-site-save-button__button';
		const activeSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=false]`;
		const disabledSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=true]`;
		const saveA11ySelector = '.edit-site-editor__toggle-save-panel-button';

		it( 'Save flow should work as expected', async () => {
			// Navigate to site editor.
			await siteEditor.visit();

			// Ensure we are on 'index' template.
			await navigationPanel.open();
			await navigationPanel.backToRoot();
			await navigationPanel.navigate( 'Templates' );
			await navigationPanel.clickItemByText( 'Index' );

			// Select the header template part via list view.
			await page.click( '.edit-site-header-toolbar__list-view-toggle' );
			const headerTemplatePartListViewButton = await page.waitForXPath(
				'//button[contains(@class, "block-editor-block-navigation-block-select-button")][contains(., "Header")]'
			);
			headerTemplatePartListViewButton.click();
			await page.click( 'button[aria-label="Close list view sidebar"]' );

			// Insert something to dirty the editor.
			await insertBlock( 'Paragraph' );

			const enabledButton = await page.waitForSelector(
				activeSaveSiteSelector
			);

			// Should be enabled after edits.
			expect( enabledButton ).not.toBeNull();

			// Save a11y button should be present.
			await assertExistance( saveA11ySelector, true );

			// Clicking button should open panel with boxes checked.
			await page.click( activeSaveSiteSelector );
			await page.waitForSelector( savePanelSelector );
			await assertAllBoxesChecked();

			// Save a11y button should not be present with save panel open.
			await assertExistance( saveA11ySelector, false );

			// Saving should result in items being saved.
			await page.click( entitiesSaveSelector );
			const disabledButton = await page.waitForSelector(
				disabledSaveSiteSelector
			);
			expect( disabledButton ).not.toBeNull();
		} );
	} );
} );
