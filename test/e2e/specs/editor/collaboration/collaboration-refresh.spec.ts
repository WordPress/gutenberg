/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

test.describe( 'Collaboration - Refresh', () => {
	test( 'User A edits are synced to User B after User A refreshes', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Refresh Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		// Step 1: User A opens the post, adds content, and saves.
		await collaborationUtils.openPost( post.id );

		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( 'Saved content from User A' );

		await editor.saveDraft();

		// Step 2: User B loads the post and adds content.
		const { page: page2, editor: editor2 } =
			await collaborationUtils.joinUser( post.id, SECOND_USER );

		// Wait for both users to discover each other via awareness.
		await collaborationUtils.waitForMutualDiscovery( { timeout: 30000 } );

		// User B adds content below the existing paragraph.
		await editor2.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last()
			.click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.press( 'Enter' );
		await page2.keyboard.type( 'Content from User B' );

		// User A should see User B's content.
		await expect
			.poll(
				async () => {
					const blocks = await editor.getBlocks();
					return blocks.map(
						( b: { attributes: Record< string, unknown > } ) =>
							b.attributes.content
					);
				},
				{ timeout: 5000 }
			)
			.toContain( 'Content from User B' );

		// Step 3: User A refreshes the page.
		await page.reload( { waitUntil: 'load' } );

		// Wait for collaboration to re-initialize after refresh.
		await collaborationUtils.waitForCollaborationReady( page );

		// Wait for both users to re-discover each other via awareness.
		await collaborationUtils.waitForMutualDiscovery( { timeout: 30000 } );

		// Step 4: User A adds new content after refresh.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.last()
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.press( 'Enter' );
		await page.keyboard.type( 'After refresh from User A' );

		// User B should see User A's new content.
		await expect
			.poll(
				async () => {
					const blocks = await editor2.getBlocks();
					return blocks.map(
						( b: { attributes: Record< string, unknown > } ) =>
							b.attributes.content
					);
				},
				{ timeout: 5000 }
			)
			.toContain( 'After refresh from User A' );
	} );
} );
