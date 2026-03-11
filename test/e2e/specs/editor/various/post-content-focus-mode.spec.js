/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	postContentFocusMode: async ( { editor, page }, use ) => {
		await use( new PostContentFocusMode( { editor, page } ) );
	},
} );

// Post content focus mode (aka the 'Show template' option when editing a post or page).
test.describe( 'Post Content focus mode', () => {
	// Check for regressions of https://github.com/WordPress/gutenberg/issues/76101.
	test.describe( 'post content inside a template part', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );

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
			await requestUtils.activateTheme( 'twentytwentyone' );
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
			await expect( siteTitle ).toHaveAttribute( 'inert', 'true' );
		} );
	} );
} );

class PostContentFocusMode {
	constructor( { editor, page } ) {
		this.editor = editor;
		this.page = page;
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
