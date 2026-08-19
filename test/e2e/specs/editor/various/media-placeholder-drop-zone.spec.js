const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	// Large enough that the canvas does not scroll while dragging, which would
	// move the drop target out from under the cursor.
	viewport: {
		width: 960,
		height: 1024,
	},
} );

/**
 * Moves the mouse to the given coordinates.
 *
 * The move is repeated because a single move does not reliably emit a
 * `dragOver` event.
 *
 * @see https://github.com/microsoft/playwright/issues/17153
 *
 * @param {Object} page Playwright page.
 * @param {number} x    Horizontal coordinate.
 * @param {number} y    Vertical coordinate.
 */
async function dragTo( page, x, y ) {
	for ( let i = 0; i < 2; i += 1 ) {
		await page.mouse.move( x, y );
	}
}

/**
 * Drags a block over an empty Gallery block's media placeholder and reports
 * how many drop zones are active while the drag is held over it.
 *
 * @param {Object} options
 * @param {Object} options.editor Editor utils.
 * @param {Object} options.page   Playwright page.
 * @param {Object} options.block  The block to insert and drag.
 *
 * @return {Promise<number>} The number of active drop zones.
 */
async function countActiveDropZonesWhileDragging( { editor, page, block } ) {
	await editor.insertBlock( block );
	await editor.insertBlock( { name: 'core/gallery' } );

	const placeholder = editor.canvas
		.locator( '.block-editor-media-placeholder' )
		.first();
	await expect( placeholder ).toBeVisible();
	const placeholderBox = await placeholder.boundingBox();

	await editor.selectBlocks(
		editor.canvas.locator( `[data-type="${ block.name }"]` ).first()
	);
	await editor.showBlockToolbar();

	await page
		.locator(
			'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
		)
		.hover();
	await page.mouse.down();
	await dragTo(
		page,
		placeholderBox.x + placeholderBox.width / 2,
		placeholderBox.y + placeholderBox.height / 2
	);

	const activeDropZones = await editor.canvas
		.locator( '.components-drop-zone.is-active' )
		.count();

	await page.mouse.up();

	return activeDropZones;
}

test.describe( 'MediaPlaceholder drop zone', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'does not activate for a paragraph dragged from the canvas', async ( {
		editor,
		page,
	} ) => {
		const activeDropZones = await countActiveDropZonesWhileDragging( {
			editor,
			page,
			block: {
				name: 'core/paragraph',
				attributes: { content: 'drag me' },
			},
		} );

		expect( activeDropZones ).toBe( 0 );
	} );

	test( 'does not activate for a media block of an unaccepted type', async ( {
		editor,
		page,
	} ) => {
		const activeDropZones = await countActiveDropZonesWhileDragging( {
			editor,
			page,
			block: {
				name: 'core/audio',
				attributes: {
					src: 'https://example.com/sound.mp3',
					id: 33,
				},
			},
		} );

		expect( activeDropZones ).toBe( 0 );
	} );

	// Guards the tests above: without this, they would also pass if the drop
	// zone never activated for anything.
	test( 'activates for an image dragged from the canvas', async ( {
		editor,
		page,
	} ) => {
		const activeDropZones = await countActiveDropZonesWhileDragging( {
			editor,
			page,
			block: {
				name: 'core/image',
				attributes: {
					url: 'https://example.com/photo.jpg',
					id: 22,
				},
			},
		} );

		expect( activeDropZones ).toBeGreaterThan( 0 );
	} );
} );
