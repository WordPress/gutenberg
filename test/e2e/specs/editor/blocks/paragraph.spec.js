/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.use( {
	draggingUtils: async ( { page }, use ) => {
		await use( new DraggingUtils( { page } ) );
	},
} );

test.describe( 'Paragraph', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'should output unwrapped editable paragraph', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
		} );
		await page.keyboard.type( '1' );

		const firstBlockTagName = await editor.canvas
			.locator( ':root' )
			.evaluate( () => {
				return document.querySelector( '[data-block]' ).tagName;
			} );

		// The outer element should be a paragraph. Blocks should never have any
		// additional div wrappers so the markup remains simple and easy to
		// style.
		expect( firstBlockTagName ).toBe( 'P' );
	} );

	test.describe( 'Empty paragraph', () => {
		test.use( {
			// Make the viewport large enough so that a scrollbar isn't displayed.
			// Otherwise, the page scrolling can interfere with the test runner's
			// ability to drop a block in the right location.
			viewport: {
				width: 960,
				height: 1024,
			},
		} );

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllMedia();
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllMedia();
		} );

		test( 'should allow dropping an image on an empty paragraph block', async ( {
			editor,
			pageUtils,
			draggingUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );

			const testImageName = '10x10_e2e_test_image_z9T8jK.png';
			const testImagePath = path.join(
				__dirname,
				'../../../assets',
				testImageName
			);

			const { dragOver, drop } =
				await pageUtils.dragFiles( testImagePath );

			await dragOver(
				editor.canvas.locator( '[data-type="core/paragraph"]' )
			);

			await expect( draggingUtils.dropZone ).toBeVisible();
			await expect( draggingUtils.insertionIndicator ).toBeHidden();

			await drop();

			const imageBlock = editor.canvas.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();
			await expect( imageBlock.locator( 'role=img' ) ).toHaveAttribute(
				'src',
				new RegExp( testImageName.replace( '.', '\\.' ) )
			);
		} );

		test( 'should allow dropping blocks on an empty paragraph block', async ( {
			editor,
			page,
			draggingUtils,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'My Heading' },
			} );
			await editor.insertBlock( { name: 'core/paragraph' } );
			await editor.canvas.locator( 'text=My Heading' ).focus();
			await editor.showBlockToolbar();

			const dragHandle = page.locator(
				'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
			);
			await dragHandle.hover();
			await page.mouse.down();

			const emptyParagraph = editor.canvas.locator(
				'[data-type="core/paragraph"][data-empty="true"]'
			);
			const boundingBox = await emptyParagraph.boundingBox();
			await draggingUtils.dragOver( boundingBox.x, boundingBox.y );

			await expect( draggingUtils.dropZone ).toBeVisible();
			await expect( draggingUtils.insertionIndicator ).toBeHidden();

			await page.mouse.up();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:heading -->
<h2 class="wp-block-heading">My Heading</h2>
<!-- /wp:heading -->` );
		} );

		test( 'should allow dropping HTML on an empty paragraph block', async ( {
			editor,
			page,
			draggingUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );

			await draggingUtils.simulateDraggingHTML(
				'<h2 class="wp-block-heading">My Heading</h2>'
			);

			const emptyParagraph = editor.canvas.locator(
				'[data-type="core/paragraph"][data-empty="true"]'
			);
			const boundingBox = await emptyParagraph.boundingBox();
			await draggingUtils.dragOver( boundingBox.x, boundingBox.y );

			await expect( draggingUtils.dropZone ).toBeVisible();
			await expect( draggingUtils.insertionIndicator ).toBeHidden();

			await page.mouse.up();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:heading -->
<h2 class="wp-block-heading">My Heading</h2>
<!-- /wp:heading -->` );
		} );

		test.describe( 'Dragging positions', () => {
			test( 'Only the first block is an empty paragraph block', async ( {
				editor,
				draggingUtils,
			} ) => {
				await editor.setContent( `
					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->

					<!-- wp:heading -->
					<h2>Heading</h2>
					<!-- /wp:heading -->
				` );

				const emptyParagraph = editor.canvas.locator(
					'[data-type="core/paragraph"]'
				);
				const heading = editor.canvas.locator( 'text=Heading' );

				await draggingUtils.simulateDraggingHTML(
					'<h2>Draggable</h2>'
				);

				const firstBlockBox = await emptyParagraph.boundingBox();
				const headingBox = await heading.boundingBox();

				{
					// Dragging on the top half of an empty paragraph block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the bottom half of an empty paragraph block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + firstBlockBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging below the empty paragraph block but not yet on the second block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + firstBlockBox.height + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the top half of the heading block.
					// Make sure to target the top dropzone by dragging > 30px inside the block.
					await draggingUtils.dragOver(
						headingBox.x + 32,
						headingBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the bottom half of the heading block.
					// Make sure to target the bottom dropzone by dragging > 30px inside the block.
					await draggingUtils.dragOver(
						headingBox.x + 32,
						headingBox.y + headingBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeHidden();
					await expect(
						draggingUtils.insertionIndicator
					).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.insertionIndicator
								.boundingBox()
								.then( ( { y, height } ) => y + height )
						)
						.toBeGreaterThan( headingBox.y + headingBox.height );
				}

				{
					// Dragging on the right edge of the heading block.
					// Targets the right hand dropzone.
					await draggingUtils.dragOver(
						headingBox.x + headingBox.width - 1,
						headingBox.y + headingBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeHidden();
					await expect(
						draggingUtils.insertionIndicator
					).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.insertionIndicator
								.boundingBox()
								.then( ( { x, width } ) => x + width )
						)
						.toBe( headingBox.x + headingBox.width );
				}
			} );

			test( 'Only the second block is an empty paragraph block', async ( {
				editor,
				draggingUtils,
			} ) => {
				await editor.setContent( `
					<!-- wp:heading -->
					<h2>Heading</h2>
					<!-- /wp:heading -->

					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->
				` );

				const emptyParagraph = editor.canvas.locator(
					'[data-type="core/paragraph"]'
				);
				const heading = editor.canvas.locator( 'text=Heading' );

				await draggingUtils.simulateDraggingHTML(
					'<h2>Draggable</h2>'
				);

				const secondBlockBox = await emptyParagraph.boundingBox();
				const headingBox = await heading.boundingBox();

				{
					// Dragging on the top half of the heading block.
					await draggingUtils.dragOver(
						headingBox.x + 32,
						headingBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeHidden();
					await expect(
						draggingUtils.insertionIndicator
					).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.insertionIndicator
								.boundingBox()
								.then( ( { y } ) => y )
						)
						.toBeLessThan( headingBox.y );
				}

				{
					// Dragging on the bottom half of the heading block.
					await draggingUtils.dragOver(
						headingBox.x + 32,
						headingBox.y + headingBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging below the heading block but not yet on the empty paragraph block.
					await draggingUtils.dragOver(
						headingBox.x,
						headingBox.y + headingBox.height + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the top half of the empty paragraph block.
					await draggingUtils.dragOver(
						secondBlockBox.x,
						secondBlockBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the bottom half of the empty paragraph block.
					await draggingUtils.dragOver(
						secondBlockBox.x,
						secondBlockBox.y + secondBlockBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}
			} );

			test( 'Both blocks are empty paragraph blocks', async ( {
				editor,
				draggingUtils,
			} ) => {
				await editor.setContent( `
					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->

					<!-- wp:paragraph -->
					<p></p>
					<!-- /wp:paragraph -->
				` );

				const firstEmptyParagraph = editor.canvas
					.locator( '[data-type="core/paragraph"]' )
					.first();
				const secondEmptyParagraph = editor.canvas
					.locator( '[data-type="core/paragraph"]' )
					.nth( 1 );

				await draggingUtils.simulateDraggingHTML(
					'<h2>Draggable</h2>'
				);

				const firstBlockBox = await firstEmptyParagraph.boundingBox();
				const secondBlockBox = await secondEmptyParagraph.boundingBox();

				{
					// Dragging on the top half of the first block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the bottom half of the first block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + firstBlockBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging slightly below the first block but not yet on the second block.
					await draggingUtils.dragOver(
						firstBlockBox.x,
						firstBlockBox.y + firstBlockBox.height + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								firstBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging slightly above the second block but not yet on the first block.
					await draggingUtils.dragOver(
						secondBlockBox.x,
						secondBlockBox.y - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the top half of the second block.
					await draggingUtils.dragOver(
						secondBlockBox.x,
						secondBlockBox.y + 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}

				{
					// Dragging on the bottom half of the second block.
					await draggingUtils.dragOver(
						secondBlockBox.x,
						secondBlockBox.y + secondBlockBox.height - 1
					);
					await expect( draggingUtils.dropZone ).toBeVisible();
					await expect
						.poll( () =>
							draggingUtils.confirmValidDropZonePosition(
								secondBlockBox
							)
						)
						.toBeTruthy();
				}
			} );
		} );
	} );
} );

class DraggingUtils {
	constructor( { page } ) {
		this.page = page;

		this.dropZone = page.locator( 'data-testid=block-popover-drop-zone' );
		this.insertionIndicator = page.locator(
			'data-testid=block-list-insertion-point-indicator'
		);
	}

	async dragOver( x, y ) {
		// Call the move function twice to make sure the `dragOver` event is sent.
		// @see https://github.com/microsoft/playwright/issues/17153
		for ( let i = 0; i < 2; i += 1 ) {
			await this.page.mouse.move( x, y );
		}
	}

	async simulateDraggingHTML( html ) {
		// Insert a dummy draggable element on the page to simulate dragging
		// HTML from other places. The dummy element will get removed once the drag starts.
		await this.page.evaluate( ( _html ) => {
			const draggable = document.createElement( 'div' );
			draggable.draggable = true;
			draggable.style.width = '10px';
			draggable.style.height = '10px';
			// Position it at the top left corner for convenience.
			draggable.style.position = 'fixed';
			draggable.style.top = 0;
			draggable.style.left = 0;
			draggable.style.zIndex = 999999;

			draggable.addEventListener(
				'dragstart',
				( event ) => {
					// Set the data transfer to some HTML on dragstart.
					event.dataTransfer.setData( 'text/html', _html );

					// Some browsers will cancel the drag if the source is immediately removed.
					setTimeout( () => {
						draggable.remove();
					}, 0 );
				},
				{ once: true }
			);

			document.body.appendChild( draggable );
		}, html );

		// This is where the dummy draggable element is at.
		await this.page.mouse.move( 0, 0 );
		await this.page.mouse.down();
	}

	async confirmValidDropZonePosition( element ) {
		// Check that both x and y axis of the dropzone
		// have a less than 1 difference with a given target element
		const box = await this.dropZone.boundingBox();
		if ( ! box ) {
			return false;
		}

		return (
			Math.abs( element.x - box.x ) < 1 &&
			Math.abs( element.y - box.y ) < 1
		);
	}
}
