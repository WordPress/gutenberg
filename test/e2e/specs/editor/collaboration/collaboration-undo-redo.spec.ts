/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { pressKey, LINE_START_KEY } from './fixtures/keyboard-utils';

async function loadDefaultCategoryViaPublishPanel( page: Page ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Publish', exact: true } )
		.click();

	await page.waitForFunction(
		() => {
			const core = window.wp?.data?.select( 'core' );
			if ( ! core ) {
				return false;
			}
			const defaultCategoryId = core.getEntityRecord( 'root', 'site' )
				?.default_category;

			return (
				!! defaultCategoryId &&
				core.hasFinishedResolution( 'getEntityRecord', [
					'taxonomy',
					'category',
					defaultCategoryId,
				] )
			);
		},
		undefined,
		{ timeout: 15000 }
	);

	await page
		.getByRole( 'region', { name: 'Editor publish' } )
		.getByRole( 'button', { name: 'Cancel' } )
		.click();
}

async function getSelectionSnapshot( page: Page ) {
	return page.evaluate( () => {
		const blockEditor = window.wp.data.select( 'core/block-editor' );
		const selectionStart = blockEditor.getSelectionStart();
		const selectionEnd = blockEditor.getSelectionEnd();
		const blocks = blockEditor.getBlocks();
		const selectedBlock = selectionStart?.clientId
			? blockEditor.getBlock( selectionStart.clientId )
			: null;

		return {
			attributeKey: selectionStart?.attributeKey,
			blockIndex: blocks.findIndex(
				( block: { clientId: string } ) =>
					block.clientId === selectionStart?.clientId
			),
			content: selectedBlock?.attributes?.content,
			endOffset: selectionEnd?.offset,
			offset: selectionStart?.offset,
		};
	} );
}

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

		// Clear blocks on User B via editEntityRecord, simulating what
		// the Code Editor does (post-text-editor sets blocks: undefined
		// when the user edits HTML directly). The receiver-injected
		// content closure captured the synced blocks, so getEditedPostContent
		// should still return the right HTML even with blocks cleared.
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

	test( 'Undo restores the post selection when another synced entity is loaded', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Undo Selection Metadata Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Undo Selection Metadata Test' );

		// Opening the normal pre-publish panel loads the default category
		// entity, adding a second synced Yjs document to the page.
		await loadDefaultCategoryViaPublishPanel( page );

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'abcdef' );
		await page.keyboard.press( LINE_START_KEY );
		await pressKey( page, 'ArrowRight', 3 );

		await expect
			.poll( () => getSelectionSnapshot( page ), { timeout: 5000 } )
			.toMatchObject( {
				blockIndex: 0,
				content: 'abcdef',
				offset: 3,
			} );

		await page.keyboard.press( 'Enter' );
		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'abc' },
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'def' },
				},
			] );

		await page.keyboard.press( 'ControlOrMeta+z' );
		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'abcdef' },
				},
			] );

		await expect
			.poll( () => getSelectionSnapshot( page ), { timeout: 5000 } )
			.toMatchObject( {
				attributeKey: 'content',
				blockIndex: 0,
				content: 'abcdef',
				endOffset: 3,
				offset: 3,
			} );
	} );
} );
