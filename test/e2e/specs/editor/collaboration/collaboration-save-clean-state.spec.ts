import { test, expect } from './fixtures';

test.describe( 'Collaboration - Clean state after saving meta edits', () => {
	// Regression test: with collaboration enabled, every real post save
	// injects a fresh CRDT snapshot into `meta._crdt_document` via
	// `prePersistPostType`. Post meta edits snapshot the full edited meta
	// (including the load-time `_crdt_document`), so the persisted-edits
	// comparison that clears edits after a save must use the original edits,
	// not the augmented request payload — otherwise the meta edit survives
	// the save and the post stays permanently dirty.
	test( 'post is not dirty after saving a meta edit', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
		pageUtils,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Meta edit save test',
			content: '<!-- wp:paragraph --><p>Hello</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openPost( post.id );

		// Edit and save once so the post record carries a persisted CRDT
		// document in its meta, mirroring an existing post opened in a later
		// session. (An unedited post shows no "Save draft" button.)
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				title: 'Meta edit save test (edited)',
			} );
		} );
		await editor.saveDraft();

		// A meta change before save. Footnotes live in post meta, so this
		// stands in for any plugin writing post meta from the editor.
		await page.evaluate( () => {
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				meta: {
					footnotes: JSON.stringify( [
						{ id: 'e2e-note', content: 'A footnote' },
					] ),
				},
			} );
		} );

		// Sanity check: the meta edit marks the post dirty.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( true );

		// Arm a save-completion watcher, then save with the keyboard rather
		// than `editor.saveDraft()`: that helper waits for the saved
		// indicator, which the buggy behavior never reaches, and the failure
		// should land on the assertions below instead.
		await page.evaluate( () => {
			( window as any ).__e2eSaveSettled = new Promise( ( resolve ) => {
				const { select, subscribe } = window.wp.data;
				let sawSaving = false;
				const unsubscribe = subscribe( () => {
					if ( select( 'core/editor' ).isSavingPost() ) {
						sawSaving = true;
					} else if ( sawSaving ) {
						unsubscribe();
						resolve( true );
					}
				} );
			} );
		} );
		await pageUtils.pressKeys( 'primary+s' );
		await page.evaluate( () => ( window as any ).__e2eSaveSettled );

		// The saved meta edit must be cleared once the save response arrives.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).isEditedPostDirty()
				)
			)
			.toBe( false );

		// And the UI reflects the clean state.
		await expect(
			page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Saved' } )
		).toBeVisible();

		// The saved meta value round-tripped.
		await expect
			.poll( () =>
				page.evaluate( () => {
					const postId = window.wp.data
						.select( 'core/editor' )
						.getCurrentPostId();
					return window.wp.data
						.select( 'core' )
						.getEditedEntityRecord( 'postType', 'post', postId )
						?.meta?.footnotes;
				} )
			)
			.toContain( 'e2e-note' );
	} );
} );
