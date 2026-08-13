const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// A 1x1 transparent GIF so the image blocks render without any media
// library setup.
const IMAGE_DATA_URI =
	'data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7';

const IMAGE = {
	name: 'core/image',
	attributes: { url: IMAGE_DATA_URI },
};

test.describe( 'In-between block inserter', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	// Inserting blocks leaves the last one selected, and its floating
	// toolbar sits exactly where these tests hover. Clear the selection
	// so the canvas is in the same resting state a reader starts from.
	async function deselect( page ) {
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/block-editor' ).clearSelectedBlock()
		);
	}

	// Moves the mouse away from the canvas, then to the given point. The
	// extra steps imitate real cursor movement, which the in-between
	// inserter needs to activate.
	async function hoverBoundary( page, x, y ) {
		await page.mouse.move( 0, 0 );
		await page.mouse.move( x, y, { steps: 10 } );
	}

	// The vertical midpoint of the gap between two stacked blocks.
	function gapBetween( box1, box2 ) {
		return {
			x: box1.x + box1.width / 2,
			y: ( box1.y + box1.height + box2.y ) / 2,
		};
	}

	test( 'appears between two images', async ( { editor, page } ) => {
		await editor.insertBlock( IMAGE );
		await editor.insertBlock( IMAGE );
		await deselect( page );
		const images = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const box1 = await images.nth( 0 ).boundingBox();
		const box2 = await images.nth( 1 ).boundingBox();

		const { x, y } = gapBetween( box1, box2 );
		await hoverBoundary( page, x, y );

		await expect(
			page.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	test( 'appears after the last of two images', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( IMAGE );
		await editor.insertBlock( IMAGE );
		await deselect( page );
		const images = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const box = await images.nth( 1 ).boundingBox();

		await hoverBoundary(
			page,
			box.x + box.width / 2,
			box.y + box.height + 10
		);

		await expect(
			page.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	test( 'appears before the first block, even a heading', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Heading' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );
		await deselect( page );
		const heading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		const box = await heading.boundingBox();

		await hoverBoundary( page, box.x + box.width / 2, box.y - 10 );

		await expect(
			page.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	test( 'appears between an image and a paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( IMAGE );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );
		await deselect( page );
		const image = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const box1 = await image.boundingBox();
		const box2 = await paragraph.boundingBox();

		const { x, y } = gapBetween( box1, box2 );
		await hoverBoundary( page, x, y );

		await expect(
			page.getByRole( 'button', { name: 'Add block' } )
		).toBeVisible();
	} );

	test( 'appears between two buttons in a row', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{ name: 'core/button', attributes: { text: 'One' } },
				{ name: 'core/button', attributes: { text: 'Two' } },
			],
		} );
		await deselect( page );
		const buttons = editor.canvas.getByRole( 'document', {
			name: 'Block: Button',
			exact: true,
		} );
		const box1 = await buttons.nth( 0 ).boundingBox();
		const box2 = await buttons.nth( 1 ).boundingBox();

		await hoverBoundary(
			page,
			( box1.x + box1.width + box2.x ) / 2,
			box1.y + box1.height / 2
		);

		// Inside a buttons row the inserter is labelled after the only
		// allowed block.
		await expect(
			page.getByRole( 'button', { name: 'Add button' } )
		).toBeVisible();
	} );

	test( 'is hidden between two paragraphs', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );
		await deselect( page );
		const paragraphs = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const box1 = await paragraphs.nth( 0 ).boundingBox();
		const box2 = await paragraphs.nth( 1 ).boundingBox();

		// First show the inserter before the first block, so that the later
		// hidden state can't be mistaken for the inserter not activating at
		// all.
		await hoverBoundary( page, box1.x + box1.width / 2, box1.y - 10 );
		const inserterButton = page.getByRole( 'button', {
			name: 'Add block',
		} );
		await expect( inserterButton ).toBeVisible();

		const { x, y } = gapBetween( box1, box2 );
		await hoverBoundary( page, x, y );

		await expect( inserterButton ).toBeHidden();
	} );

	test( 'is hidden between a paragraph and an image', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );
		await editor.insertBlock( IMAGE );
		await deselect( page );
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const image = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const box1 = await paragraph.boundingBox();
		const box2 = await image.boundingBox();

		// Positive control: the boundary before the first block shows the
		// inserter.
		await hoverBoundary( page, box1.x + box1.width / 2, box1.y - 10 );
		const inserterButton = page.getByRole( 'button', {
			name: 'Add block',
		} );
		await expect( inserterButton ).toBeVisible();

		const { x, y } = gapBetween( box1, box2 );
		await hoverBoundary( page, x, y );

		await expect( inserterButton ).toBeHidden();
	} );

	test( 'is hidden after a paragraph that is the last block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( IMAGE );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'A paragraph' },
		} );
		await deselect( page );
		const paragraph = editor.canvas.getByRole( 'document', {
			name: 'Block: Paragraph',
		} );
		const box = await paragraph.boundingBox();

		// Positive control: the boundary above the paragraph shows the
		// inserter because an image is above it.
		const image = editor.canvas.getByRole( 'document', {
			name: 'Block: Image',
		} );
		const imageBox = await image.boundingBox();
		const { x, y } = gapBetween( imageBox, box );
		await hoverBoundary( page, x, y );
		const inserterButton = page.getByRole( 'button', {
			name: 'Add block',
		} );
		await expect( inserterButton ).toBeVisible();

		await hoverBoundary(
			page,
			box.x + box.width / 2,
			box.y + box.height + 10
		);

		await expect( inserterButton ).toBeHidden();
	} );
} );
