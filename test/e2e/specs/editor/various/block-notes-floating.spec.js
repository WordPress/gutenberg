/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * The floating notes panel should behave as part of the canvas surface
 * rather than as a layout-occupying sidebar. See #73917 and the design
 * discussion in #66377 / #77484.
 */
test.describe( 'Notes canvas layout', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	async function addNote( page, editor, comment ) {
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( comment );
		await page
			.getByRole( 'region', { name: /Notes|Editor settings/ } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			page
				.getByRole( 'region', { name: /Notes|Editor settings/ } )
				.getByRole( 'treeitem', { name: `Note: ${ comment }` } )
		).toBeVisible();
	}

	test( 'notices span the full width of the editor when notes are visible', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Layout test note' );

		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/notices' )
				.createNotice( 'info', 'Full width notice test', {
					isDismissible: true,
				} );
		} );

		const notice = page
			.locator( '.components-notice' )
			.filter( { hasText: 'Full width notice test' } );
		await expect( notice ).toBeVisible();

		const noticeBox = await notice.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const notesBox = await page
			.locator( '.editor-collab-sidebar, .editor-collab-sidebar-overlay' )
			.boundingBox();

		// The notice must reach (nearly) the right edge of the visual canvas
		// surface: the canvas itself plus any notes area painted beside it.
		// A notes column outside the canvas leaves a ~280px gap; allow a
		// generous tolerance for scrollbars and padding.
		const surfaceRight = Math.max(
			canvasBox.x + canvasBox.width,
			notesBox.x + notesBox.width
		);
		expect( surfaceRight - ( noticeBox.x + noticeBox.width ) ).toBeLessThan(
			40
		);
	} );

	test( 'canvas iframe spans the full editor width when notes are visible', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Canvas width note' );

		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const contentBox = await page
			.locator( '.interface-interface-skeleton__content' )
			.boundingBox();
		const notesBox = await page
			.locator( '.editor-collab-sidebar, .editor-collab-sidebar-overlay' )
			.boundingBox();

		// The canvas (and therefore its scrollbar) must reach the right
		// edge of the editor content area instead of stopping at a notes
		// column, and the notes must overlay the canvas, not sit beside it.
		expect(
			contentBox.x + contentBox.width - ( canvasBox.x + canvasBox.width )
		).toBeLessThan( 5 );
		expect( notesBox.x ).toBeGreaterThanOrEqual( canvasBox.x );
		expect( notesBox.x + notesBox.width ).toBeLessThanOrEqual(
			canvasBox.x + canvasBox.width + 1
		);
	} );

	test( 'floating notes do not overlap full-width content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/cover',
			attributes: {
				align: 'full',
				customOverlayColor: '#111111',
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Full width cover' },
				},
			],
		} );
		// Select the cover block (parent of the selected paragraph).
		await page.keyboard.press( 'Escape' );
		await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.click( { position: { x: 10, y: 10 } } );
		await addNote( page, editor, 'Cover note' );

		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Cover note' } )
		).toBeVisible();

		// The full-width block must not render (or hit-test) inside the
		// space reserved for the notes; probe a point inside that area at
		// the cover's vertical center.
		const coverBox = await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		const probe = {
			// Canvas-local coordinates, 100px inside the reserved area.
			x: canvasBox.width - 100,
			y: coverBox.y - canvasBox.y + coverBox.height / 2,
		};
		const hitsCover = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body, point ) => {
				const el = body.ownerDocument.elementFromPoint(
					point.x,
					point.y
				);
				return !! el?.closest( '[data-type="core/cover"]' );
			}, probe );
		expect( hitsCover ).toBe( false );
	} );

	test( 'floating note is centered in the space reserved beside full-width content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/cover',
			attributes: {
				align: 'full',
				customOverlayColor: '#111111',
				minHeight: 2000,
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Full width cover' },
				},
			],
		} );
		// Select the cover block (parent of the selected paragraph).
		await page.keyboard.press( 'Escape' );
		await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.click( { position: { x: 10, y: 10 } } );
		await addNote( page, editor, 'Centered note' );

		const thread = page.locator( '.editor-collab-sidebar-panel__thread' );
		await expect( thread ).toBeVisible();

		const threadBox = await thread.boundingBox();
		const canvasBox = await page
			.locator( 'iframe[name="editor-canvas"]' )
			.boundingBox();
		// The reserved space is the padding applied to the canvas root. It ends
		// where the scrollbar begins (the content edge), inset from the window
		// edge by the scrollbar width; a tall cover forces the scrollbar so this
		// exercises the scrollbar-width offset. Measuring the reserved padding
		// directly is robust: the full-bleed cover's own box escapes the padding
		// with negative margins and is only clipped visually, so its reported
		// box can't delimit the gap.
		const { contentEdge, reservedWidth } = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => {
				const doc = body.ownerDocument;
				const root = doc.documentElement;
				return {
					contentEdge: root.clientWidth,
					reservedWidth: parseFloat(
						doc.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					),
				};
			} );

		const gapEnd = canvasBox.x + contentEdge;
		const gapStart = gapEnd - reservedWidth;
		const leftMargin = threadBox.x - gapStart;
		const rightMargin = gapEnd - ( threadBox.x + threadBox.width );

		// The note must sit inside the reserved space with balanced margins,
		// not tucked against the scrollbar. Before the fix the overlay was
		// shifted out by the scrollbar width (~31px/1px left/right on Linux).
		expect( leftMargin ).toBeGreaterThan( 0 );
		expect( rightMargin ).toBeGreaterThan( 0 );
		expect( Math.abs( leftMargin - rightMargin ) ).toBeLessThan( 4 );
	} );

	test( 'floating notes remain visible when the Settings sidebar is open', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1400, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Coexistence note' );

		await editor.openDocumentSettingsSidebar();
		await expect(
			page.getByRole( 'region', { name: 'Editor settings' } )
		).toBeVisible();
		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Coexistence note' } )
		).toBeVisible();
	} );

	test( 'opening the All notes sidebar hides the floating notes panel', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Archive note' );

		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'All notes', exact: true } )
			.click();

		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', { name: 'Note: Archive note' } )
		).toBeVisible();
	} );

	test( 'floating notes panel is not rendered on small viewports', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Small viewport note' );

		await page.setViewportSize( { width: 600, height: 800 } );
		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
	} );
} );
