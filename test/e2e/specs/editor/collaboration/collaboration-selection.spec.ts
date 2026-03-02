/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Selection Rendering', () => {
	test( 'Single-block text selection renders highlight rectangles on the other user screen', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Selection Test - Single Block',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

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

		// User A selects "World" (characters 6-11) in the first block.
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlockOrder();
			window.wp.data.dispatch( 'core/block-editor' ).selectionChange( {
				clientId: blocks[ 0 ],
				attributeKey: 'content',
				startOffset: 6,
				endOffset: 11,
			} );
		} );

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

	test( 'Multi-block text selection renders highlight rectangles across blocks', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Selection Test - Multi Block',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

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

		// User A makes a multi-block selection spanning both paragraphs.
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlockOrder();
			window.wp.data
				.dispatch( 'core/block-editor' )
				.multiSelect( blocks[ 0 ], blocks[ 1 ] );
		} );

		// User B should see selection highlight rectangles after sync.
		const editorFrame = page2.frameLocator(
			'iframe[name="editor-canvas"]'
		);
		const selectionRects = editorFrame.locator(
			'.collaborators-overlay-selection-rect'
		);

		// Multi-block selection should produce at least 2 rects (one per block).
		await expect
			.poll( () => selectionRects.count(), { timeout: 15000 } )
			.toBeGreaterThanOrEqual( 2 );
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

		// User A selects text in the paragraph.
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlockOrder();
			window.wp.data.dispatch( 'core/block-editor' ).selectionChange( {
				clientId: blocks[ 0 ],
				attributeKey: 'content',
				startOffset: 0,
				endOffset: 6,
			} );
		} );

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
		await page.evaluate( () => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlockOrder();
			window.wp.data.dispatch( 'core/block-editor' ).selectionChange( {
				clientId: blocks[ 0 ],
				attributeKey: 'content',
				startOffset: 0,
				endOffset: 0,
			} );
		} );

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
