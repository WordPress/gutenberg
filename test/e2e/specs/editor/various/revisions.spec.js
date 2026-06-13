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
		await settingsSidebar
			.getByRole( 'button', {
				name: 'Open revisions screen: 2 revisions',
			} )
			.click();

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
			.getByRole( 'button', {
				name: 'Open revisions screen: 2 revisions',
				exact: true,
			} )
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
		await expect( headingBlock ).toHaveAttribute(
			'data-block',
			clientIdBefore
		);
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
			.getByRole( 'button', {
				name: 'Open revisions screen: 2 revisions',
				exact: true,
			} )
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

	test( 'should not show warning for post title block in revisions', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/post-title' } );
		await editor.saveDraft();

		// Add a paragraph to create a second revision.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Some content' },
		} );
		await editor.saveDraft();

		// Enter revisions mode.
		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();
		await settingsSidebar
			.getByRole( 'button', {
				name: 'Open revisions screen: 2 revisions',
				exact: true,
			} )
			.click();
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		const titleBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Title',
		} );
		await expect( titleBlock ).toBeVisible();
		await expect( titleBlock ).not.toHaveClass( /has-warning/ );
	} );
} );

test.describe( 'Post revisions with classic meta boxes', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin( 'gutenberg-test-plugin-meta-box' );
	} );

	test( 'falls back to the classic revisions screen', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Revisions with meta box' );
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Original content' );
		await editor.saveDraft();

		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' - Updated content' );
		await editor.saveDraft();

		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();

		// With classic meta boxes the Revisions control is rendered as a
		// link to the classic admin screen, not a button that opens the
		// in-editor visual revisions mode.
		const revisionsLink = settingsSidebar.getByRole( 'link', {
			name: 'Open revisions screen: 2 revisions',
		} );
		await expect( revisionsLink ).toBeVisible();
		await expect( revisionsLink ).toHaveAttribute(
			'href',
			/revision\.php\?revision=\d+/
		);

		// The inline DataViews revisions panel is hidden (its PanelBody
		// toggle would be the only element with accessible name exactly
		// "Revisions"; substring matches like the slug field aria-label
		// are excluded with exact: true).
		await expect(
			settingsSidebar.getByRole( 'button', {
				name: 'Revisions',
				exact: true,
			} )
		).toHaveCount( 0 );
	} );
} );

test.describe( 'Post revisions slider pagination', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'should paginate, navigate pages, and diff across page boundaries', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Create a post and update it enough times to require pagination.
		// Page 1 holds the newest 100 revisions, so > 100 total → 2 pages.
		const post = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/posts',
			data: {
				title: 'Pagination Test',
				content: '<!-- wp:paragraph --><p>0</p><!-- /wp:paragraph -->',
				status: 'draft',
			},
		} );

		// Sequential REST calls to enforce ordering (concurrent writes to
		// the same post race and produce non-monotonic revision content).
		for ( let i = 1; i <= 105; i++ ) {
			await requestUtils.rest( {
				method: 'POST',
				path: `/wp/v2/posts/${ post.id }`,
				data: {
					content: `<!-- wp:paragraph --><p>${ i }</p><!-- /wp:paragraph -->`,
				},
			} );
		}

		await admin.editPost( post.id );

		await editor.openDocumentSettingsSidebar();
		const settingsSidebar = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settingsSidebar.getByRole( 'tab', { name: 'Post' } ).click();

		// The revisions button is labeled with the count. The editor count
		// may differ from the REST version-history count by an autosave,
		// so read it from the rendered button.
		const revisionsButton = settingsSidebar
			.getByRole( 'button' )
			.filter( { hasText: /^\d+$/ } );
		await expect( revisionsButton ).toBeVisible();
		const totalRevisions = parseInt(
			await revisionsButton.textContent(),
			10
		);
		const olderPageSize = totalRevisions - 100;

		await revisionsButton.click();
		await expect(
			page.getByRole( 'button', { name: 'Restore' } )
		).toBeVisible();

		// Page 1 holds the newest 100 revisions. The prev chevron points
		// at page 2, which holds the remaining older revisions.
		const prevPageButton = page.getByRole( 'button', {
			name: `Revisions 1–${ olderPageSize }`,
		} );
		const nextPageButton = page.getByRole( 'button', {
			name: 'No newer revisions',
		} );
		await expect( prevPageButton ).toBeEnabled();
		await expect( nextPageButton ).toBeDisabled();

		// Page 1 holds 100 revisions, so the slider's max is 99.
		const slider = page.getByRole( 'slider', { name: 'Revision' } );
		await expect( slider ).toHaveAttribute( 'max', '99' );

		// Slide to the leftmost (oldest revision on page 1). Computing the
		// previous-revision diff requires fetching the adjacent page.
		await slider.focus();
		await page.keyboard.press( 'Home' );

		// Adjacent revision contents differ by exactly 1 (we created them
		// as sequential integers), so the boundary diff must show N as
		// added and N-1 as removed inside a modified paragraph.
		const canvas = page
			.locator( 'iframe[name="editor-canvas"]' )
			.contentFrame()
			.locator( '.is-revision-modified' );
		await expect( canvas ).toBeVisible();
		const added = parseInt(
			await canvas.locator( '.revision-diff-added' ).textContent(),
			10
		);
		const removed = parseInt(
			await canvas.locator( '.revision-diff-removed' ).textContent(),
			10
		);
		expect( added - removed ).toBe( 1 );

		// Navigate to page 2 via the chevron.
		await prevPageButton.click();

		// After loading page 2: prev chevron disabled, next chevron enabled.
		await expect(
			page.getByRole( 'button', { name: 'No older revisions' } )
		).toBeDisabled();
		await expect(
			page.getByRole( 'button', {
				name: `Revisions ${ olderPageSize + 1 }–${ totalRevisions }`,
			} )
		).toBeEnabled();

		// Slider now reflects page 2's smaller revision count.
		await expect( slider ).toHaveAttribute(
			'max',
			String( olderPageSize - 1 )
		);
	} );
} );

test.describe( 'Template and template part revisions', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
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
			await settingsSidebar
				.getByRole( 'button', {
					name: 'Open revisions screen: 2 revisions',
				} )
				.click();

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
