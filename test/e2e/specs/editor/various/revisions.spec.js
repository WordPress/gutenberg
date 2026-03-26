/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Post revisions', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should restore an older revision', async ( { editor, page } ) => {
		// Add title and original content.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Revisions Test' );

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Original content' );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Edit the paragraph to new content.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' - Updated content' );

		// Save draft again to create second revision.
		await editor.saveDraft();

		// Open the post settings sidebar and click the Revisions button.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Ensure Post tab is selected in sidebar.
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();

		// Click the Revisions button (the button shows the revision count "2").
		await settingsSidebar.getByRole( 'button', { name: '2' } ).click();

		// Wait for the revisions mode to be active (Restore button appears).
		const restoreButton = page.getByRole( 'button', { name: 'Restore' } );
		await expect( restoreButton ).toBeVisible();

		// Verify the current (updated) content is displayed in revisions preview.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Original content - Updated content' );

		// Use the slider to navigate to the oldest revision.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Verify the original content is now displayed in revisions preview.
		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Paragraph' } )
		).toHaveText( 'Original content' );

		// Click the Restore button.
		await restoreButton.click();

		// Verify the success notice.
		await expect(
			page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Restored to revision' } )
		).toBeVisible();

		// Verify the original content is restored.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Original content' },
			},
		] );
	} );

	test( 'should preserve block clientId when sliding between revisions', async ( {
		editor,
		page,
	} ) => {
		// Add a heading.
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Test Heading' },
		} );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Add a paragraph at the start (before the heading).
		await page.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'New paragraph',
			} );
			window.wp.data
				.dispatch( 'core/block-editor' )
				.insertBlock( block, 0 );
		} );

		// Verify blocks are correctly configured.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'New paragraph' },
			},
			{
				name: 'core/heading',
				attributes: { content: 'Test Heading' },
			},
		] );

		// Save draft again to create second revision.
		await editor.saveDraft();

		// Open the post settings sidebar and click the Revisions button.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		// Wait for the revisions mode to be active.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Get the heading block's clientId before sliding.
		const headingBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const clientIdBefore = await headingBlock.getAttribute( 'data-block' );

		// Use the slider to navigate to the oldest revision.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Verify the heading's clientId is preserved (prevents flashing).
		const clientIdAfter = await headingBlock.getAttribute( 'data-block' );
		expect( clientIdAfter ).toBe( clientIdBefore );
	} );

	// Regression test for https://github.com/WordPress/gutenberg/issues/75926
	// Global wp.data.select() calls should see blocks in revisions mode.
	test( 'should expose blocks to global selectors in revisions mode', async ( {
		editor,
		page,
	} ) => {
		// Register a test block that renders its parent block name
		// using the global wp.data.select() (not useSelect).
		await page.evaluate( () => {
			window.wp.blocks.registerBlockType( 'test/selectors-in-revisions', {
				apiVersion: 3,
				title: 'Test Selectors in Revisions',
				edit: function Edit( { clientId } ) {
					const [ parentName, setParentName ] =
						window.wp.element.useState( 'none' );
					window.wp.element.useEffect( () => {
						const parents = window.wp.data
							.select( 'core/block-editor' )
							.getBlockParentsByBlockName(
								clientId,
								'core/group'
							);
						setParentName(
							parents.length > 0
								? 'has-group-parent'
								: 'no-group-parent'
						);
					}, [ clientId ] );
					return window.wp.element.createElement(
						'p',
						window.wp.blockEditor.useBlockProps(),
						parentName
					);
				},
				save: () => null,
			} );
		} );

		// Insert a group with the test block inside.
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [ { name: 'test/selectors-in-revisions' } ],
		} );

		// Save draft to create first revision.
		await editor.saveDraft();

		// Add a paragraph after the group to create a second revision.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Extra paragraph' },
		} );
		await editor.saveDraft();

		// Enter revisions mode.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', { name: '2', exact: true } )
			.click();

		// Wait for revisions mode.
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// The test block should see its group parent via global select().
		await expect(
			editor.canvas.locator( '[data-type="test/selectors-in-revisions"]' )
		).toHaveText( 'has-group-parent' );
	} );
} );

test.describe( 'Template and template part revisions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	[
		{
			postType: 'wp_template',
			postId: 'emptytheme//index',
			tabName: 'Template',
		},
		{
			postType: 'wp_template_part',
			postId: 'emptytheme//header',
			tabName: 'Template Part',
		},
	].forEach( ( { postType, postId, tabName } ) => {
		test( `should restore an older ${ postType } revision`, async ( {
			admin,
			editor,
			page,
		} ) => {
			await admin.visitSiteEditor( {
				postId,
				postType,
				canvas: 'edit',
			} );

			await editor.setContent( '' );

			// Template and template part revisions work differently from
			// post revisions: the first save writes directly to the database
			// without creating a revision, so a revision is only created from
			// the second save onwards. The revisions button requires at least
			// two revisions, which means three saves are needed here.
			for ( const content of [
				'First paragraph',
				'Second paragraph',
				'Third paragraph',
			] ) {
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content },
				} );
				await editor.saveSiteEditorEntities( {
					isOnlyCurrentEntityDirty: true,
				} );
				const saveButton = page
					.getByRole( 'region', { name: 'Editor top bar' } )
					.getByRole( 'button', { name: 'Save' } );
				await expect( saveButton ).toBeDisabled();
				await page
					.getByRole( 'button', { name: 'Dismiss this notice' } )
					.click();
				// WordPress stores revision timestamps at second precision.
				// Wait to ensure each save gets a unique timestamp so revisions
				// are ordered deterministically.
				// eslint-disable-next-line no-restricted-syntax, playwright/no-wait-for-timeout
				await page.waitForTimeout( 1000 );
			}

			// Open the post settings sidebar and click the Revisions button.
			await editor.openDocumentSettingsSidebar();
			const settingsSidebar = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await settingsSidebar.getByRole( 'tab', { name: tabName } ).click();

			// Click the Revisions button.
			await settingsSidebar.getByRole( 'button', { name: '2' } ).click();

			// Wait for the revisions mode to be active.
			const restoreButton = page.getByRole( 'button', {
				name: 'Restore',
			} );
			await expect( restoreButton ).toBeVisible();

			// Use the slider to navigate to the oldest revision.
			const slider = page.getByRole( 'slider', { name: 'Revision' } );
			await slider.focus();
			await page.keyboard.press( 'Home' );

			// Wait for the revision content to update before restoring.
			// The oldest revision contains two paragraph blocks
			// ("First" and "Second"), while the latest has three.
			await expect(
				editor.canvas.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
			).toHaveCount( 2 );

			// Restore the oldest revision.
			await restoreButton.click();

			// Verify the success notice.
			const notice = page
				.getByRole( 'button', { name: 'Dismiss this notice' } )
				.filter( { hasText: 'Restored to revision' } );
			await expect( notice ).toBeVisible();
			await expect( notice ).not.toHaveText( /Invalid Date/ );

			// Verify the restored content.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'First paragraph' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second paragraph' },
				},
			] );
		} );
	} );
} );
