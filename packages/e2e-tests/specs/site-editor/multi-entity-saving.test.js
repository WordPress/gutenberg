/**
 * WordPress dependencies
 */
import {
	createNewPost,
	disablePrePublishChecks,
	getOption,
	insertBlock,
	publishPost,
	setOption,
	trashAllPosts,
	activateTheme,
	clickButton,
	createReusableBlock,
	visitSiteEditor,
	deleteAllTemplates,
} from '@wordpress/e2e-test-utils';

describe( 'Multi-entity save flow', () => {
	// Selectors - usable between Post/Site editors.
	const checkedBoxSelector = '.components-checkbox-control__checked';
	const checkboxInputSelector = '.components-checkbox-control__input';
	const entitiesSaveSelector = '.editor-entities-saved-states__save-button';
	const savePanelSelector = '.entities-saved-states__panel';
	const closePanelButtonSelector =
		'.editor-post-publish-panel__header-cancel-button button:not(:disabled)';

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

	let originalSiteTitle, originalBlogDescription;

	beforeAll( async () => {
		await activateTheme( 'emptytheme' );
		await deleteAllTemplates( 'wp_template' );
		await deleteAllTemplates( 'wp_template_part' );
		await trashAllPosts( 'wp_block' );

		// Get the current Site Title and Site Tagline, so that we can reset
		// them back to the original values once the test suite has finished.
		originalSiteTitle = await getOption( 'blogname' );
		originalBlogDescription = await getOption( 'blogdescription' );
	} );

	afterAll( async () => {
		await activateTheme( 'twentytwentyone' );

		// Reset the Site Title and Site Tagline back to their original values.
		await setOption( 'blogname', originalSiteTitle );
		await setOption( 'blogdescription', originalBlogDescription );
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
			await page.waitForSelector( '.editor-post-title' );
			await page.click( '.editor-post-title' );
			await page.keyboard.type( 'Test Post...' );
			await page.keyboard.press( 'Enter' );

			// Should not trigger multi-entity save button with only post edited.
			await assertMultiSaveDisabled();

			// Should only have publish panel a11y button active with only post edited.
			await assertExistance( publishA11ySelector, true );
			await assertExistance( saveA11ySelector, false );
			await assertExistance( publishPanelSelector, false );
			await assertExistance( savePanelSelector, false );

			// Add a reusable block and edit it.
			await createReusableBlock( 'Hi!', 'Test' );
			await page.waitForSelector( 'p[data-type="core/paragraph"]' );
			await page.click( 'p[data-type="core/paragraph"]' );
			await page.keyboard.type( 'Oh!' );

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
			const closePanelButton = await page.waitForSelector(
				closePanelButtonSelector
			);
			await closePanelButton.click();

			// Verify saving is disabled.
			const draftSaved = await page.waitForSelector( draftSavedSelector );
			expect( draftSaved ).not.toBeNull();
			await assertMultiSaveDisabled();
			await assertExistance( saveA11ySelector, false );

			await publishPost();
			// Wait for the success notice specifically for the published post.
			// `publishPost()` has a similar check but it only checks for the
			// existence of any snackbars. In this case, there's another "Site updated"
			// notice which will be sufficient for that and thus creating a false-positive.
			await page.waitForXPath(
				'//*[@id="a11y-speak-polite"][contains(text(), "Post published")]'
			);

			// Unselect the blocks to avoid clicking the block toolbar.
			await page.evaluate( () => {
				wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
			} );

			// Update the post.
			await page.click( '.editor-post-title' );
			await page.keyboard.type( '...more title!' );

			// Verify update button is enabled.
			const enabledSaveButton = await page.waitForSelector(
				enabledSavePostSelector
			);
			expect( enabledSaveButton ).not.toBeNull();
			// Verify multi-entity saving not enabled.
			await assertMultiSaveDisabled();
			await assertExistance( saveA11ySelector, false );

			// Update reusable block again.
			await page.click( 'p[data-type="core/paragraph"]' );
			// We need to click again due to the clickthrough overlays in reusable blocks.
			await page.click( 'p[data-type="core/paragraph"]' );
			await page.keyboard.type( 'R!' );

			// Multi-entity saving should be enabled.
			await assertMultiSaveEnabled();
			await assertExistance( saveA11ySelector, true );
		} );

		it( 'Site blocks should save individually', async () => {
			await createNewPost();
			await disablePrePublishChecks();

			await insertBlock( 'Site Title' );
			// Ensure title is retrieved before typing.
			await page.waitForXPath(
				`//a[contains(text(), "${ originalSiteTitle }")]`
			);
			const editableSiteTitleSelector =
				'.wp-block-site-title a[contenteditable="true"]';
			await page.waitForSelector( editableSiteTitleSelector );
			await page.focus( editableSiteTitleSelector );
			await page.keyboard.type( '...' );

			await insertBlock( 'Site Tagline' );
			// Ensure tagline is retrieved before typing.
			await page.waitForXPath(
				'//p[contains(text(), "Just another WordPress site")]'
			);
			const editableSiteTagLineSelector =
				'.wp-block-site-tagline[contenteditable="true"]';
			await page.waitForSelector( editableSiteTagLineSelector );
			await page.focus( editableSiteTagLineSelector );
			await page.keyboard.type( '...' );

			await clickButton( 'Publish' );
			await page.waitForSelector( savePanelSelector );
			let checkboxInputs = await page.$$( checkboxInputSelector );
			expect( checkboxInputs ).toHaveLength( 3 );

			await checkboxInputs[ 1 ].click();
			await page.click( entitiesSaveSelector );

			// Wait for the snackbar notice that the post has been published.
			await page.waitForSelector( '.components-snackbar' );

			await clickButton( 'Update…' );
			await page.waitForSelector( savePanelSelector );

			await page.waitForSelector( checkboxInputSelector );
			checkboxInputs = await page.$$( checkboxInputSelector );

			expect( checkboxInputs ).toHaveLength( 1 );
		} );
	} );

	describe( 'Site Editor', () => {
		// Selectors - Site editor specific.
		const saveSiteSelector = '.edit-site-save-button__button';
		const activeSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=false]`;
		const disabledSaveSiteSelector = `${ saveSiteSelector }[aria-disabled=true]`;
		const saveA11ySelector = '.edit-site-editor__toggle-save-panel-button';

		const saveAllChanges = async () => {
			// Clicking button should open panel with boxes checked.
			await page.click( activeSaveSiteSelector );
			await page.waitForSelector( savePanelSelector );
			await assertAllBoxesChecked();

			// Save a11y button should not be present with save panel open.
			await assertExistance( saveA11ySelector, false );

			// Saving should result in items being saved.
			await page.click( entitiesSaveSelector );
		};

		it( 'Save flow should work as expected', async () => {
			// Navigate to site editor.
			await visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
			} );

			// Select the header template part via list view.
			await page.click( '.edit-site-header-toolbar__list-view-toggle' );
			const headerTemplatePartListViewButton = await page.waitForXPath(
				'//a[contains(@class, "block-editor-list-view-block-select-button")][contains(., "header")]'
			);
			headerTemplatePartListViewButton.click();
			await page.click( 'button[aria-label="Close List View Sidebar"]' );

			// Insert something to dirty the editor.
			await insertBlock( 'Paragraph' );

			const enabledButton = await page.waitForSelector(
				activeSaveSiteSelector
			);

			// Should be enabled after edits.
			expect( enabledButton ).not.toBeNull();

			// Save a11y button should be present.
			await assertExistance( saveA11ySelector, true );

			// Save all changes.
			await saveAllChanges();

			const disabledButton = await page.waitForSelector(
				disabledSaveSiteSelector
			);
			expect( disabledButton ).not.toBeNull();
		} );

		it( 'Save flow should allow re-saving after changing the same block attribute', async () => {
			// Navigate to site editor.
			await visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
			} );

			// Insert a paragraph at the bottom.
			await insertBlock( 'Paragraph' );

			// Open the block settings.
			await page.click( 'button[aria-label="Settings"]' );

			// Change the font size
			await page.click(
				'.components-font-size-picker__controls button[aria-label="Small"]'
			);

			// Save all changes.
			await saveAllChanges();

			// Change the font size
			await page.click(
				'.components-font-size-picker__controls button[aria-label="Medium"]'
			);

			// Assert that the save button has been re-enabled.
			const saveButton = await page.waitForSelector(
				activeSaveSiteSelector
			);
			expect( saveButton ).not.toBeNull();
		} );
	} );
} );
