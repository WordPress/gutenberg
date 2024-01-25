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
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
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
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
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
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);

		const PATTERN_NAME = 'Social links with a shared background color';

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
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
			name: 'Create pattern',
		} );
		await createPatternDialog
			.getByRole( 'textbox', { name: 'Name' } )
			.fill( PATTERN_NAME );
		await createPatternDialog
			.getByRole( 'checkbox', { name: 'Synced' } )
			.setChecked( true );
		await createPatternDialog
			.getByRole( 'button', { name: 'Create' } )
			.click();
		const patternBlock = page.getByRole( 'document', {
			name: 'Block: Pattern',
		} );
		await expect( patternBlock ).toBeFocused();

		// Insert a synced pattern.
		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);
		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
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
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);

		const PATTERN_NAME = 'Social links with a shared background color';

		await page.fill(
			'role=region[name="Block Library"i] >> role=searchbox[name="Search for blocks and patterns"i]',
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
			name: 'Toggle block inserter',
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

		await page.click(
			'role=region[name="Editor top bar"i] >> role=button[name="Toggle block inserter"i]'
		);
		await page.click(
			'role=region[name="Block Library"i] >> role=tab[name="Media"i]'
		);
		await page.click(
			'[aria-label="Media categories"i] >> role=button[name="Images"i]'
		);
		await page.click(
			`role=listbox[name="Media List"i] >> role=option[name="${ uploadedMedia.title.raw }"]`
		);
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
