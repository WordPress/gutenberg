/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { pressKey, LINE_START_KEY } from './fixtures/keyboard-utils';

test.describe( 'Collaboration - Selection Rendering', () => {
	test( 'Text selection is visible to other users', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Selection Test - Forward Keyboard',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		// Dock the block toolbar at the top so the floating popover
		// doesn't overlap other paragraphs during clicks.
		await editor.setIsFixedToolbar( true );

		const { page2 } = collaborationUtils;

		// User A inserts a paragraph block with text content.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello World from User A' },
		} );

		// Wait for sync so User B sees the block.
		await expect
			.poll( () => collaborationUtils.editor2.getBlocks(), {
				timeout: 5000,
			} )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello World from User A' },
				},
			] );

		// Click the paragraph to place the cursor inside the contenteditable,
		// then forward-select "World" (offsets 6-11).
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( LINE_START_KEY );
		await pressKey( page, 'ArrowRight', 6 );
		await pressKey( page, 'Shift+ArrowRight', 5 );

		// User B should see selection highlight rectangles after sync.
		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const selectionRects = editorFrame.locator(
			'.collaborators-overlay-selection-rect'
		);

		await expect
			.poll( () => selectionRects.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		// Verify that the selection rect has non-zero dimensions.
		const firstRect = selectionRects.first();
		const boundingBox = await firstRect.boundingBox();
		expect( boundingBox ).toBeTruthy();
		expect( boundingBox!.width ).toBeGreaterThan( 0 );
		expect( boundingBox!.height ).toBeGreaterThan( 0 );
	} );

	test( 'Text selection across two blocks renders selections in both blocks', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Selection Test - Cross Block Keyboard',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		// Dock the block toolbar at the top so the floating popover
		// doesn't overlap other paragraphs during clicks.
		await editor.setIsFixedToolbar( true );

		const { page2 } = collaborationUtils;

		// User A inserts two paragraph blocks.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First paragraph text' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second paragraph text' },
		} );

		// Wait for sync so User B sees both blocks.
		await expect
			.poll( () => collaborationUtils.editor2.getBlocks(), {
				timeout: 5000,
			} )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'First paragraph text' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Second paragraph text' },
				},
			] );

		// Click the first paragraph to focus it.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( LINE_START_KEY );
		await pressKey( page, 'ArrowRight', 6 );
		await page.keyboard.press( 'Shift+ArrowDown' );

		// User B should see selection rects spanning both blocks.
		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const selectionRects = editorFrame.locator(
			'.collaborators-overlay-selection-rect'
		);

		// At least 2 rects: one for each block in the selection.
		await expect
			.poll( () => selectionRects.count(), { timeout: 15000 } )
			.toBeGreaterThanOrEqual( 2 );

		// Verify all rects have non-zero dimensions.
		const count = await selectionRects.count();
		for ( let i = 0; i < count; i++ ) {
			const box = await selectionRects.nth( i ).boundingBox();
			expect( box ).toBeTruthy();
			expect( box!.width ).toBeGreaterThan( 0 );
			expect( box!.height ).toBeGreaterThan( 0 );
		}
	} );

	test( 'Clearing a selection removes highlight rectangles', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Selection Test - Clear',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		// Dock the block toolbar at the top so the floating popover
		// doesn't overlap other paragraphs during clicks.
		await editor.setIsFixedToolbar( true );

		const { page2 } = collaborationUtils;

		// User A inserts a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Select and deselect me' },
		} );

		// Wait for sync.
		await expect
			.poll( () => collaborationUtils.editor2.getBlocks(), {
				timeout: 5000,
			} )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Select and deselect me' },
				},
			] );

		// User A selects text via keyboard.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.first()
			.click();
		await page.keyboard.press( LINE_START_KEY );
		await pressKey( page, 'Shift+ArrowRight', 6 );

		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const selectionRects = editorFrame.locator(
			'.collaborators-overlay-selection-rect'
		);

		// Wait for selection rects to appear on User B's side.
		await expect
			.poll( () => selectionRects.count(), { timeout: 15000 } )
			.toBeGreaterThan( 0 );

		// User A collapses the selection to a cursor (no text highlighted).
		await page.keyboard.press( 'ArrowLeft' );

		// Selection rects should disappear on User B's side.
		await expect
			.poll( () => selectionRects.count(), { timeout: 15000 } )
			.toBe( 0 );

		// But the cursor line should still be visible.
		const cursorLine = editorFrame.locator(
			'.collaborators-overlay-user-cursor'
		);
		await expect
			.poll( () => cursorLine.count(), { timeout: 5000 } )
			.toBeGreaterThan( 0 );
	} );
} );
