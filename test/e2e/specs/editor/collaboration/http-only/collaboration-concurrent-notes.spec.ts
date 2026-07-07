/**
 * External dependencies
 */
import type { Page, Route } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';

/**
 * Regression test for https://github.com/WordPress/gutenberg/issues/74751.
 *
 * When two collaborators attached a note to the same block at the same
 * moment, the block `metadata` attribute was merged last-writer-wins in the
 * CRDT document and one peer's note id was discarded. That note then
 * appeared as attached to a deleted block ("Original block deleted") for its
 * author and was invisible to everyone else.
 *
 * The test forces true concurrency by holding all wp-sync requests on both
 * pages while each user adds a note, then releasing them so the concurrent
 * updates merge. It lives in `http-only/` because pausing replication via
 * request interception only works with the HTTP polling provider.
 */
test.describe( 'Collaboration - concurrent notes on the same block', () => {
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
	} );

	test( 'notes added by two users at the same moment both survive', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Concurrent Notes Test',
			status: 'draft',
			content:
				'<!-- wp:paragraph --><p>Shared note target</p><!-- /wp:paragraph -->',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2, editor2 } = collaborationUtils;

		// Both users select the same paragraph block.
		for ( const [ pg, ed ] of [
			[ page, editor ],
			[ page2, editor2 ],
		] as const ) {
			await ed.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Shared note target' } )
				.click();
			await expect(
				pg.getByRole( 'toolbar', { name: 'Block tools' } )
			).toBeVisible();
		}

		// Pause replication: hold every wp-sync request on both pages so
		// neither user's changes reach the other until both notes exist.
		const heldRoutes: Route[] = [];
		const holdSync = async ( route: Route ) => {
			heldRoutes.push( route );
		};
		const isSyncRequest = ( url: URL ) => url.href.includes( 'wp-sync' );
		await page.route( isSyncRequest, holdSync );
		await page2.route( isSyncRequest, holdSync );

		// User A adds a note to the block.
		await editor.clickBlockOptionsMenuItem( 'Add note' );
		await page
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'Concurrent note from User A' );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Concurrent note from User A',
				} )
		).toBeVisible();

		// User B adds a note to the same block, unaware of User A's note.
		await editor2.clickBlockOptionsMenuItem( 'Add note' );
		await page2
			.getByRole( 'textbox', { name: 'New note', exact: true } )
			.fill( 'Concurrent note from User B' );
		await page2
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'button', { name: 'Add note', exact: true } )
			.click();
		await expect(
			page2
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'treeitem', {
					name: 'Note: Concurrent note from User B',
				} )
		).toBeVisible();

		// Resume replication and release the held requests.
		await page.unroute( isSyncRequest, holdSync );
		await page2.unroute( isSyncRequest, holdSync );
		for ( const route of heldRoutes ) {
			// A held request may have been aborted in the meantime.
			await route.continue().catch( () => {} );
		}

		// Let the concurrent updates converge on both pages.
		await collaborationUtils.waitForSyncCycle( page );
		await collaborationUtils.waitForSyncCycle( page2 );

		// The block should reference both notes on both pages.
		const getFirstBlockNoteIds = ( pg: Page ) =>
			pg.evaluate( () => {
				const blocks = (
					window as unknown as {
						wp: {
							data: {
								select: ( store: string ) => {
									getBlocks: () => Array< {
										attributes?: {
											metadata?: {
												noteId?: number[];
											};
										};
									} >;
								};
							};
						};
					}
				 ).wp.data
					.select( 'core/block-editor' )
					.getBlocks();
				return blocks[ 0 ]?.attributes?.metadata?.noteId ?? [];
			} );

		for ( const pg of [ page, page2 ] ) {
			await expect
				.poll( () => getFirstBlockNoteIds( pg ), {
					timeout: 15000,
				} )
				.toHaveLength( 2 );
		}

		// Both note threads are visible to both users, and neither note is
		// orphaned ("Original block deleted").
		for ( const pg of [ page, page2 ] ) {
			const toggleButton = pg
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'All notes', exact: true } );
			await expect( toggleButton ).toBeVisible( { timeout: 10000 } );
			if (
				( await toggleButton.getAttribute( 'aria-expanded' ) ) ===
				'false'
			) {
				await toggleButton.click();
			}

			const allNotes = pg.getByRole( 'tree', { name: 'All notes' } );
			await expect(
				allNotes.getByRole( 'treeitem', {
					name: 'Note: Concurrent note from User A',
				} )
			).toBeVisible( { timeout: 10000 } );
			await expect(
				allNotes.getByRole( 'treeitem', {
					name: 'Note: Concurrent note from User B',
				} )
			).toBeVisible( { timeout: 10000 } );
			await expect(
				pg
					.getByRole( 'region', { name: 'Editor settings' } )
					.getByText( 'Original block deleted' )
			).toBeHidden();
		}
	} );
} );
