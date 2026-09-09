const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	postContentFocusMode: async ( { editor, page }, use ) => {
		await use( new PostContentFocusMode( { editor, page } ) );
	},
} );

// Post content focus mode (aka the 'Show template' option when editing a post or page).
test.describe( 'Post Content focus mode', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		// "Show template" persists the rendering mode in user preferences.
		// Reset before each test so it starts in post-only mode regardless
		// of state leaked from previous tests or test files in the shard.
		await requestUtils.resetPreferences();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
		await requestUtils.resetPreferences();
	} );

	test( 'inserts blocks into Post Content from different selection states', async ( {
		admin,
		editor,
		page,
		postContentFocusMode,
	} ) => {
		await admin.createNewPost();

		// Add initial content.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Initial paragraph' },
		} );

		await postContentFocusMode.enableShowTemplate();

		await test.step( 'No selection: inserts at end of Post Content', async () => {
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.clearSelectedBlock();
			} );

			await postContentFocusMode.insertBlockViaGlobalInserter(
				'Heading'
			);

			expect(
				await postContentFocusMode.getPostContentInnerBlockNames()
			).toEqual( [ 'core/paragraph', 'core/heading' ] );
		} );

		await test.step( 'Post Content selected: inserts at end of Post Content', async () => {
			const postContent = editor.canvas.getByRole( 'document', {
				name: 'Block: Content',
				exact: true,
			} );
			await editor.selectBlocks( postContent );

			await postContentFocusMode.insertBlockViaGlobalInserter(
				'Heading'
			);

			expect(
				await postContentFocusMode.getPostContentInnerBlockNames()
			).toEqual( [ 'core/paragraph', 'core/heading', 'core/heading' ] );
		} );

		await test.step( 'Post content inner block selected: inserts after selected block', async () => {
			// Select the first paragraph.
			const paragraph = editor.canvas.getByText( 'Initial paragraph' );
			await editor.selectBlocks( paragraph );

			await postContentFocusMode.insertBlockViaGlobalInserter(
				'Heading'
			);

			// The new heading is inserted after the selected paragraph.
			expect(
				await postContentFocusMode.getPostContentInnerBlockNames()
			).toEqual( [
				'core/paragraph',
				'core/heading',
				'core/heading',
				'core/heading',
			] );
		} );
	} );

	// Post Content is an inner block controller, so an undo that moves the
	// caret between two of its blocks crosses the same controlled container.
	// See https://github.com/WordPress/gutenberg/pull/82706.
	test( 'undo moves the caret between blocks of the same Post Content', async ( {
		admin,
		editor,
		page,
		pageUtils,
		postContentFocusMode,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await postContentFocusMode.enableShowTemplate();

		const postContentText = () =>
			page.evaluate( () => {
				const { getBlocksByName, getBlockOrder, getBlockAttributes } =
					window.wp.data.select( 'core/block-editor' );
				const [ postContent ] = getBlocksByName( 'core/post-content' );
				return getBlockOrder( postContent ).map( ( clientId ) =>
					getBlockAttributes( clientId )?.content?.toString?.()
				);
			} );

		// Edit the first block, then the second, leaving the caret in the
		// second.
		await editor.selectBlocks( editor.canvas.getByText( 'First' ) );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '-a' );
		await expect.poll( postContentText ).toEqual( [ 'First-a', 'Second' ] );

		await editor.selectBlocks( editor.canvas.getByText( 'Second' ) );
		await page.keyboard.press( 'End' );
		await page.keyboard.type( '-b' );
		await expect
			.poll( postContentText )
			.toEqual( [ 'First-a', 'Second-b' ] );

		// Typing coalesces into undo levels on a timer, so the number of
		// levels the two edits produce is not fixed. Undo until the first
		// block's edit is gone rather than assuming a count.
		let reverted = false;
		for ( let i = 0; i < 8 && ! reverted; i++ ) {
			await pageUtils.pressKeys( 'primary+z' );
			try {
				await expect
					.poll( postContentText, { timeout: 1000 } )
					.toEqual( [ 'First', 'Second' ] );
				reverted = true;
			} catch {
				// Not there yet; undo again.
			}
		}
		expect( reverted ).toBe( true );

		// The caret was in the second block and has to follow the undo to
		// the first one.
		const selected = await page.evaluate( () => {
			const { getSelectedBlockClientId, getBlockAttributes } =
				window.wp.data.select( 'core/block-editor' );
			const clientId = getSelectedBlockClientId();
			return clientId
				? getBlockAttributes( clientId )?.content?.toString?.()
				: null;
		} );
		expect( selected ).toBe( 'First' );
	} );

	// Check for regressions of https://github.com/WordPress/gutenberg/issues/76101.
	test.describe( 'post content inside a template part', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			// Create a template part that contains post-title and post-content.
			await requestUtils.createTemplate( 'wp_template_part', {
				slug: 'content-area',
				title: 'Content Area',
				content: [
					'<!-- wp:post-title /-->',
					'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
				].join( '\n' ),
			} );

			// Override the singular template so post-content is inside a template part.
			await requestUtils.createTemplate( 'wp_template', {
				slug: 'singular',
				title: 'Singular',
				content: [
					'<!-- wp:template-part {"slug":"header","tagName":"header","theme":"emptytheme"} /-->',
					'<!-- wp:template-part {"slug":"content-area","theme":"emptytheme"} /-->',
				].join( '\n' ),
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllTemplates( 'wp_template' );
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
		} );

		test( 'post title and content are editable and blocks can be inserted', async ( {
			admin,
			editor,
			page,
			postContentFocusMode,
		} ) => {
			await admin.createNewPost();

			// Add some initial content.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Initial content' },
			} );

			await postContentFocusMode.enableShowTemplate();

			await test.step( 'Post title is editable', async () => {
				const postTitle = editor.canvas.getByRole( 'document', {
					name: 'Block: Title',
				} );
				await expect( postTitle ).toBeVisible();
				await expect( postTitle ).not.toHaveAttribute(
					'inert',
					'true'
				);
				// Use selectBlocks to avoid toolbar interception issues.
				await editor.selectBlocks( postTitle );
				await page.keyboard.type( 'Test Post Title' );
			} );

			await test.step( 'Paragraph and Group blocks are available in the inserter', async () => {
				// Select the paragraph inside post content so the inserter
				// shows blocks available in that context.
				const paragraph = editor.canvas.getByText( 'Initial content' );
				await editor.selectBlocks( paragraph );

				// Open the global block inserter.
				await page
					.getByRole( 'button', {
						name: 'Block Inserter',
						exact: true,
					} )
					.click();

				const inserterPanel = page.getByRole( 'region', {
					name: 'Block Library',
				} );
				const searchBox = inserterPanel.getByRole( 'searchbox', {
					name: 'Search',
				} );

				// Search for Paragraph block (content block).
				await searchBox.fill( 'Paragraph' );
				await expect(
					inserterPanel
						.getByRole( 'tabpanel', { name: 'Blocks' } )
						.getByRole( 'option', {
							name: 'Paragraph',
							exact: true,
						} )
				).toBeVisible();

				// Search for Group block (non-content block, allowed
				// because post-content is the section root).
				await searchBox.fill( 'Group' );
				await expect(
					inserterPanel
						.getByRole( 'tabpanel', { name: 'Blocks' } )
						.getByRole( 'option', { name: 'Group' } )
				).toBeVisible();

				// Close the inserter.
				await page
					.getByRole( 'button', {
						name: 'Block Inserter',
						exact: true,
					} )
					.click();
			} );
		} );

		test( 'template part blocks outside post content are not editable', async ( {
			admin,
			editor,
			postContentFocusMode,
		} ) => {
			await admin.createNewPost();
			await postContentFocusMode.enableShowTemplate();

			// The header template part contains a site-title block.
			const headerTemplatePart = editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} );
			await expect( headerTemplatePart ).toBeVisible();

			// The site-title block inside the header should be inert.
			const siteTitle = headerTemplatePart.getByRole( 'document', {
				name: 'Block: Site Title',
			} );
			await expect( siteTitle ).toHaveAttribute( 'inert' );
		} );

		test( 'inserts blocks into Post Content from different selection states', async ( {
			admin,
			editor,
			page,
			postContentFocusMode,
		} ) => {
			await admin.createNewPost();

			// Add initial content.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Initial paragraph' },
			} );

			await postContentFocusMode.enableShowTemplate();

			// The template part's direct children should remain unchanged
			// throughout all steps (post-title and post-content only).
			const expectedTemplatePart = [
				'core/post-title',
				'core/post-content',
			];

			await test.step( 'No selection: inserts at end of Post Content', async () => {
				await page.evaluate( () => {
					window.wp.data
						.dispatch( 'core/block-editor' )
						.clearSelectedBlock();
				} );

				await postContentFocusMode.insertBlockViaGlobalInserter(
					'Heading'
				);

				expect(
					await postContentFocusMode.getPostContentInnerBlockNames()
				).toEqual( [ 'core/paragraph', 'core/heading' ] );
				expect(
					await postContentFocusMode.getTemplatePartInnerBlockNames()
				).toEqual( expectedTemplatePart );
			} );

			await test.step( 'Template part selected: inserts into Post Content', async () => {
				// Select the template part that contains Post Content.
				await page.evaluate( () => {
					const { select, dispatch } = window.wp.data;
					const { getBlocksByName, getBlockRootClientId } =
						select( 'core/block-editor' );
					const [ postContentId ] =
						getBlocksByName( 'core/post-content' );
					const templatePartId =
						getBlockRootClientId( postContentId );
					dispatch( 'core/block-editor' ).selectBlock(
						templatePartId
					);
				} );

				await postContentFocusMode.insertBlockViaGlobalInserter(
					'Heading'
				);

				expect(
					await postContentFocusMode.getPostContentInnerBlockNames()
				).toEqual( [
					'core/paragraph',
					'core/heading',
					'core/heading',
				] );
				expect(
					await postContentFocusMode.getTemplatePartInnerBlockNames()
				).toEqual( expectedTemplatePart );
			} );

			await test.step( 'Post Content selected: inserts at end of Post Content', async () => {
				const postContent = editor.canvas.getByRole( 'document', {
					name: 'Block: Content',
					exact: true,
				} );
				await editor.selectBlocks( postContent );

				await postContentFocusMode.insertBlockViaGlobalInserter(
					'Heading'
				);

				expect(
					await postContentFocusMode.getPostContentInnerBlockNames()
				).toEqual( [
					'core/paragraph',
					'core/heading',
					'core/heading',
					'core/heading',
				] );
				expect(
					await postContentFocusMode.getTemplatePartInnerBlockNames()
				).toEqual( expectedTemplatePart );
			} );

			await test.step( 'Post content inner block selected: inserts after selected block', async () => {
				// Select the first paragraph (the initial content).
				const paragraph =
					editor.canvas.getByText( 'Initial paragraph' );
				await editor.selectBlocks( paragraph );

				await postContentFocusMode.insertBlockViaGlobalInserter(
					'Heading'
				);

				// The new heading is inserted after the selected paragraph.
				expect(
					await postContentFocusMode.getPostContentInnerBlockNames()
				).toEqual( [
					'core/paragraph',
					'core/heading',
					'core/heading',
					'core/heading',
					'core/heading',
				] );
				expect(
					await postContentFocusMode.getTemplatePartInnerBlockNames()
				).toEqual( expectedTemplatePart );
			} );
		} );
	} );

	// The same post is rendered by two Post Content blocks, which are inner
	// block controllers sharing one entity.
	// See https://github.com/WordPress/gutenberg/issues/79096.
	test.describe( 'duplicate Post Content instances', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.createTemplate( 'wp_template_part', {
				slug: 'content-area',
				title: 'Content Area',
				content:
					'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
			} );

			// One Post Content at the template root, another nested inside a
			// template part, both rendering the same post.
			await requestUtils.createTemplate( 'wp_template', {
				slug: 'singular',
				title: 'Singular',
				content: [
					'<!-- wp:template-part {"slug":"header","tagName":"header","theme":"emptytheme"} /-->',
					'<!-- wp:post-content {"layout":{"inherit":true}} /-->',
					'<!-- wp:template-part {"slug":"content-area","theme":"emptytheme"} /-->',
				].join( '\n' ),
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllTemplates( 'wp_template' );
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
		} );

		test( 'typing in one instance leaves the caret and selection in that instance', async ( {
			admin,
			editor,
			page,
			postContentFocusMode,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Shared' },
			} );
			await postContentFocusMode.enableShowTemplate();

			// Identify the Post Content at the template root, as opposed to
			// the one nested inside the template part.
			const { rootParagraph, nestedPostContent } = await page.evaluate(
				() => {
					const {
						getBlocksByName,
						getBlockOrder,
						getBlockParents,
						getBlockName,
					} = window.wp.data.select( 'core/block-editor' );
					const isNested = ( clientId ) =>
						getBlockParents( clientId ).some(
							( parent ) =>
								getBlockName( parent ) === 'core/template-part'
						);
					const all = getBlocksByName( 'core/post-content' );
					const root = all.find(
						( clientId ) => ! isNested( clientId )
					);
					return {
						rootParagraph: getBlockOrder( root )[ 0 ],
						nestedPostContent: all.find( isNested ),
					};
				}
			);

			// Clear the selection so no block toolbar overlaps the paragraph.
			await page.evaluate( () => {
				window.wp.data
					.dispatch( 'core/block-editor' )
					.clearSelectedBlock();
			} );
			await editor.canvas
				.locator( `[data-block="${ rootParagraph }"]` )
				.click();

			// Record every time the selection enters the nested instance.
			// A steal is momentary — the canvas scrolls as soon as it
			// happens, even if the selection later recovers — so asserting
			// on the final selection alone misses it.
			await page.evaluate( ( nestedClientId ) => {
				const { getSelectedBlockClientId, getBlockParents } =
					window.wp.data.select( 'core/block-editor' );
				window.__selectionsInNestedInstance = [];
				window.wp.data.subscribe( () => {
					const selected = getSelectedBlockClientId();
					if (
						selected &&
						getBlockParents( selected ).includes(
							nestedClientId
						) &&
						window.__selectionsInNestedInstance.at( -1 ) !==
							selected
					) {
						window.__selectionsInNestedInstance.push( selected );
					}
				} );
			}, nestedPostContent );

			await page.keyboard.press( 'End' );
			await page.keyboard.type( ' edited' );

			// The edit reaches both instances, since they render one post.
			await expect(
				editor.canvas.getByText( 'Shared edited' )
			).toHaveCount( 2 );

			// …and the selection never enters the nested instance.
			expect(
				await page.evaluate( () => window.__selectionsInNestedInstance )
			).toEqual( [] );
		} );
	} );
} );

class PostContentFocusMode {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
	}

	/**
	 * Opens the global block inserter, inserts a block by name, and closes
	 * the inserter.
	 *
	 * @param {string} blockName The label of the block to insert (e.g. 'Heading').
	 */
	async insertBlockViaGlobalInserter( blockName ) {
		await this.page
			.getByRole( 'button', {
				name: 'Block Inserter',
				exact: true,
			} )
			.click();

		const inserterPanel = this.page.getByRole( 'region', {
			name: 'Block Library',
		} );
		const searchBox = inserterPanel.getByRole( 'searchbox', {
			name: 'Search',
		} );
		await searchBox.fill( blockName );
		await inserterPanel
			.getByRole( 'tabpanel', { name: 'Blocks' } )
			.getByRole( 'option', { name: blockName, exact: true } )
			.click();

		// Close the inserter.
		await this.page
			.getByRole( 'button', {
				name: 'Block Inserter',
				exact: true,
			} )
			.click();
	}

	/**
	 * Returns the block names of Post Content's inner blocks.
	 *
	 * @return {string[]} Array of block names inside Post Content.
	 */
	async getPostContentInnerBlockNames() {
		return await this.page.evaluate( () => {
			const { getBlocksByName, getBlockOrder, getBlockName } =
				window.wp.data.select( 'core/block-editor' );
			const [ postContentId ] = getBlocksByName( 'core/post-content' );
			return getBlockOrder( postContentId ).map( ( id ) =>
				getBlockName( id )
			);
		} );
	}

	/**
	 * Returns the block names of the direct children of the template part
	 * that contains Post Content.
	 *
	 * @return {string[]} Array of block names inside the template part.
	 */
	async getTemplatePartInnerBlockNames() {
		return await this.page.evaluate( () => {
			const {
				getBlocksByName,
				getBlockOrder,
				getBlockName,
				getBlockRootClientId,
			} = window.wp.data.select( 'core/block-editor' );
			const [ postContentId ] = getBlocksByName( 'core/post-content' );
			const templatePartId = getBlockRootClientId( postContentId );
			return getBlockOrder( templatePartId ).map( ( id ) =>
				getBlockName( id )
			);
		} );
	}

	/**
	 * Enables the "Show template" toggle in the post editor settings sidebar.
	 * If already enabled, this is a no-op.
	 */
	async enableShowTemplate() {
		// Clear selection so the sidebar shows the Post tab.
		await this.page.evaluate( () => {
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock();
		} );
		await this.editor.openDocumentSettingsSidebar();

		const templateOptionsButton = this.page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Template options' } );
		await templateOptionsButton.click();

		const showTemplateButton = this.page.getByRole( 'menuitemcheckbox', {
			name: 'Show template',
		} );

		// Only toggle if not already checked.
		const isChecked =
			await showTemplateButton.getAttribute( 'aria-checked' );
		if ( isChecked !== 'true' ) {
			await showTemplateButton.click();
		} else {
			// Close the dropdown without toggling.
			await this.page.keyboard.press( 'Escape' );
		}

		// Wait for the template parts to load.
		await expect(
			this.editor.canvas.getByRole( 'document', {
				name: 'Block: header',
			} )
		).toBeVisible();
	}
}
