/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * External dependencies
 */
const path = require( 'path' );

test.describe( 'Pattern Overrides', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'emptytheme' ),
			requestUtils.deleteAllBlocks(),
		] );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
		] );
	} );

	test( 'Create a pattern with overrides', async ( {
		page,
		admin,
		editor,
	} ) => {
		let patternId;
		const editableParagraphName = 'Editable Paragraph';

		await test.step( 'Create a synced pattern and assign blocks to allow overrides', async () => {
			await admin.visitSiteEditor( { postType: 'wp_block' } );

			await page
				.getByRole( 'region', { name: 'Patterns content' } )
				.getByRole( 'button', { name: 'add new pattern' } )
				.click();

			await page
				.getByRole( 'menu', { name: 'add new pattern' } )
				.getByRole( 'menuitem', { name: 'add new pattern' } )
				.click();

			const createPatternDialog = page.getByRole( 'dialog', {
				name: 'add new pattern',
			} );
			await createPatternDialog
				.getByRole( 'textbox', { name: 'Name' } )
				.fill( 'Pattern with overrides' );
			await createPatternDialog
				.getByRole( 'checkbox', { name: 'Synced' } )
				.setChecked( true );
			await createPatternDialog
				.getByRole( 'button', { name: 'Add' } )
				.click();

			await editor.canvas
				.getByRole( 'button', { name: 'Add default block' } )
				.click();
			await page.keyboard.type( 'This paragraph can be edited' );
			await page.keyboard.press( 'Enter' );
			await page.keyboard.type( "This one can't" );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'This paragraph can be edited' } )
				.focus();

			await editor.clickBlockOptionsMenuItem( 'Rename' );
			await page
				.getByRole( 'dialog', { name: 'Rename' } )
				.getByRole( 'textbox', { name: 'Block name' } )
				.fill( editableParagraphName );
			await page
				.getByRole( 'dialog', { name: 'Rename' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();

			await editor.openDocumentSettingsSidebar();
			const editorSettings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await editorSettings
				.getByRole( 'button', { name: 'Advanced' } )
				.click();
			await editorSettings
				.getByRole( 'button', { name: 'Enable overrides' } )
				.click();
			await page
				.getByRole( 'dialog', { name: 'Enable overrides' } )
				.getByRole( 'button', { name: 'Enable' } )
				.click();

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'This paragraph can be edited',
						metadata: {
							name: editableParagraphName,
							bindings: {
								__default: {
									source: 'core/pattern-overrides',
								},
							},
						},
					},
				},
				{
					name: 'core/paragraph',
					attributes: { content: "This one can't" },
				},
			] );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();

			await expect(
				page.getByRole( 'button', { name: 'Dismiss this notice' } )
			).toBeVisible();

			patternId = new URL( page.url() ).searchParams.get( 'postId' );
		} );

		await test.step( 'Create a post and insert the pattern with overrides', async () => {
			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: patternId },
			} );
			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: patternId },
			} );

			const patternBlocks = editor.canvas.getByRole( 'document', {
				name: 'Block: Pattern',
			} );
			const paragraphs = patternBlocks.first().getByRole( 'document', {
				name: 'Block: Paragraph',
			} );
			// Ensure the first pattern is selected.
			await patternBlocks.first().selectText();
			await expect( paragraphs.first() ).not.toHaveAttribute(
				'inert',
				'true'
			);
			await expect( paragraphs.last() ).toHaveAttribute(
				'inert',
				'true'
			);

			await expect( paragraphs.first() ).toHaveText(
				'This paragraph can be edited'
			);

			await paragraphs.first().selectText();
			await page.keyboard.type( 'I would word it this way' );

			// Ensure the second pattern is selected.
			await patternBlocks.last().selectText();
			await patternBlocks
				.last()
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.first()
				.selectText();
			await page.keyboard.type( 'This one is different' );

			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/block',
					attributes: {
						ref: patternId,
						content: {
							[ editableParagraphName ]: {
								content: 'I would word it this way',
							},
						},
					},
				},
				{
					name: 'core/block',
					attributes: {
						ref: patternId,
						content: {
							[ editableParagraphName ]: {
								content: 'This one is different',
							},
						},
					},
				},
			] );

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish' } )
				.click();
			const editorPublishPanel = page.getByRole( 'region', {
				name: 'Editor publish',
			} );
			await editorPublishPanel
				.getByRole( 'button', { name: 'Publish', exact: true } )
				.click();
			await editorPublishPanel
				.getByRole( 'link', { name: 'View post' } )
				.click();

			await expect( page.locator( 'p' ) ).toContainText( [
				'I would word it this way',
				'This one can’t',
				'This one is different',
				'This one can’t',
			] );
		} );
	} );

	test( 'retains override values when converting a pattern block to regular blocks', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const paragraphName = 'paragraph-name';
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:paragraph {"metadata":{"name":"${ paragraphName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<p>Editable</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Make an edit to the pattern.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.focus();
		await page.keyboard.type( 'edited ' );

		// Convert back to regular blocks.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		// Check that the overrides remain.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'edited Editable',
					metadata: { name: paragraphName },
				},
			},
		] );
	} );

	// See https://github.com/WordPress/gutenberg/pull/62014.
	test( 'can convert a pattern block to regular blocks when the pattern supports overrides but not override values', async ( {
		admin,
		requestUtils,
		editor,
	} ) => {
		const paragraphName = 'paragraph-name';
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:paragraph {"metadata":{"name":"${ paragraphName }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
<p>Editable</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Convert back to regular blocks.
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Pattern' } )
		);
		await editor.showBlockToolbar();
		await editor.clickBlockOptionsMenuItem( 'Detach' );

		// Check that the overrides remain.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Editable',
					metadata: { name: paragraphName },
				},
			},
		] );
	} );

	test( "handles button's link settings", async ( {
		page,
		admin,
		requestUtils,
		editor,
		context,
	} ) => {
		const buttonName = 'Editable button';
		const { id } = await requestUtils.createBlock( {
			title: 'Button with target',
			content: `<!-- wp:buttons -->
<div class="wp-block-buttons"><!-- wp:button {"metadata":{"name":"${ buttonName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<div class="wp-block-button"><a class="wp-block-button__link wp-element-button" href="http://wp.org" target="_blank" rel="noreferrer noopener nofollow">Button</a></div>
<!-- /wp:button --></div>
<!-- /wp:buttons -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Focus the button, open the link popup.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Button' } )
			.getByRole( 'textbox', { name: 'Button text' } )
			.focus();
		await expect(
			page.getByRole( 'link', { name: 'wp.org' } ).getByText( '↗' )
		).toHaveAttribute( 'aria-label', '(opens in a new tab)' );

		// The link popup doesn't have a role which is a bit unfortunate.
		// These are the buttons in the link popup.
		const advancedPanel = page.getByRole( 'button', {
			name: 'Advanced',
			exact: true,
		} );
		const editLinkButton = page.getByRole( 'button', {
			name: 'Edit link',
			exact: true,
		} );

		const saveLinkButton = page.locator(
			'.block-editor-link-control__search-submit'
		);

		await editLinkButton.click();
		if (
			( await advancedPanel.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await advancedPanel.click();
		}

		const openInNewTabCheckbox = page.getByRole( 'checkbox', {
			name: 'Open in new tab',
		} );
		const markAsNoFollowCheckbox = page.getByRole( 'checkbox', {
			name: 'Mark as nofollow',
		} );
		// Both checkboxes are checked.
		await expect( openInNewTabCheckbox ).toBeChecked();
		await expect( markAsNoFollowCheckbox ).toBeChecked();

		// Check only the "open in new tab" checkbox.
		await markAsNoFollowCheckbox.setChecked( false );
		await saveLinkButton.click();

		const postId = await editor.publishPost();
		const previewPage = await context.newPage();
		await previewPage.goto( `/?p=${ postId }` );
		const buttonLink = previewPage.getByRole( 'link', { name: 'Button' } );

		await expect( buttonLink ).toHaveAttribute( 'target', '_blank' );
		await expect( buttonLink ).toHaveAttribute(
			'rel',
			'noreferrer noopener'
		);

		// Uncheck both checkboxes.
		await editLinkButton.click();
		await openInNewTabCheckbox.setChecked( false );
		await saveLinkButton.click();

		// Update the post.
		const updateButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Save' } );
		await updateButton.click();
		await expect( updateButton ).toBeDisabled();

		await previewPage.reload();
		await expect( buttonLink ).toHaveAttribute( 'target', '' );
		await expect( buttonLink ).toHaveAttribute( 'rel', '' );

		// Check only the "mark as nofollow" checkbox.
		await editLinkButton.click();
		await markAsNoFollowCheckbox.setChecked( true );
		await saveLinkButton.click();

		// Update the post.
		await updateButton.click();
		await expect( updateButton ).toBeDisabled();

		await previewPage.reload();
		await expect( buttonLink ).toHaveAttribute( 'target', '' );
		await expect( buttonLink ).toHaveAttribute( 'rel', /^\s*nofollow\s*$/ );
	} );

	test( 'disables editing of nested patterns', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const paragraphName = 'Editable paragraph';
		const headingName = 'Editable heading';
		const innerPattern = await requestUtils.createBlock( {
			title: 'Inner Pattern',
			content: `<!-- wp:paragraph {"metadata":{"name":"${ paragraphName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<p>Inner paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );
		const outerPattern = await requestUtils.createBlock( {
			title: 'Outer Pattern',
			content: `<!-- wp:heading {"metadata":{"name":"${ headingName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<h2 class="wp-block-heading">Outer heading</h2>
<!-- /wp:heading -->
<!-- wp:block {"ref":${ innerPattern.id },"content":{"${ paragraphName }":{"content":"Inner paragraph (edited)"}}} /-->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: outerPattern.id },
		} );

		// Make an edit to the outer pattern heading.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.fill( 'Outer heading (edited)' );

		const postId = await editor.publishPost();

		// Check the pattern has the correct attributes.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/block',
				attributes: {
					ref: outerPattern.id,
					content: {
						[ headingName ]: {
							content: 'Outer heading (edited)',
						},
					},
				},
				innerBlocks: [],
			},
		] );
		// Check it renders correctly.
		const headingBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await expect( headingBlock ).toHaveText( 'Outer heading (edited)' );
		await expect( headingBlock ).not.toHaveAttribute( 'inert', 'true' );
		await expect( paragraphBlock ).toHaveText( 'Inner paragraph (edited)' );
		await expect( paragraphBlock ).toHaveAttribute( 'inert', 'true' );

		// Edit the outer pattern.
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Pattern' } )
				.first()
		);
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Edit original' } )
			.click();

		// The inner paragraph should be editable in the pattern focus mode.
		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Pattern' } )
				.first()
		);
		await expect(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Paragraph',
			} ),
			'The inner paragraph should be editable'
		).not.toHaveAttribute( 'inert', 'true' );

		// Visit the post on the frontend.
		await page.goto( `/?p=${ postId }` );

		await expect( page.getByRole( 'heading', { level: 2 } ) ).toHaveText(
			'Outer heading (edited)'
		);
		await expect(
			page.getByText( 'Inner paragraph (edited)' )
		).toBeVisible();
	} );

	test( 'resets overrides after clicking the reset button', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const headingName = 'Editable heading';
		const paragraphName = 'Editable paragraph';
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:heading {"metadata":{"name":"${ headingName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<h2 class="wp-block-heading">Heading</h2>
<!-- /wp:heading -->
<!-- wp:paragraph {"metadata":{"name":"${ paragraphName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<p>Paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		// Make an edit to the heading.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.fill( 'Heading (edited)' );

		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		const headingBlock = patternBlock.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const paragraphBlock = patternBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const resetButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Reset' } );

		// Assert the pattern block.
		await editor.selectBlocks( patternBlock );
		await editor.showBlockToolbar();
		await expect(
			resetButton,
			'The pattern block should have the reset button enabled'
		).toBeEnabled();

		// Assert the modified heading block with overrides.
		await editor.selectBlocks( headingBlock );
		await editor.showBlockToolbar();
		await expect(
			resetButton,
			'The heading block should have the reset button enabled'
		).toBeEnabled();

		// Assert the unmodified paragraph block (no overrides).
		await editor.selectBlocks( paragraphBlock );
		await editor.showBlockToolbar();
		await expect(
			resetButton,
			'The paragraph block should not have the reset button enabled'
		).toBeDisabled();

		// Reset the whole pattern.
		await editor.selectBlocks( patternBlock );
		await editor.showBlockToolbar();
		await resetButton.click();
		await expect( headingBlock ).toHaveText( 'Heading' );

		// Undo should work
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Undo' } )
			.click();
		await expect( headingBlock ).toHaveText( 'Heading (edited)' );

		// Reset the individual heading block.
		await editor.selectBlocks( headingBlock );
		await editor.showBlockToolbar();
		await resetButton.click();
		await expect( headingBlock ).toHaveText( 'Heading' );
		await editor.selectBlocks( patternBlock );
		await editor.showBlockToolbar();
		await expect( resetButton ).toBeDisabled();
	} );

	// A Undo/Redo bug found when implementing and fixing https://github.com/WordPress/gutenberg/pull/60721.
	// This could be merged into an existing test after we fully test it.
	test( 'resets overrides immediately should not break undo/redo', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const paragraphName = 'Editable paragraph';
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:paragraph {"metadata":{"name":"${ paragraphName }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
<p>Paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		const patternBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		const paragraphBlock = patternBlock.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const resetButton = page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Reset' } );
		const documentTools = page.getByRole( 'toolbar', {
			name: 'Document tools',
		} );
		const undoButton = documentTools.getByRole( 'button', {
			name: 'Undo',
		} );
		const redoButton = documentTools.getByRole( 'button', {
			name: 'Redo',
		} );

		// Make an edit to the paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.type( '*' );
		await expect( paragraphBlock ).toHaveText( 'Paragraph*' );

		// Reset immediately after making the edit.
		await editor.selectBlocks( paragraphBlock );
		await editor.showBlockToolbar();
		await expect( resetButton ).toBeEnabled();
		await resetButton.click();
		await expect( paragraphBlock ).toHaveText( 'Paragraph' );

		// Undo/Redo should work
		await undoButton.click();
		await expect( paragraphBlock ).toHaveText( 'Paragraph*' );
		await redoButton.click();
		await expect( paragraphBlock ).toHaveText( 'Paragraph' );
	} );

	// Fix https://github.com/WordPress/gutenberg/issues/58708.
	test( 'overridden empty images should not have upload button', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const imageName = 'Editable image';
		const TEST_IMAGE_FILE_PATH = path.resolve(
			__dirname,
			'../../../assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:image {"metadata":{"name":"${ imageName }","bindings":{"__default":{"source":"core/pattern-overrides"}}}} -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await editor.selectBlocks( imageBlock );
		await imageBlock
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( TEST_IMAGE_FILE_PATH );
		await expect( imageBlock.getByRole( 'img' ) ).toHaveCount( 1 );
		await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
			'src',
			/\/wp-content\/uploads\//
		);

		await editor.publishPost();
		await page.reload();

		await editor.selectBlocks( imageBlock );
		await editor.showBlockToolbar();
		const blockToolbar = page.getByRole( 'toolbar', {
			name: 'Block tools',
		} );
		await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
			'src',
			/\/wp-content\/uploads\//
		);
		await expect(
			blockToolbar.getByRole( 'button', { name: 'Replace' } )
		).toBeEnabled();
		await expect(
			blockToolbar.getByRole( 'button', {
				name: 'Upload to Media Library',
			} )
		).toBeHidden();
	} );

	test( 'blocks with the same name should be synced', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		let patternId;
		const sharedName = 'Shared Name';

		await test.step( 'create a pattern with synced blocks with the same name', async () => {
			const { id } = await requestUtils.createBlock( {
				title: 'Blocks with the same name',
				content: `<!-- wp:heading {"metadata":{"name":"${ sharedName }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
			<h2>default name</h2>
			<!-- /wp:heading -->
			<!-- wp:paragraph {"metadata":{"name":"${ sharedName }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
			<p>default content</p>
			<!-- /wp:paragraph -->
			<!-- wp:paragraph {"metadata":{"name":"${ sharedName }","bindings":{"content":{"source":"core/pattern-overrides"}}}} -->
			<p>default content</p>
			<!-- /wp:paragraph -->`,
				status: 'publish',
			} );
			await admin.visitSiteEditor( {
				postId: id,
				postType: 'wp_block',
				canvas: 'edit',
			} );

			const headingBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );
			const firstParagraph = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.first();
			const secondParagraph = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.last();

			// Update the content of one of the blocks.
			await headingBlock.fill( 'updated content' );

			// Check that every content has been updated.
			for ( const block of [
				headingBlock,
				firstParagraph,
				secondParagraph,
			] ) {
				await expect( block ).toHaveText( 'updated content' );
			}

			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save' } )
				.click();

			await expect(
				page.getByRole( 'button', { name: 'Dismiss this notice' } )
			).toBeVisible();

			patternId = new URL( page.url() ).searchParams.get( 'postId' );
		} );

		await test.step( 'create a post and insert the pattern with synced values', async () => {
			await admin.createNewPost();

			await editor.insertBlock( {
				name: 'core/block',
				attributes: { ref: patternId },
			} );

			const headingBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Heading',
			} );
			const firstParagraph = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.first();
			const secondParagraph = editor.canvas
				.getByRole( 'document', {
					name: 'Block: Paragraph',
				} )
				.last();

			await firstParagraph.fill( 'overriden content' );
			await expect( headingBlock ).toHaveText( 'overriden content' );
			await expect( firstParagraph ).toHaveText( 'overriden content' );
			await expect( secondParagraph ).toHaveText( 'overriden content' );
		} );
	} );

	// https://github.com/WordPress/gutenberg/issues/61610.
	test( 'unsynced patterns should not be able to enable overrides', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const pattern = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:paragraph -->
<p>paragraph</p>
<!-- /wp:paragraph -->`,
			status: 'publish',
			meta: {
				wp_pattern_sync_status: 'unsynced',
			},
		} );

		await admin.visitSiteEditor( {
			postId: pattern.id,
			postType: 'wp_block',
			canvas: 'edit',
		} );

		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		await editor.selectBlocks( paragraph );
		await editor.openDocumentSettingsSidebar();

		const editorSettings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await editorSettings
			.getByRole( 'button', { name: 'Advanced' } )
			.click();
		await expect(
			editorSettings.getByRole( 'button', { name: 'Enable overrides' } )
		).toBeHidden();
	} );

	// @see https://github.com/WordPress/gutenberg/pull/60694
	test( 'handles back-compat from individual attributes to __default', async ( {
		page,
		admin,
		requestUtils,
		editor,
	} ) => {
		const imageName = 'Editable image';
		const TEST_IMAGE_FILE_PATH = path.resolve(
			__dirname,
			'../../../assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const { id } = await requestUtils.createBlock( {
			title: 'Pattern',
			content: `<!-- wp:image {"metadata":{"name":"${ imageName }","bindings":{"id":{"source":"core/pattern-overrides"},"url":{"source":"core/pattern-overrides"},"title":{"source":"core/pattern-overrides"},"alt":{"source":"core/pattern-overrides"}}}} -->
<figure class="wp-block-image"><img alt=""/></figure>
<!-- /wp:image -->`,
			status: 'publish',
		} );

		await admin.createNewPost();

		await editor.insertBlock( {
			name: 'core/block',
			attributes: { ref: id },
		} );

		const blocks = await editor.getBlocks( { full: true } );
		expect( blocks ).toMatchObject( [
			{
				name: 'core/block',
				attributes: { ref: id },
			},
		] );
		expect(
			await editor.getBlocks( { clientId: blocks[ 0 ].clientId } )
		).toMatchObject( [
			{
				name: 'core/image',
				attributes: {
					metadata: {
						name: imageName,
						bindings: {
							__default: {
								source: 'core/pattern-overrides',
							},
						},
					},
				},
			},
		] );

		const imageBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		await editor.selectBlocks( imageBlock );
		await imageBlock
			.getByTestId( 'form-file-upload-input' )
			.setInputFiles( TEST_IMAGE_FILE_PATH );
		await expect( imageBlock.getByRole( 'img' ) ).toHaveCount( 1 );
		await expect( imageBlock.getByRole( 'img' ) ).toHaveAttribute(
			'src',
			/\/wp-content\/uploads\//
		);
		await editor.showBlockToolbar();
		await editor.clickBlockToolbarButton( 'Alt' );
		await page
			.getByRole( 'textbox', { name: 'alternative text' } )
			.fill( 'Test Image' );

		const postId = await editor.publishPost();

		await page.goto( `/?p=${ postId }` );
		await expect(
			page.getByRole( 'img', { name: 'Test Image' } )
		).toHaveAttribute( 'src', /\/wp-content\/uploads\// );
	} );
} );
