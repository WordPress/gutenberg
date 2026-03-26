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

	test( 'Content in CRDT doc stays in sync when blocks are cleared', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Content CRDT Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2, editor2 } = collaborationUtils;

		// User A inserts a block. Block insertion triggers onChange
		// (a persistent edit) which passes content as a function.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Important work' },
		} );

		// Wait for User B to see the block.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Important work' },
				},
			] );

		// Wait for the CRDT content field to be synced on User B.
		await expect
			.poll(
				() =>
					page2.evaluate( () => {
						const postId = ( window as any ).wp.data
							.select( 'core/editor' )
							.getCurrentPostId();
						const record = ( window as any ).wp.data
							.select( 'core' )
							.getEditedEntityRecord(
								'postType',
								'post',
								postId
							);
						return typeof record?.content === 'string'
							? record.content
							: record?.content?.raw ?? '';
					} ),
				{ timeout: 5000 }
			)
			.toContain( 'Important work' );

		// Clear blocks on User B via editEntityRecord, simulating what
		// the Code Editor does (post-text-editor sets blocks: undefined
		// when the user edits HTML directly). Blocks must be re-parsed
		// from the CRDT content field.
		await page2.evaluate( () => {
			const postId = ( window as any ).wp.data
				.select( 'core/editor' )
				.getCurrentPostId();
			( window as any ).wp.data
				.dispatch( 'core' )
				.editEntityRecord( 'postType', 'post', postId, {
					blocks: undefined,
				} );
		} );

		// After blocks are cleared and re-parsed from content, User B
		// should still see the content. If the CRDT content field was
		// never synced (stale/empty), the blocks would be lost.
		await expect
			.poll(
				() =>
					page2.evaluate( () =>
						( window as any ).wp.data
							.select( 'core/editor' )
							.getEditedPostContent()
					),
				{ timeout: 5000 }
			)
			.toContain( 'Important work' );
	} );

	test( 'Post is marked dirty on both collaborators after User A inserts a block', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Dirty State Test',
			content:
				'<!-- wp:paragraph --><p>Initial</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// Both users should start with a clean (non-dirty) state.
		await expect
			.poll(
				() =>
					page2.evaluate( () =>
						( window as any ).wp.data
							.select( 'core/editor' )
							.isEditedPostDirty()
					),
				{ timeout: 5000 }
			)
			.toBe( false );

		// User A inserts a new block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'New content from A' },
		} );

		// User B should see the post as dirty after sync, because
		// the content field was updated in the CRDT doc.
		await expect
			.poll(
				() =>
					page2.evaluate( () =>
						( window as any ).wp.data
							.select( 'core/editor' )
							.isEditedPostDirty()
					),
				{ timeout: 5000 }
			)
			.toBe( true );
	} );
} );
