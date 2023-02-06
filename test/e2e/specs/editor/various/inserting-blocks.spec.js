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
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'inserts blocks by dragging and dropping from the global inserter', async ( {
		page,
		editor,
		insertingBlocksUtils,
	}, testInfo ) => {
		testInfo.fixme(
			testInfo.project.name === 'firefox',
			'The clientX value is always 0 in firefox, see https://github.com/microsoft/playwright/issues/17761 for more info.'
		);

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
		// Expect the indicator to be below the paragraph block.
		await expect
			.poll( () =>
				insertingBlocksUtils.indicator
					.boundingBox()
					.then( ( { y } ) => y )
			)
			.toBeGreaterThan( paragraphBoundingBox.y );

		await page.mouse.down();
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				// Hover on the right side of the block to avoid collapsing with the preview.
				paragraphBoundingBox.x + paragraphBoundingBox.width - 1,
				// Hover on the bottom of the paragraph block.
				paragraphBoundingBox.y + paragraphBoundingBox.height - 1
			);
		}
		// Expect the indicator to be below the paragraph block.
		await expect
			.poll( () =>
				insertingBlocksUtils.indicator
					.boundingBox()
					.then( ( { y } ) => y )
			)
			.toBeGreaterThan( paragraphBoundingBox.y );

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
		page,
		editor,
		insertingBlocksUtils,
	} ) => {
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
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				// Hover on the right side of the block to avoid collapsing with the preview.
				paragraphBoundingBox.x + paragraphBoundingBox.width - 1,
				// Hover on the bottom of the paragraph block.
				paragraphBoundingBox.y + paragraphBoundingBox.height - 1
			);
		}

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.keyboard.press( 'Escape' );

		await expect( insertingBlocksUtils.indicator ).not.toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).not.toBeVisible();

		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent ).toBe( beforeContent );
	} );

	test( 'inserts patterns by dragging and dropping from the global inserter', async ( {
		page,
		editor,
		insertingBlocksUtils,
	}, testInfo ) => {
		testInfo.fixme(
			testInfo.project.name === 'firefox',
			'The clientX value is always 0 in firefox, see https://github.com/microsoft/playwright/issues/17761 for more info.'
		);

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
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				// Hover on the right side of the block to avoid collapsing with the preview.
				paragraphBoundingBox.x + paragraphBoundingBox.width - 1,
				// Hover on the bottom of the paragraph block.
				paragraphBoundingBox.y + paragraphBoundingBox.height - 1
			);
		}

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		// Expect the indicator to be below the paragraph block.
		await expect
			.poll( () =>
				insertingBlocksUtils.indicator
					.boundingBox()
					.then( ( { y } ) => y )
			)
			.toBeGreaterThan( paragraphBoundingBox.y );

		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.mouse.up();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'cancels dragging patterns from the global inserter by pressing Escape', async ( {
		page,
		editor,
		insertingBlocksUtils,
	} ) => {
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
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await page.mouse.move(
				// Hover on the right side of the block to avoid collapsing with the preview.
				paragraphBoundingBox.x + paragraphBoundingBox.width - 1,
				// Hover on the bottom of the paragraph block.
				paragraphBoundingBox.y + paragraphBoundingBox.height - 1
			);
		}

		await expect( insertingBlocksUtils.indicator ).toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).toBeVisible();

		await page.keyboard.press( 'Escape' );

		await expect( insertingBlocksUtils.indicator ).not.toBeVisible();
		await expect( insertingBlocksUtils.draggableChip ).not.toBeVisible();

		await page.mouse.up();

		await expect.poll( editor.getEditedPostContent ).toBe( beforeContent );
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
		Promise.all( [
			requestUtils.deleteAllMedia(),
			requestUtils.deleteAllPosts(),
		] );
	} );
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );
	test( 'insert media from the global inserter', async ( {
		page,
		editor,
	} ) => {
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
}
