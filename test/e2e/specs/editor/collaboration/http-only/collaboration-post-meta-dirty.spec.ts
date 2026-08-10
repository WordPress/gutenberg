import { test, expect } from '../fixtures';

/**
 * Regression test for https://github.com/WordPress/gutenberg/issues/77610.
 *
 * Saving a post meta change used to leave the post dirty forever: the fresh
 * `_crdt_document` snapshot reached the reducer as `persistedEdits`, so the
 * staged meta edit never matched it and was never cleared.
 */
test.describe( 'Collaboration - saving post meta', () => {
	test( 'a saved post meta change leaves the post clean', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Post meta dirty regression',
			content:
				'<!-- wp:paragraph --><p>Hello world</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openPost( post.id );
		await collaborationUtils.waitForEntityReadyAndSaveSettled( page );

		// `footnotes` is registered by core, so this needs no test plugin.
		// Going through the store keeps the Footnote block UI, which re-syncs
		// the meta against the content, out of the way.
		const footnotes =
			'[{"id":"post-meta-dirty-regression","content":"A footnote"}]';
		await page.evaluate(
			( { postId, value } ) =>
				window.wp.data
					.dispatch( 'core' )
					.editEntityRecord( 'postType', 'post', postId, {
						meta: { footnotes: value },
					} ),
			{ postId: post.id, value: footnotes }
		);

		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( true );

		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).savePost()
		);
		await collaborationUtils.waitForEntityReadyAndSaveSettled( page );

		expect(
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/editor' )
					.didPostSaveRequestSucceed()
			)
		).toBe( true );

		// The edit was persisted, not just discarded.
		expect(
			await page.evaluate(
				( postId ) =>
					window.wp.data
						.select( 'core' )
						.getEntityRecord( 'postType', 'post', postId )?.meta
						?.footnotes,
				post.id
			)
		).toBe( footnotes );

		expect(
			await page.evaluate(
				( postId ) =>
					window.wp.data
						.select( 'core' )
						.hasEditsForEntityRecord( 'postType', 'post', postId ),
				post.id
			)
		).toBe( false );
		expect(
			await page.evaluate( () =>
				window.wp.data.select( 'core/editor' ).isEditedPostDirty()
			)
		).toBe( false );
	} );
} );
