const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * The floating notes panel should behave as part of the canvas surface
 * rather than as a layout-occupying sidebar. See #73917 and the design
 * discussion in #66377 / #77484.
 */
test.describe( 'Block Notes: floating panel', () => {
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

	test( 'a thin divider marks the boundary of the reserved notes space', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Divider note' );

		await expect(
			page
				.getByRole( 'region', { name: 'Notes' } )
				.getByRole( 'treeitem', { name: 'Note: Divider note' } )
		).toBeVisible();

		// The divider is a `:root::after` pseudo-element inside the canvas
		// (the body's overflow clip would cut a body-attached line short),
		// occupying the outermost pixel of the reserved space so clipped
		// full-bleed content meets it without covering it. Its color derives
		// from `currentColor`.
		const divider = await editor.canvas
			.locator( 'body' )
			.evaluate( ( body ) => {
				const view = body.ownerDocument.defaultView;
				const root = body.ownerDocument.documentElement;
				const style = view.getComputedStyle( root, '::after' );
				const reservedWidth = parseFloat(
					view.getComputedStyle( root ).paddingInlineEnd
				);
				return {
					position: style.position,
					insetInlineEnd: parseFloat( style.insetInlineEnd ),
					width: parseFloat( style.width ),
					height: parseFloat( style.height ),
					background: style.backgroundColor,
					reservedWidth,
					viewportHeight: view.innerHeight,
				};
			} );

		expect( divider.position ).toBe( 'fixed' );
		expect( divider.width ).toBe( 1 );
		// The divider's far edge lands exactly on the content boundary: flush
		// with full-bleed content clipped there, with no gap and no overlap.
		expect( divider.insetInlineEnd + divider.width ).toBe(
			divider.reservedWidth
		);
		// Spans the visible canvas top to bottom.
		expect( divider.height ).toBe( divider.viewportHeight );
		// Semi-transparent, derived from the canvas text color.
		expect( divider.background ).toMatch( /rgba\(|color\(|color-mix\(/ );
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

	test( 'floating notes yield when the canvas is too narrow', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Narrow canvas note' );

		const notes = page.getByRole( 'region', { name: 'Notes' } );

		// Reading the reserved padding applied to the canvas root.
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );

		// The Settings sidebar narrows the canvas without touching the admin
		// viewport, which stays above the large-viewport breakpoint - so only
		// the canvas-width guard (not the viewport gate) governs the panel.
		await editor.openDocumentSettingsSidebar();
		await page.setViewportSize( { width: 1200, height: 800 } );
		await expect( notes ).toBeVisible();
		expect( await getReservedWidth() ).toBeGreaterThan( 0 );

		// Shrink the window so the canvas (minus the sidebar) is narrower than
		// the panel needs, while the viewport itself stays "large".
		await page.setViewportSize( { width: 800, height: 800 } );

		// The floating panel yields and releases the reserved canvas padding so
		// it doesn't crowd the narrow content column.
		await expect( notes ).toBeHidden();
		expect( await getReservedWidth() ).toBe( 0 );

		// Widening the canvas again brings the panel (and reserved space) back.
		await page.setViewportSize( { width: 1200, height: 800 } );
		await expect( notes ).toBeVisible();
		expect( await getReservedWidth() ).toBeGreaterThan( 0 );
	} );

	test( 'adding a note on a canvas too narrow for floating notes opens All notes', async ( {
		editor,
		page,
	} ) => {
		// The admin viewport stays above the large-viewport breakpoint, but
		// the Settings sidebar leaves the canvas narrower than the floating
		// panel needs, so the floating panel can't show the new-note form.
		await page.setViewportSize( { width: 800, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph without notes' },
		} );
		await editor.openDocumentSettingsSidebar();

		await editor.clickBlockOptionsMenuItem( 'Add note' );

		const input = page.getByRole( 'textbox', {
			name: 'New note',
			exact: true,
		} );
		await expect( input ).toBeVisible();
		await expect( input ).toBeFocused();
		await expect(
			page.getByRole( 'region', { name: 'Notes' } )
		).toBeHidden();
	} );

	test( 'floating note is centered in the reserved space of a canvas narrower than the editor', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1600, height: 900 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Resized canvas note' );

		const settingsToggle = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Settings', exact: true } );
		if (
			( await settingsToggle.getAttribute( 'aria-expanded' ) ) === 'true'
		) {
			await settingsToggle.click();
		}

		// The tablet preview gives the canvas an explicit width and enables
		// the resize handles. Widening it past the tablet breakpoint makes it
		// a Desktop canvas again, still narrower than (and centered in) the
		// editor, so its edge no longer matches the editor edge.
		await page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'View', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Tablet' } ).click();
		await page.keyboard.press( 'Escape' );

		const handle = page
			.getByRole( 'separator', { name: 'Drag to resize' } )
			.first();
		const handleBox = await handle.boundingBox();
		const x = handleBox.x + handleBox.width / 2;
		const y = handleBox.y + handleBox.height / 2;
		await page.mouse.move( x, y );
		await page.mouse.down();
		// The handle resizes at double the pointer distance (the canvas is
		// centered), so this widens the canvas by 360px.
		await page.mouse.move( x - 180, y, { steps: 10 } );
		await page.mouse.up();

		const canvas = page.locator( 'iframe[name="editor-canvas"]' );
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );
		// Space is only reserved for a Desktop canvas.
		await expect.poll( getReservedWidth ).toBe( 280 );
		const editorBox = await page
			.locator( '.editor-visual-editor' )
			.boundingBox();
		const canvasBox = await canvas.boundingBox();
		expect( canvasBox.x + canvasBox.width ).toBeLessThan(
			editorBox.x + editorBox.width - 100
		);

		const thread = page.locator( '.editor-collab-sidebar-panel__thread' );
		await expect( thread ).toBeVisible();
		const contentEdge = await editor.canvas
			.locator( 'body' )
			.evaluate(
				( body ) => body.ownerDocument.documentElement.clientWidth
			);
		const gapEnd = canvasBox.x + contentEdge;
		const gapStart = gapEnd - 280;

		await expect
			.poll( async () => {
				const threadBox = await thread.boundingBox();
				const leftMargin = threadBox.x - gapStart;
				const rightMargin = gapEnd - ( threadBox.x + threadBox.width );
				return (
					leftMargin > 0 &&
					rightMargin > 0 &&
					Math.abs( leftMargin - rightMargin ) < 4
				);
			} )
			.toBe( true );
	} );

	test( 'floating notes do not react to the device preview', async ( {
		editor,
		page,
	} ) => {
		await page.setViewportSize( { width: 1450, height: 800 } );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Paragraph with a note' },
		} );
		await addNote( page, editor, 'Device preview note' );

		const notes = page.getByRole( 'region', { name: 'Notes' } );
		const setDevice = async ( device ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'View', exact: true } )
				.click();
			await page.getByRole( 'menuitemradio', { name: device } ).click();
			// The View menu stays open after choosing a device; close it so
			// the next interaction starts from a closed menu.
			await page.keyboard.press( 'Escape' );
		};

		// Reads the reserved padding applied to the canvas root.
		const getReservedWidth = () =>
			editor.canvas.locator( 'body' ).evaluate( ( body ) => {
				const root = body.ownerDocument.documentElement;
				return (
					parseFloat(
						body.ownerDocument.defaultView.getComputedStyle( root )
							.paddingInlineEnd
					) || 0
				);
			} );

		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 280 );

		// The device preview simulates a device width; the notes are editor
		// chrome, so they must neither hide at the simulated width nor
		// reserve space inside the previewed canvas (which would distort the
		// simulation).
		await setDevice( 'Tablet' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 0 );

		await setDevice( 'Mobile' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 0 );

		// Back to Desktop, the canvas reservation returns.
		await setDevice( 'Desktop' );
		await expect( notes ).toBeVisible();
		await expect.poll( getReservedWidth ).toBe( 280 );
	} );
} );
