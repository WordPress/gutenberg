/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

test.describe( 'Collaboration - Lazy Sync', () => {
	test.describe( 'Scenario A: Single user editing (deferred connection)', () => {
		test( 'solo user sees only presence_only polls, not full sync', async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Lazy Sync - Solo Editing',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// Collect sync requests to distinguish presence-only vs full sync.
			const syncRequests: Array< {
				presenceOnly: boolean;
				body: unknown;
			} > = [];

			page.on( 'request', ( request ) => {
				if ( request.url().includes( 'wp-sync' ) ) {
					try {
						const postData = request.postData();
						if ( postData ) {
							const body = JSON.parse( postData );
							syncRequests.push( {
								presenceOnly: body.presence_only === true,
								body,
							} );
						}
					} catch {
						// Ignore parse errors.
					}
				}
			} );

			// Open the post as a single user (no collaborator).
			await collaborationUtils.openPost( post.id );

			// Wait for at least 2 presence polls to occur (~20s).
			await expect
				.poll( () => syncRequests.length, {
					timeout: 25000,
					intervals: [ 2000 ],
				} )
				.toBeGreaterThanOrEqual( 2 );

			// All sync requests should be presence_only.
			const presenceOnlyRequests = syncRequests.filter(
				( r ) => r.presenceOnly
			);
			const fullSyncRequests = syncRequests.filter(
				( r ) => ! r.presenceOnly
			);

			expect( presenceOnlyRequests.length ).toBeGreaterThanOrEqual( 2 );
			expect( fullSyncRequests.length ).toBe( 0 );

			// User can still edit locally while in deferred mode.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Solo edit while deferred' },
			} );

			await expect
				.poll( () => editor.getBlocks(), { timeout: 3000 } )
				.toMatchObject( [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Solo edit while deferred',
						},
					},
				] );

			// Undo should work in deferred mode.
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).undo();
			} );

			await expect
				.poll( () => editor.getBlocks(), { timeout: 3000 } )
				.toHaveLength( 0 );

			// Redo should also work.
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).redo();
			} );

			await expect
				.poll( () => editor.getBlocks(), { timeout: 3000 } )
				.toMatchObject( [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Solo edit while deferred',
						},
					},
				] );

			// Save should work in deferred mode.
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).savePost();
			} );

			await expect
				.poll(
					() =>
						page.evaluate( () =>
							window.wp.data
								.select( 'core/editor' )
								.isSavingPost()
						),
					{ timeout: 10000 }
				)
				.toBe( false );

			// Verify saved content.
			await expect
				.poll( () => editor.getBlocks(), { timeout: 3000 } )
				.toMatchObject( [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Solo edit while deferred',
						},
					},
				] );
		} );
	} );

	test.describe( 'Scenario B: Second user joins (triggers full sync)', () => {
		test( 'presence detector upgrades to full sync when collaborator joins', async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Lazy Sync - Upgrade Test',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// Track request types on User 1's page.
			const user1SyncRequests: Array< {
				presenceOnly: boolean;
				timestamp: number;
			} > = [];

			page.on( 'request', ( request ) => {
				if ( request.url().includes( 'wp-sync' ) ) {
					try {
						const postData = request.postData();
						if ( postData ) {
							const body = JSON.parse( postData );
							user1SyncRequests.push( {
								presenceOnly:
									body.presence_only === true,
								timestamp: Date.now(),
							} );
						}
					} catch {
						// Ignore parse errors.
					}
				}
			} );

			// Step 1: User 1 opens the post (solo — deferred connection).
			await collaborationUtils.openPost( post.id );

			// User 1 makes an edit while still solo.
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Edit made while solo' },
			} );

			// Wait for at least 1 presence-only poll.
			await expect
				.poll( () => user1SyncRequests.length, {
					timeout: 15000,
					intervals: [ 2000 ],
				} )
				.toBeGreaterThanOrEqual( 1 );

			// Confirm initial polls are presence-only.
			const initialRequests = [ ...user1SyncRequests ];
			expect(
				initialRequests.every( ( r ) => r.presenceOnly )
			).toBe( true );

			// Step 2: User 2 joins the same post.
			const { editor: editor2 } = await collaborationUtils.joinUser(
				post.id,
				{
					username: 'collaborator',
					email: 'collaborator@example.com',
					firstName: 'Test',
					lastName: 'Collaborator',
					password: 'password',
					roles: [ 'editor' ],
				}
			);

			// Step 3: Wait for mutual discovery — this means User 1's
			// presence detector fired and full sync connected.
			await collaborationUtils.waitForMutualDiscovery( {
				timeout: 30000,
			} );

			// Step 4: Verify User 1 transitioned to full sync.
			// After collaborator detection, there should be non-presence-only requests.
			await expect
				.poll(
					() =>
						user1SyncRequests.filter( ( r ) => ! r.presenceOnly )
							.length,
					{ timeout: 15000, intervals: [ 1000 ] }
				)
				.toBeGreaterThanOrEqual( 1 );

			// Step 5: Verify User 1's solo edit is visible to User 2.
			await expect
				.poll( () => editor2.getBlocks(), { timeout: 10000 } )
				.toMatchObject( [
					{
						name: 'core/paragraph',
						attributes: {
							content: 'Edit made while solo',
						},
					},
				] );

			// Step 6: Verify bidirectional sync — User 2 makes an edit.
			const { page2 } = collaborationUtils;
			await page2.evaluate( () => {
				const block = window.wp.blocks.createBlock(
					'core/paragraph',
					{
						content: 'Edit from User 2',
					}
				);
				window.wp.data
					.dispatch( 'core/block-editor' )
					.insertBlock( block );
			} );

			// User 1 should see User 2's edit.
			await expect( async () => {
				const blocks = await editor.getBlocks();
				const contents = blocks.map(
					( b: { attributes: Record< string, unknown > } ) =>
						b.attributes.content
				);
				expect( contents ).toContain( 'Edit from User 2' );
				expect( contents ).toContain( 'Edit made while solo' );
			} ).toPass( { timeout: 10000 } );
		} );
	} );

	test.describe(
		'Scenario C: User 2 leaves after collaboration',
		() => {
			test( 'User 1 downgrades to presence-only after User 2 leaves', async ( {
				collaborationUtils,
				requestUtils,
				editor,
				page,
			} ) => {
				const post = await requestUtils.createPost( {
					title: 'Lazy Sync - User Leaves',
					status: 'draft',
					date_gmt: new Date().toISOString(),
				} );

				// Track User 1's sync requests.
				const user1SyncRequests: Array< {
					presenceOnly: boolean;
					timestamp: number;
				} > = [];

				page.on( 'request', ( request ) => {
					if ( request.url().includes( 'wp-sync' ) ) {
						try {
							const postData = request.postData();
							if ( postData ) {
								const body = JSON.parse( postData );
								user1SyncRequests.push( {
									presenceOnly:
										body.presence_only === true,
									timestamp: Date.now(),
								} );
							}
						} catch {
							// Ignore parse errors.
						}
					}
				} );

				// Open collaborative session (both users).
				await collaborationUtils.openCollaborativeSession( post.id );

				// Both users should be fully synced now.
				const fullSyncCountBefore = user1SyncRequests.filter(
					( r ) => ! r.presenceOnly
				).length;
				expect( fullSyncCountBefore ).toBeGreaterThan( 0 );

				// User 2 closes their tab.
				const { page2 } = collaborationUtils;
				await page2.close();

				// The awareness monitor detects all collaborators gone and starts
				// a 30s debounce timer. After it fires, providers disconnect and
				// the presence detector restarts with presence-only polling.
				//
				// Wait for the downgrade: after ~30s debounce + a few poll cycles,
				// User 1 should revert to presence-only requests.
				await expect
					.poll(
						() => {
							// Look for presence-only requests that appeared after
							// the collaborative session was established.
							const recentPresenceOnly =
								user1SyncRequests.filter(
									( r ) =>
										r.presenceOnly &&
										r.timestamp >
											Date.now() - 15_000
								);
							return recentPresenceOnly.length;
						},
						{
							// 30s debounce + 10s poll interval + buffer
							timeout: 50000,
							intervals: [ 3000 ],
						}
					)
					.toBeGreaterThanOrEqual( 1 );

				// User 1 can still edit after downgrade.
				await editor.insertBlock( {
					name: 'core/paragraph',
					attributes: { content: 'Edit after User 2 left' },
				} );

				await expect
					.poll( () => editor.getBlocks(), { timeout: 5000 } )
					.toMatchObject(
						expect.arrayContaining( [
							expect.objectContaining( {
								name: 'core/paragraph',
								attributes: {
									content: 'Edit after User 2 left',
								},
							} ),
						] )
					);
			} );
		}
	);

	test.describe( 'Scenario D: Undo/redo across the sync transition', () => {
		test( 'solo edits undo correctly after sync upgrade', async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Lazy Sync - Undo Across Transition',
				status: 'draft',
				date_gmt: new Date().toISOString(),
			} );

			// Step 1: User 1 opens the post solo.
			await collaborationUtils.openPost( post.id );

			// Step 2: User 1 makes edits while solo (deferred mode).
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Solo block 1' },
			} );

			// Small delay to ensure undo captures as separate levels.
			// eslint-disable-next-line playwright/no-wait-for-timeout, no-restricted-syntax
			await page.waitForTimeout( 600 );

			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'Solo block 2' },
			} );

			await expect
				.poll( () => editor.getBlocks(), { timeout: 3000 } )
				.toHaveLength( 2 );

			// Step 3: User 2 joins — triggers full sync connection.
			const { editor: editor2 } = await collaborationUtils.joinUser(
				post.id,
				{
					username: 'collaborator',
					email: 'collaborator@example.com',
					firstName: 'Test',
					lastName: 'Collaborator',
					password: 'password',
					roles: [ 'editor' ],
				}
			);

			await collaborationUtils.waitForMutualDiscovery( {
				timeout: 30000,
			} );

			// Verify User 2 sees User 1's solo edits.
			await expect
				.poll( () => editor2.getBlocks(), { timeout: 10000 } )
				.toHaveLength( 2 );

			// Step 4: User 1 undoes their last solo edit.
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).undo();
			} );

			// User 1 should see only the first block.
			await expect( async () => {
				const blocks = await editor.getBlocks();
				expect( blocks ).toHaveLength( 1 );
				expect( blocks[ 0 ].attributes.content ).toBe(
					'Solo block 1'
				);
			} ).toPass( { timeout: 5000 } );

			// The undo should also sync to User 2.
			await expect( async () => {
				const blocks = await editor2.getBlocks();
				expect( blocks ).toHaveLength( 1 );
				expect( blocks[ 0 ].attributes.content ).toBe(
					'Solo block 1'
				);
			} ).toPass( { timeout: 10000 } );

			// Step 5: User 1 undoes again (removes the first solo block).
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).undo();
			} );

			await expect
				.poll( () => editor.getBlocks(), { timeout: 5000 } )
				.toHaveLength( 0 );

			// Step 6: Redo restores the solo edit.
			await page.evaluate( () => {
				window.wp.data.dispatch( 'core/editor' ).redo();
			} );

			await expect( async () => {
				const blocks = await editor.getBlocks();
				expect( blocks ).toHaveLength( 1 );
				expect( blocks[ 0 ].attributes.content ).toBe(
					'Solo block 1'
				);
			} ).toPass( { timeout: 5000 } );
		} );
	} );
} );
