/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Sync', () => {
	test( 'User A adds a paragraph block, User B sees it', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Sync Test - A to B',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		// User A inserts a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello from User A' },
		} );

		// User B should see the paragraph after sync propagation.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello from User A' },
				},
			] );
	} );

	test( 'User B adds a paragraph block, User A sees it', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Sync Test - B to A',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User B inserts a paragraph block via the data API.
		await page2.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Hello from User B',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		// User A should see the paragraph after sync propagation.
		await expect
			.poll( () => editor.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello from User B' },
				},
			] );
	} );

	test( 'Both users add blocks simultaneously, both changes appear', async ( {
		collaborationUtils,
		requestUtils,
		editor,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Sync Test - Simultaneous',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		// Both users insert blocks concurrently.
		await Promise.all( [
			editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'From User A' },
			} ),
			page2.evaluate( () => {
				const block = window.wp.blocks.createBlock( 'core/paragraph', {
					content: 'From User B',
				} );
				window.wp.data
					.dispatch( 'core/block-editor' )
					.insertBlock( block );
			} ),
		] );

		// Both users should eventually see both blocks.
		for ( const ed of [ editor, editor2 ] ) {
			await expect( async () => {
				const blocks = await ed.getBlocks();
				const contents = blocks.map(
					( b: { attributes: Record< string, unknown > } ) =>
						b.attributes.content
				);
				expect( contents ).toContain( 'From User A' );
				expect( contents ).toContain( 'From User B' );
			} ).toPass( { timeout: 5000 } );
		}
	} );

	test( 'Title changes sync between users', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Sync Test - Title',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { page2 } = collaborationUtils;

		// User A changes the title.
		await page.evaluate( () => {
			window.wp.data
				.dispatch( 'core/editor' )
				.editPost( { title: 'New Title from User A' } );
		} );

		// User B should see the updated title after sync propagation.
		await expect
			.poll(
				() =>
					page2.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.getEditedPostAttribute( 'title' )
					),
				{ timeout: 5000 }
			)
			.toBe( 'New Title from User A' );
	} );
} );
