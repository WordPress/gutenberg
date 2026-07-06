/**
 * External dependencies
 */
import type { Page } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';

/**
 * Regression test for https://github.com/WordPress/gutenberg/issues/79907.
 *
 * Opening the pre-publish panel resolves the default category record, which
 * loads the term document into the sync manager. When another peer has the
 * same term document loaded, its updates are relayed to this client. The
 * default sync config must not report the unchanged record as edits when
 * those updates arrive. If it does, the term becomes dirty,
 * `hasNonPostEntityChanges()` returns true, and the Publish button silently
 * turns into "Save".
 */
test.describe( 'Collaboration - synced taxonomy records', () => {
	test( 'pre-publish panel does not dirty the default category record', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Taxonomy record dirty regression',
			content:
				'<!-- wp:paragraph --><p>Hello world</p><!-- /wp:paragraph -->',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		const publishPanelFor = ( target: Page ) =>
			target.locator( '.editor-post-publish-panel' );

		/*
		 * The toggle is aria-disabled while the editor initializes, which
		 * Playwright's actionability checks don't wait for, so retry the
		 * click until the panel opens.
		 */
		const openPrePublishPanel = async ( target: Page ) => {
			const toggle = target
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Publish', exact: true } );
			const panel = publishPanelFor( target );
			await expect( async () => {
				if ( ! ( await panel.isVisible() ) ) {
					await toggle.click();
				}
				await expect( panel ).toBeVisible( { timeout: 2000 } );
			} ).toPass( { timeout: 20000 } );
		};

		// Session 1: open the post and the pre-publish panel. This resolves
		// the default category record and loads the term document into the
		// sync manager, which starts exchanging it with the server.
		await collaborationUtils.openPost( post.id );
		await openPrePublishPanel( page );

		// Session 2: a second tab for the same user opens the same post and
		// panel. Each tab is a distinct sync client, so the term document
		// updates of one tab are relayed to the other.
		const page2 = await page.context().newPage();
		await page2.goto( `/wp-admin/post.php?post=${ post.id }&action=edit` );
		await collaborationUtils.waitForCollaborationReady( page2 );
		await openPrePublishPanel( page2 );

		// Wait until both tabs have exchanged sync messages that include the
		// default category room.
		const waitForCategorySyncExchange = ( target: Page ) =>
			target.waitForResponse(
				( response ) =>
					response.url().includes( 'wp-sync' ) &&
					response.status() === 200 &&
					( response.request().postData() ?? '' ).includes(
						'taxonomy/category'
					),
				{ timeout: 20000 }
			);
		await Promise.all( [
			waitForCategorySyncExchange( page ),
			waitForCategorySyncExchange( page2 ),
		] );

		// The relayed updates carry no actual changes, so the term record
		// must not accumulate edits in either tab. Poll across several sync
		// cycles; on regression the record turns dirty within one cycle.
		const watchForDirtyCategory = ( target: Page ) =>
			target.evaluate(
				() =>
					new Promise( ( resolve ) => {
						const started = Date.now();
						const interval = setInterval( () => {
							const hasEdits = window.wp.data
								.select( 'core' )
								.hasEditsForEntityRecord(
									'taxonomy',
									'category',
									1
								);
							if ( hasEdits ) {
								clearInterval( interval );
								resolve( true );
							} else if ( Date.now() - started > 10000 ) {
								clearInterval( interval );
								resolve( false );
							}
						}, 200 );
					} )
			);
		const [ becameDirty, becameDirty2 ] = await Promise.all( [
			watchForDirtyCategory( page ),
			watchForDirtyCategory( page2 ),
		] );
		expect( becameDirty ).toBe( false );
		expect( becameDirty2 ).toBe( false );

		// The user-visible symptom: the panel button must still read
		// "Publish", not "Save".
		await expect(
			publishPanelFor( page ).locator(
				'.editor-post-publish-button__button'
			)
		).toHaveText( 'Publish' );

		await page2.close();
	} );
} );
