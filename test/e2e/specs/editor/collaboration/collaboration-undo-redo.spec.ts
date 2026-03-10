/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Undo/Redo', () => {
	test( 'User A undo only affects their own changes, not User B changes', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Undo Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		// User B adds a block.
		await page2.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'From User B',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		// Wait for User B's block to appear on User A.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'From User B' },
				},
			] );

		// User A adds their own block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'From User A' },
		} );

		// Wait for both blocks to appear on User B.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			const contents = blocks.map(
				( b: { attributes: Record< string, unknown > } ) =>
					b.attributes.content
			);
			expect( contents ).toContain( 'From User A' );
			expect( contents ).toContain( 'From User B' );
		} ).toPass( { timeout: 5000 } );

		// User A performs undo via the data API.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).undo();
		} );

		// User A should see only User B's block (their own block is undone).
		await expect( async () => {
			const blocks = await editor.getBlocks();
			const contents = blocks.map(
				( b: { attributes: Record< string, unknown > } ) =>
					b.attributes.content
			);
			expect( contents ).not.toContain( 'From User A' );
			expect( contents ).toContain( 'From User B' );
		} ).toPass( { timeout: 5000 } );

		// User B should also see the undo result.
		await expect( async () => {
			const blocks = await editor2.getBlocks();
			const contents = blocks.map(
				( b: { attributes: Record< string, unknown > } ) =>
					b.attributes.content
			);
			expect( contents ).not.toContain( 'From User A' );
			expect( contents ).toContain( 'From User B' );
		} ).toPass( { timeout: 5000 } );
	} );

	test( 'Redo restores the undone change', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Redo Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// User A adds a block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Undoable content' },
		} );

		// Verify the block exists.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 3000 } )
			.toHaveLength( 1 );

		// Undo via data API.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).undo();
		} );

		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toHaveLength( 0 );

		// Redo via data API.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).redo();
		} );

		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Undoable content' },
				},
			] );
	} );
} );
