/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	insertingBlocksUtils: async ( { page, editor }, use ) => {
		await use( new InsertingBlocksUtils( { page, editor } ) );
	},
} );

test.describe( 'Inserting blocks (@firefox, @webkit)', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllBlocks();
		await requestUtils.deleteAllPatternCategories();
	} );

	test( 'inserts a default block on bottom padding click', async ( {
		admin,
		editor,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/image' } );
		const body = editor.canvas.locator( 'body' );
		const box = await body.boundingBox();
		await body.click( {
			position: {
				x: box.width / 2,
				y: box.height - 10,
			},
		} );

		expect( await editor.getBlocks() ).toMatchObject( [
			{ name: 'core/image' },
			{ name: 'core/paragraph' },
		] );

		await expect(
			editor.canvas.locator( '[data-type="core/paragraph"]' )
		).toBeFocused();
	} );

	test( 'inserts blocks by dragging and dropping from the global inserter', async ( {
		admin,
		page,
		editor,
		insertingBlocksUtils,
	}, testInfo ) => {
		testInfo.fixme(
			testInfo.project.name === 'firefox',
			'The clientX value is always 0 in firefox, see https://github.com/microsoft/playwright/issues/17761 for more info.'
		);

		await admin.createNewPost();
		await editor.switchToLegacyCanvas();

		// We need a dummy block in place to display the drop indicator due to a bug.
		// @see https://github.com/WordPress/gutenberg/issues/44064
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );
		const paragraphBlock = page.locator(
			'[data-type="core/paragraph"] >> text=Dummy text'
		);

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Block Inserter"i]'
		);

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search"i]',
			'Heading'
		);

		await page.hover(
			'role=listbox[name="Blocks"i] >> role=option[name="Heading"i]'
		);
		const paragraphBoundingBox = await paragraphBlock.boundingBox();

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await insertingBlocksUtils.expectIndicatorBelowParagraph(
			paragraphBoundingBox
		);

		await page.mouse.down();

		await insertingBlocksUtils.dragOver( paragraphBoundingBox );
		await insertingBlocksUtils.expectIndicatorBelowParagraph(
			paragraphBoundingBox
		);

		// Expect the draggable-chip to appear.
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent )
			.toBe( `<!-- wp:paragraph -->
<p>Dummy text</p>
<!-- /wp:paragraph -->

<!-- wp:heading -->
<h2 class="wp-block-heading"></h2>
<!-- /wp:heading -->` );
	} );

	test( 'cancels dragging blocks from the global inserter by pressing Escape', async ( {
		admin,
		page,
		editor,
		insertingBlocksUtils,
	} ) => {
		await admin.createNewPost();
		await editor.switchToLegacyCanvas();

		// We need a dummy block in place to display the drop indicator due to a bug.
		// @see https://github.com/WordPress/gutenberg/issues/44064
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const beforeContent = await editor.getEditedPostContent();

		const paragraphBlock = page.locator(
			'[data-type="core/paragraph"] >> text=Dummy text'
		);

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Block Inserter"i]'
		);

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search"i]',
			'Heading'
		);

		await page.hover(
			'role=listbox[name="Blocks"i] >> role=option[name="Heading"i]'
		);
		const paragraphBoundingBox = await paragraphBlock.boundingBox();

		await page.mouse.down();

		await insertingBlocksUtils.dragOver( paragraphBoundingBox );

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.keyboard.press( 'Escape' );

		await expect( insertingBlocksUtils.indicator ).toBeHidden();
		await expect( insertingBlocksUtils.draggableChip ).toBeHidden();

		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent ).toBe( beforeContent );
	} );

	test( 'inserts patterns by dragging and dropping from the global inserter', async ( {
		admin,
		page,
		editor,
		insertingBlocksUtils,
	}, testInfo ) => {
		testInfo.fixme(
			testInfo.project.name === 'firefox',
			'The clientX value is always 0 in firefox, see https://github.com/microsoft/playwright/issues/17761 for more info.'
		);

		await admin.createNewPost();
		await editor.switchToLegacyCanvas();

		// We need a dummy block in place to display the drop indicator due to a bug.
		// @see https://github.com/WordPress/gutenberg/issues/44064
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const paragraphBlock = page.locator(
			'[data-type="core/paragraph"] >> text=Dummy text'
		);

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Block Inserter"i]'
		);

		const PATTERN_NAME = 'Standard';

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search"i]',
			PATTERN_NAME
		);

		await page.hover(
			`role=listbox[name="Block Patterns"i] >> role=option[name="${ PATTERN_NAME }"i]`
		);

		// FIXME: I think we should show the indicator when hovering on patterns as well?
		// @see https://github.com/WordPress/gutenberg/issues/45183
		// await expect( insertingBlocksUtils.indicator ).toBeVisible();

		const paragraphBoundingBox = await paragraphBlock.boundingBox();

		await page.mouse.down();

		await insertingBlocksUtils.dragOver( paragraphBoundingBox );

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await insertingBlocksUtils.expectIndicatorBelowParagraph(
			paragraphBoundingBox
		);

		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.mouse.up();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'inserts synced patterns by dragging and dropping from the global inserter', async ( {
		admin,
		page,
		editor,
		insertingBlocksUtils,
	}, testInfo ) => {
		testInfo.fixme(
			testInfo.project.name === 'firefox',
			'The clientX value is always 0 in firefox, see https://github.com/microsoft/playwright/issues/17761 for more info.'
		);
		const PATTERN_NAME = 'My synced pattern';

		await admin.createNewPost();
		await editor.switchToLegacyCanvas();

		// We need a dummy block in place to display the drop indicator due to a bug.
		// @see https://github.com/WordPress/gutenberg/issues/44064
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const paragraphBlock = page.locator(
			'[data-type="core/paragraph"] >> text=Dummy text'
		);

		// Create a synced pattern from the paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A useful paragraph to reuse' },
		} );
		await editor.showBlockToolbar();
		await page
			.getByRole( 'toolbar', { name: 'Block tools' } )
			.getByRole( 'button', { name: 'Options' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Create pattern' } ).click();
		const createPatternDialog = page.getByRole( 'dialog', {
			name: 'add new pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( PATTERN_NAME );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );
		await createPatternDialog
			.getByRole( 'button', { name: 'Add' } )
			.click();
		const patternBlock = page.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patternBlock ).toBeFocused();

		// Insert a synced pattern.
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Block Inserter"i]'
		);
		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search"i]',
			PATTERN_NAME
		);
		await page.hover(
			`role=listbox[name="Block Patterns"i] >> role=option[name="${ PATTERN_NAME }"i]`
		);

		const paragraphBoundingBox = await paragraphBlock.boundingBox();

		await page.mouse.down();

		await insertingBlocksUtils.dragOver( paragraphBoundingBox );
		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await insertingBlocksUtils.expectIndicatorBelowParagraph(
			paragraphBoundingBox
		);
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.mouse.up();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Dummy text',
				},
			},
			{
				name: 'core/block',
				attributes: { ref: expect.any( Number ) },
			},
			{
				name: 'core/block',
				attributes: { ref: expect.any( Number ) },
			},
		] );
	} );

	test( 'cancels dragging patterns from the global inserter by pressing Escape', async ( {
		admin,
		page,
		editor,
		insertingBlocksUtils,
	} ) => {
		await admin.createNewPost();
		await editor.switchToLegacyCanvas();

		// We need a dummy block in place to display the drop indicator due to a bug.
		// @see https://github.com/WordPress/gutenberg/issues/44064
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Dummy text' },
		} );

		const beforeContent = await editor.getEditedPostContent();

		const paragraphBlock = page.locator(
			'[data-type="core/paragraph"] >> text=Dummy text'
		);

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Block Inserter"i]'
		);

		const PATTERN_NAME = 'Standard';

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search"i]',
			PATTERN_NAME
		);

		await page.hover(
			`role=listbox[name="Block Patterns"i] >> role=option[name="${ PATTERN_NAME }"i]`
		);

		const paragraphBoundingBox = await paragraphBlock.boundingBox();

		await page.mouse.down();

		await insertingBlocksUtils.dragOver( paragraphBoundingBox );

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.keyboard.press( 'Escape' );

		await expect( insertingBlocksUtils.indicator ).toBeHidden();
		await expect( insertingBlocksUtils.draggableChip ).toBeHidden();

		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent ).toBe( beforeContent );
	} );

	// A test for https://github.com/WordPress/gutenberg/issues/43090.
	test( 'should close the inserter when clicking on the toggle button', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.createNewPost();

		const inserterButton = page.getByRole( 'button', {
			name: 'Block Inserter',
			exact: true,
		} );
		const blockLibrary = page.getByRole( 'region', {
			name: 'Block Library',
		} );

		await inserterButton.click();

		await blockLibrary.getByRole( 'option', { name: 'Buttons' } ).click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [ { name: 'core/buttons' } ] );

		await inserterButton.click();

		await expect( blockLibrary ).toBeHidden();
	} );

	test( 'should insert block with the slash inserter when using multiple words', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( '/tag cloud' );

		await expect(
			page.getByRole( 'option', { name: 'Tag Cloud', selected: true } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		await expect(
			editor.canvas.getByRole( 'document', { name: 'Block: Tag Cloud' } )
		).toBeVisible();
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/24262.
	test( 'inserts a block in proper place after having clicked `Browse All` from inline inserter', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'First paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( '## Heading' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Second paragraph' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'Third paragraph' );

		const boundingBox = await editor.canvas
			.getByRole( 'document', { name: 'Block: Heading' } )
			.boundingBox();

		// Using the between inserter.
		await page.mouse.move(
			boundingBox.x + boundingBox.width / 2,
			boundingBox.y - 10,
			// An arbitrary number of `steps` imitates cursor movement in the test environment,
			// activating the in-between inserter.
			{ steps: 10 }
		);

		await page
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.click();
		await page.getByRole( 'button', { name: 'Browse All' } ).click();
		await page
			.getByRole( 'listbox', { name: 'Media' } )
			.getByRole( 'option', { name: 'Image' } )
			.click();

		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph' },
				{ name: 'core/image' },
				{ name: 'core/heading' },
				{ name: 'core/paragraph' },
				{ name: 'core/paragraph' },
			] );
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/25785.
	test( 'inserts a block should show a blue line indicator', async ( {
		admin,
		editor,
		page,
		insertingBlocksUtils,
	} ) => {
		await admin.createNewPost();
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'First paragraph' );
		await editor.insertBlock( { name: 'core/image' } );

		const paragraphBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );

		await editor.selectBlocks( paragraphBlock );
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.getByRole( 'listbox', { name: 'Text' } )
			.getByRole( 'option', { name: 'Heading' } )
			.hover();

		await expect( insertingBlocksUtils.indicator ).toBeVisible();

		const paragraphBoundingBox = await paragraphBlock.boundingBox();
		const indicatorBoundingBox =
			await insertingBlocksUtils.indicator.boundingBox();

		// Expect the indicator to be below the selected block.
		expect( indicatorBoundingBox.y ).toBeGreaterThan(
			paragraphBoundingBox.y
		);
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/24403.
	test( 'inserts a block in proper place after having clicked `Browse All` from block appender', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph after group' },
		} );

		await editor.canvas
			.getByRole( 'button', {
				name: 'Group: Gather blocks in a container.',
			} )
			.click();
		await editor.canvas
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.click();
		await page.getByRole( 'button', { name: 'Browse All' } ).click();
		await page
			.getByRole( 'listbox', { name: 'Text' } )
			.getByRole( 'option', { name: 'Paragraph' } )
			.click();
		await editor.canvas
			.getByRole( 'document', { name: 'Empty block' } )
			.fill( 'Paragraph inside group' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Paragraph inside group' },
					},
				],
			},
			{
				name: 'core/paragraph',
				attributes: { content: 'Paragraph after group' },
			},
		] );
	} );

	test( 'passes the search value in the main inserter when clicking `Browse all`', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/group' } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph after group' },
		} );

		await editor.canvas
			.getByRole( 'button', {
				name: 'Group: Gather blocks in a container.',
			} )
			.click();
		await editor.canvas
			.getByRole( 'button', {
				name: 'Add block',
			} )
			.click();

		await page
			.getByRole( 'searchbox', {
				name: 'Search',
			} )
			.first()
			.fill( 'Verse' );
		await page.getByRole( 'button', { name: 'Browse All' } ).click();

		await expect(
			page
				.getByRole( 'region', { name: 'Block Library' } )
				.getByRole( 'searchbox', {
					name: 'Search',
				} )
				.first()
		).toHaveValue( 'Verse' );
		await expect(
			page.getByRole( 'listbox', { name: 'Blocks' } ).first()
		).toHaveCount( 1 );
	} );

	// Check for regression of https://github.com/WordPress/gutenberg/issues/27586.
	test( 'can close the main inserter after inserting a single-use block, like the More block', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page.getByRole( 'option', { name: 'More', exact: true } ).click();

		// Moving focus to the More block should not close the inserter.
		await editor.canvas
			.getByRole( 'textbox', { name: 'Read more' } )
			.fill( 'More' );
		await expect(
			page.getByRole( 'region', {
				name: 'Block Library',
			} )
		).toBeVisible();
	} );

	test( 'shows block preview when hovering over block in inserter', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost();
		await page
			.getByRole( 'toolbar', { name: 'Document tools' } )
			.getByRole( 'button', { name: 'Block Inserter', exact: true } )
			.click();
		await page
			.getByRole( 'listbox', { name: 'Text' } )
			.getByRole( 'option', { name: 'Paragraph' } )
			.hover();

		await expect(
			page.locator( '.block-editor-inserter__preview' )
		).toBeInViewport();
	} );

	[ 'large', 'small' ].forEach( ( viewport ) => {
		test( `last-inserted block should be given and keep the selection (${ viewport } viewport)`, async ( {
			admin,
			editor,
			page,
			pageUtils,
		} ) => {
			await pageUtils.setBrowserViewport( viewport );
			await admin.createNewPost();
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Testing inserted block selection' },
			} );

			await page
				.getByRole( 'toolbar', { name: 'Document tools' } )
				.getByRole( 'button', { name: 'Block Inserter', exact: true } )
				.click();
			await page
				.getByRole( 'listbox', { name: 'Media' } )
				.getByRole( 'option', { name: 'Image' } )
				.click();

			await expect(
				editor.canvas.getByRole( 'document', { name: 'Block: Image' } )
			).toBeVisible();
			await expect
				.poll( () =>
					page.evaluate(
						() =>
							window.wp.data
								.select( 'core/block-editor' )
								.getSelectedBlock()?.name
					)
				)
				.toBe( 'core/image' );

			// Restore the viewport.
			await pageUtils.setBrowserViewport( 'large' );
		} );
	} );
} );

test.describe( 'insert media from inserter', () => {
	let uploadedMedia;
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		uploadedMedia = await requestUtils.uploadMedia(
			path.resolve(
				process.cwd(),
				'test/e2e/assets/10x10_e2e_test_image_z9T8jK.png'
			)
		);
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMedia(),
			requestUtils.deleteAllPosts(),
		] );
	} );

	test( 'insert media from the global inserter', async ( {
		admin,
		page,
		editor,
	} ) => {
		await admin.createNewPost();

		await page.getByLabel( 'Block Inserter' ).click();
		await page.getByRole( 'tab', { name: 'Media' } ).click();
		await page.getByRole( 'tab', { name: 'Images' } ).click();
		await page.getByLabel( uploadedMedia.title.raw ).click();
		await expect.poll( editor.getEditedPostContent ).toBe(
			`<!-- wp:image {"id":${ uploadedMedia.id }} -->
<figure class="wp-block-image"><img src="${ uploadedMedia.source_url }" alt="${ uploadedMedia.alt_text }" class="wp-image-${ uploadedMedia.id }"/></figure>
<!-- /wp:image -->`
		);
	} );
} );

class InsertingBlocksUtils {
	constructor( { page, editor } ) {
		this.page = page;
		this.editor = editor;

		this.indicator = this.page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
		this.draggableChip = this.page.locator(
			'data-testid=block-draggable-chip >> visible=true'
		);
	}
	async dragOver( boundingBox ) {
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await this.page.mouse.move(
				// Hover on the right side of the block to avoid collapsing with the preview.
				// But not too far to avoid triggering the grouping block inserter.
				boundingBox.x + boundingBox.width - 32,
				// Hover on the bottom of the paragraph block.
				boundingBox.y + boundingBox.height - 1
			);
		}
	}

	async expectIndicatorBelowParagraph( paragraphBoundingBox ) {
		// Expect the indicator to be below the paragraph block.
		await expect
			.poll( () => this.indicator.boundingBox().then( ( { y } ) => y ) )
			.toBeGreaterThan( paragraphBoundingBox.y );
	}
}
