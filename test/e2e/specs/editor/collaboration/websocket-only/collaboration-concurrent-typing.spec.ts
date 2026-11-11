import type { Locator, Page } from '@playwright/test';
import { test, expect } from '../fixtures';

const USER_A_TEXT =
	'123456789012345678901234567890123456789012345678901234567890';
const USER_B_TEXT =
	'987654321098765432109876543210987654321098765432109876543210';

function paragraph( content: string ): string {
	return `<!-- wp:paragraph -->\n<p>${ content }</p>\n<!-- /wp:paragraph -->`;
}

async function focusParagraphEnd( page: Page, paragraphLocator: Locator ) {
	await paragraphLocator.click();
	await page.keyboard.press( 'End' );
}

async function getParagraphContents( page: Page ): Promise< string[] > {
	return page.evaluate( () =>
		( window as any ).wp.data
			.select( 'core/block-editor' )
			.getBlocks()
			.map( ( block: { attributes: { content?: unknown } } ) =>
				String( block.attributes.content ?? '' )
			)
	);
}

test.describe( 'Collaboration - WebSocket Concurrent Typing', () => {
	test( 'does not duplicate consecutive edits made before the editor renders', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Consecutive local edits',
			date_gmt: new Date().toISOString(),
			content: paragraph( 'Hello' ),
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{
					content: 'Hello!',
				}
			);
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{
					content: 'Hello!!',
				}
			);
		} );
		await expect
			.poll( () => getParagraphContents( collaborationUtils.page2 ) )
			.toEqual( [ 'Hello!!' ] );
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'Hello!!' ] );
	} );

	for ( const { delayAwareness, peerChange } of [
		{ delayAwareness: false, peerChange: 'insertion' },
		{ delayAwareness: false, peerChange: 'reorder' },
		{ delayAwareness: false, peerChange: 'replacement' },
		{ delayAwareness: true, peerChange: 'insertion' },
	] as const ) {
		test( `keeps and saves a peer ${ peerChange } while typing in a stale editor${ delayAwareness ? ' before peer awareness arrives' : '' }`, async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		} ) => {
			const post = await requestUtils.createPost( {
				title: 'Stale edit then save',
				date_gmt: new Date().toISOString(),
				content: [ 'Hello', 'Second' ].map( paragraph ).join( '\n\n' ),
				status: 'draft',
			} );
			await collaborationUtils.openCollaborativeSession( post.id );
			if ( delayAwareness ) {
				// Allow document updates through while withholding awareness.
				await page.routeWebSocket( /./, ( socket ) => {
					const server = socket.connectToServer();
					server.onMessage( ( message ) => {
						// y-websocket messages start with their type: 1 is awareness.
						if (
							typeof message === 'string' ||
							message[ 0 ] !== 1
						) {
							socket.send( message );
						}
					} );
				} );
				await page.reload();
				await collaborationUtils.waitForEntityReady( page );
				await collaborationUtils.waitForSyncCycle( page );
			}
			const room =
				await collaborationUtils.getCurrentPostRoomName( page );
			expect(
				await page.evaluate(
					( roomName ) =>
						( window as any ).__gutenbergTestWebSocketSync.rooms[
							roomName
						].awarenessCount,
					room
				)
			).toBe( delayAwareness ? 1 : 2 );
			await expect
				.poll( () =>
					page.evaluate( () =>
						window.wp.data
							.select( 'core/editor' )
							.isEditedPostDirty()
					)
				)
				.toBe( false );
			// Force the local edit into the gap between core-data receiving a
			// remote update and React passing it to the block-editor store.
			await page.evaluate( ( postId ) => {
				const { select, dispatch, subscribe } = window.wp.data;
				const unsubscribe = subscribe( () => {
					const record = select( 'core' ).getEditedEntityRecord(
						'postType',
						'post',
						postId
					);
					const contents = record.blocks?.map( ( block: any ) =>
						String( block.attributes.content )
					);
					if (
						! contents ||
						contents.join( '|' ) === 'Hello|Second'
					) {
						return;
					}
					unsubscribe();
					const [ block ] = select( 'core/block-editor' ).getBlocks();
					dispatch( 'core/block-editor' ).updateBlockAttributes(
						block.clientId,
						{ content: 'Hello!' }
					);
				}, 'core' );
			}, post.id );
			await collaborationUtils.page2.evaluate( ( change ) => {
				const { select, dispatch } = window.wp.data;
				const blocks = select( 'core/block-editor' ).getBlocks();
				if ( change === 'reorder' ) {
					dispatch( 'core/block-editor' ).moveBlocksUp( [
						blocks[ 1 ].clientId,
					] );
				} else {
					const added = window.wp.blocks.createBlock(
						'core/paragraph',
						{ content: 'Peer paragraph' }
					);
					if ( change === 'replacement' ) {
						dispatch( 'core/block-editor' ).replaceBlocks(
							blocks.map(
								( block: { clientId: string } ) =>
									block.clientId
							),
							[ added ]
						);
					} else {
						dispatch( 'core/block-editor' ).insertBlocks(
							[ added ],
							blocks.length
						);
					}
				}
			}, peerChange );
			const expected = {
				insertion: [ 'Hello!', 'Second', 'Peer paragraph' ],
				reorder: [ 'Second', 'Hello!' ],
				replacement: [ 'Hello!', 'Peer paragraph' ],
			}[ peerChange ];
			await expect
				.poll( () => getParagraphContents( page ) )
				.toEqual( expected );
			await expect
				.poll( () => getParagraphContents( collaborationUtils.page2 ) )
				.toEqual( expected );
			// Continue through the DOM, then verify the saved content and reload.
			await editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.filter( { hasText: 'Hello!' } )
				.click();
			await page.keyboard.press( 'End' );
			await page.keyboard.type( '?' );
			const afterTyping = expected.map( ( text ) =>
				text === 'Hello!' ? 'Hello!?' : text
			);
			await expect
				.poll( () => getParagraphContents( page ) )
				.toEqual( afterTyping );
			await expect
				.poll( () => getParagraphContents( collaborationUtils.page2 ) )
				.toEqual( afterTyping );
			await editor.saveDraft();
			const saved = await requestUtils.rest( {
				path: `/wp/v2/posts/${ post.id }?context=edit`,
			} );
			for ( const content of afterTyping ) {
				expect( saved.content.raw ).toContain( content );
			}
			await page.reload();
			await expect
				.poll( () => getParagraphContents( page ) )
				.toEqual( afterTyping );
		} );
	}

	test( 'does not lose characters when two users rapidly type in different paragraphs', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'WebSocket Concurrent Typing Repro',
			content: [ 'p1', 'p2', 'p3', 'p4' ].map( paragraph ).join( '\n\n' ),
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );

		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		await expect
			.poll( () => editor2.getBlocks(), { timeout: 5000 } )
			.toMatchObject( [
				{ attributes: { content: 'p1' } },
				{ attributes: { content: 'p2' } },
				{ attributes: { content: 'p3' } },
				{ attributes: { content: 'p4' } },
			] );

		await Promise.all( [
			focusParagraphEnd(
				page,
				editor.canvas.getByText( 'p3', { exact: true } )
			),
			focusParagraphEnd(
				page2,
				editor2.canvas.getByText( 'p1', { exact: true } )
			),
		] );

		await Promise.all( [
			page.keyboard.type( USER_A_TEXT, { delay: 1 } ),
			page2.keyboard.type( USER_B_TEXT, { delay: 1 } ),
		] );

		const expectedParagraphs = [
			`p1${ USER_B_TEXT }`,
			'p2',
			`p3${ USER_A_TEXT }`,
			'p4',
		];

		await expect
			.poll(
				async () => {
					const [ userAParagraphs, userBParagraphs ] =
						await Promise.all( [
							getParagraphContents( page ),
							getParagraphContents( page2 ),
						] );

					return {
						userAParagraphs,
						userBParagraphs,
					};
				},
				{ timeout: 15000 }
			)
			.toEqual( {
				userAParagraphs: expectedParagraphs,
				userBParagraphs: expectedParagraphs,
			} );
	} );
} );
