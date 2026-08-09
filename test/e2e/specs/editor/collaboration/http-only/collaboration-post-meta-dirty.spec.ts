import { test, expect } from '../fixtures';

/**
 * Regression test for https://github.com/WordPress/gutenberg/issues/77610.
 *
 * Every save mints a fresh `_crdt_document` snapshot for the post. It used to
 * be added to the edits that `saveEntityRecord` replays to the reducer as
 * `persistedEdits`, so the staged meta edit could never match it and the
 * reducer kept the edit. Saving a post meta change then left the post
 * permanently dirty: the Publish button stayed "Save" and leaving the editor
 * warned about unsaved changes, no matter how many times the post was saved.
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

		// Edit post meta through the store. `footnotes` is registered by core,
		// so this needs no test plugin, and it keeps the Footnote block UI —
		// which re-syncs the meta against the content — out of the way.
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

		// The save succeeded...
		expect(
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/editor' )
					.didPostSaveRequestSucceed()
			)
		).toBe( true );

		// ...the meta was really persisted...
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

		// ...and nothing is left staged, so leaving the editor is safe.
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
