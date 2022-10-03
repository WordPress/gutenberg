/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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

		const firstBlockTagName = await page.evaluate( () => {
			return document.querySelector(
				'.block-editor-block-list__layout .wp-block'
			).tagName;
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

		test( 'should allow dropping an image on en empty paragraph block', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );

			const testImageName = '10x10_e2e_test_image_z9T8jK.png';
			const testImagePath = path.join(
				__dirname,
				'../../../assets',
				testImageName
			);

			const { dragOver, drop } = await pageUtils.dragFiles(
				testImagePath
			);

			await dragOver( '[data-type="core/paragraph"]' );

			await expect(
				page.locator( 'data-testid=block-popover-drop-zone' )
			).toBeVisible();

			await drop();

			const imageBlock = page.locator(
				'role=document[name="Block: Image"i]'
			);
			await expect( imageBlock ).toBeVisible();
			await expect( imageBlock.locator( 'role=img' ) ).toHaveAttribute(
				'src',
				new RegExp( testImageName.replace( '.', '\\.' ) )
			);
		} );

		test( 'should allow dropping blocks on en empty paragraph block', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'My Heading' },
			} );
			await editor.insertBlock( { name: 'core/paragraph' } );
			await page.focus( 'text=My Heading' );
			await editor.showBlockToolbar();

			const dragHandle = page.locator(
				'role=toolbar[name="Block tools"i] >> role=button[name="Drag"i][include-hidden]'
			);
			await dragHandle.hover();
			await page.mouse.down();

			const emptyParagraph = page.locator(
				'[data-type="core/paragraph"][data-empty="true"]'
			);
			const boundingBox = await emptyParagraph.boundingBox();
			// Call the move function twice to make sure the `dragOver` event is sent.
			// @see https://github.com/microsoft/playwright/issues/17153
			for ( let i = 0; i < 2; i += 1 ) {
				await page.mouse.move( boundingBox.x, boundingBox.y );
			}

			await expect(
				page.locator( 'data-testid=block-popover-drop-zone' )
			).toBeVisible();

			await page.mouse.up();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:heading -->
<h2>My Heading</h2>
<!-- /wp:heading -->` );
		} );

		test( 'should allow dropping HTML on en empty paragraph block', async ( {
			editor,
			page,
		} ) => {
			await editor.insertBlock( { name: 'core/paragraph' } );

			// Insert a dummy draggable element on the page to simulate dragging
			// HTML from other places.
			await page.evaluate( () => {
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
						event.dataTransfer.setData(
							'text/html',
							'<h2>My Heading</h2>'
						);
					},
					{ once: true }
				);

				document.body.appendChild( draggable );
			} );

			// This is where the dummy draggable element is at.
			await page.mouse.move( 0, 0 );
			await page.mouse.down();

			const emptyParagraph = page.locator(
				'[data-type="core/paragraph"][data-empty="true"]'
			);
			const boundingBox = await emptyParagraph.boundingBox();
			// Call the move function twice to make sure the `dragOver` event is sent.
			// @see https://github.com/microsoft/playwright/issues/17153
			for ( let i = 0; i < 2; i += 1 ) {
				await page.mouse.move( boundingBox.x, boundingBox.y );
			}

			await expect(
				page.locator( 'data-testid=block-popover-drop-zone' )
			).toBeVisible();

			await page.mouse.up();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:heading -->
<h2>My Heading</h2>
<!-- /wp:heading -->` );
		} );
	} );
} );
