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
		const bodyBox = await page
			.locator( '.interface-interface-skeleton__body' )
			.boundingBox();

		// The notice must reach (nearly) the right edge of the editor body.
		// A reserved sidebar column leaves a ~280px gap; allow a generous
		// tolerance for scrollbars and padding.
		expect(
			bodyBox.x + bodyBox.width - ( noticeBox.x + noticeBox.width )
		).toBeLessThan( 40 );
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
		const bodyBox = await page
			.locator( '.interface-interface-skeleton__body' )
			.boundingBox();

		// The canvas (and therefore its scrollbar) must reach the right
		// edge of the editor body instead of stopping at a sidebar column.
		expect(
			bodyBox.x + bodyBox.width - ( canvasBox.x + canvasBox.width )
		).toBeLessThan( 5 );
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

		const coverBox = await editor.canvas
			.locator( '[data-type="core/cover"]' )
			.first()
			.boundingBox();
		const threadBox = await page
			.getByRole( 'region', { name: 'Notes' } )
			.getByRole( 'treeitem', { name: 'Note: Cover note' } )
			.boundingBox();

		// The full-width block must stop before the notes panel begins.
		expect( coverBox.x + coverBox.width ).toBeLessThanOrEqual(
			threadBox.x + 1
		);
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
