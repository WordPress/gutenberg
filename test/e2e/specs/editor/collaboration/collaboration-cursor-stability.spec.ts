/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Cursor Stability', () => {
	test( 'cursor position is preserved when a collaborator applies bold formatting before the cursor', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const PARAGRAPH_TEXT =
			'Vivamus diam purus, volutpat id auctor nec, vehicula nec eros. Nam ac dui vel dui placerat cursus. Nulla sed tempus lorem. Integer finibus eget nulla in laoreet. Pellentesque ultrices eu lorem sed interdum.';

		// "Vivamus diam purus, volutpat id auctor nec," = 44 characters.
		const CURSOR_OFFSET = 44;

		const post = await requestUtils.createPost( {
			title: 'Cursor Stability Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		// User 1 inserts a paragraph block with the test text.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: PARAGRAPH_TEXT },
		} );

		// Wait for the paragraph to sync to User 2.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: PARAGRAPH_TEXT },
				},
			] );

		// User 1 places cursor at offset 44 (after first "nec,").
		await page.evaluate( ( offset ) => {
			const blocks = window.wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			window.wp.data.dispatch( 'core/block-editor' ).resetSelection(
				{
					clientId: blocks[ 0 ].clientId,
					attributeKey: 'content',
					offset,
				},
				{
					clientId: blocks[ 0 ].clientId,
					attributeKey: 'content',
					offset,
				},
				0
			);
		}, CURSOR_OFFSET );

		// Verify the cursor was set correctly.
		const initialSelection = await page.evaluate( () => ( {
			startOffset: window.wp.data
				.select( 'core/block-editor' )
				.getSelectionStart().offset,
			endOffset: window.wp.data
				.select( 'core/block-editor' )
				.getSelectionEnd().offset,
		} ) );
		expect( initialSelection.startOffset ).toBe( CURSOR_OFFSET );
		expect( initialSelection.endOffset ).toBe( CURSOR_OFFSET );

		// Allow the selection to be tracked in the CRDT selection history.
		// The awareness layer subscribes to selection changes and creates
		// a Y.RelativePosition via setTimeout(fn, 0), so we flush the
		// queue before proceeding.
		await page.evaluate(
			() => new Promise( ( resolve ) => setTimeout( resolve, 0 ) )
		);

		// User 2 applies bold formatting to "purus" by updating the block
		// content. This inserts <strong></strong> HTML tags before the cursor.
		await page2.evaluate( () => {
			const blocks = ( window as any ).wp.data
				.select( 'core/block-editor' )
				.getBlocks();
			const block = blocks[ 0 ];
			const newContent = block.attributes.content.replace(
				'purus',
				'<strong>purus</strong>'
			);
			( window as any ).wp.data
				.dispatch( 'core/block-editor' )
				.updateBlockAttributes( block.clientId, {
					content: newContent,
				} );
		} );

		// Wait for the bold formatting to sync to User 1.
		await expect
			.poll(
				async () => {
					const blocks = await editor.getBlocks();
					return blocks[ 0 ]?.attributes?.content;
				},
				{ timeout: 5000 }
			)
			.toContain( '<strong>purus</strong>' );

		// Assert that User 1's cursor offset is still 44.
		const finalSelection = await page.evaluate( () => ( {
			startOffset: window.wp.data
				.select( 'core/block-editor' )
				.getSelectionStart().offset,
			endOffset: window.wp.data
				.select( 'core/block-editor' )
				.getSelectionEnd().offset,
		} ) );

		expect( finalSelection.startOffset ).toBe( CURSOR_OFFSET );
		expect( finalSelection.endOffset ).toBe( CURSOR_OFFSET );
	} );
} );
