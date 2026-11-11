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

test.describe( 'Collaboration - WebSocket stale caret', () => {
	test( 'keeps the caret after the typed character when a peer typed earlier in the same paragraph', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Stale caret',
			date_gmt: new Date().toISOString(),
			content: paragraph( 'hello' ),
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		// Put a real caret at the end of the paragraph.
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectionStart().offset
				)
			)
			.toBe( 5 );

		// Type "!" at the caret in the gap between core-data receiving the
		// peer's change and the block editor rendering it. Like a keystroke,
		// the edit moves the caret and changes the text together.
		await page.evaluate( ( postId ) => {
			const { select, dispatch, subscribe } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const record = select( 'core' ).getEditedEntityRecord(
					'postType',
					'post',
					postId
				);
				const content = record.blocks?.[ 0 ]?.attributes?.content;
				if ( content === undefined || String( content ) === 'hello' ) {
					return;
				}
				unsubscribe();
				const [ block ] = select( 'core/block-editor' ).getBlocks();
				const type = () => {
					dispatch( 'core/block-editor' ).selectionChange(
						block.clientId,
						'content',
						6,
						6
					);
					dispatch( 'core/block-editor' ).updateBlockAttributes(
						block.clientId,
						{ content: 'hello!' }
					);
				};
				const { batch } = window.wp.data as any;
				if ( typeof batch === 'function' ) {
					batch( type );
				} else {
					type();
				}
			}, 'core' );
		}, post.id );

		// The peer types "ABC" at the start of the same paragraph.
		await collaborationUtils.page2.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{ content: 'ABChello' }
			);
		} );

		// Wait for both editors to agree on a text that holds the "!".
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getParagraphContents( page ),
					getParagraphContents( collaborationUtils.page2 ),
				] );
				return a[ 0 ] === b[ 0 ] && a[ 0 ].includes( '!' );
			} )
			.toBe( true );

		// Keep typing without moving the caret. The new character must land
		// right after the "!" typed before.
		// Give the next keystroke its own undo level, independent of timing.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core' ).__unstableCreateUndoLevel()
		);
		await page.keyboard.type( '?' );
		await expect
			.poll( async () => ( await getParagraphContents( page ) )[ 0 ] )
			.toContain( '?' );
		const [ content ] = await getParagraphContents( page );
		expect( content ).toBe( 'ABChello!?' );
		await expect
			.poll( () => getParagraphContents( collaborationUtils.page2 ) )
			.toEqual( [ 'ABChello!?' ] );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).undo()
		);
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'ABChello!' ] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectionStart().offset
				)
			)
			.toBe( 9 );
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).redo()
		);
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'ABChello!?' ] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getSelectionStart().offset
				)
			)
			.toBe( 10 );
		await page.keyboard.type( '.' );
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'ABChello!?.' ] );
		await expect
			.poll( () => getParagraphContents( collaborationUtils.page2 ) )
			.toEqual( [ 'ABChello!?.' ] );
	} );
} );

const CONTENT = `<!-- wp:group -->
<div class="wp-block-group"></div>
<!-- /wp:group -->

<!-- wp:paragraph -->
<p>hell</p>
<!-- /wp:paragraph -->`;

interface BlockSummary {
	clientId: string;
	name: string;
	content?: string;
	innerBlocks: BlockSummary[];
}

/**
 * The blocks of the edited post as core-data holds them. This is the list
 * the editor renders and saves.
 *
 * @param page   The page to read from.
 * @param postId The post to read.
 */
async function getPostBlocks(
	page: Page,
	postId: number
): Promise< BlockSummary[] > {
	return page.evaluate( ( id ) => {
		const summarize = ( blocks: any[] ): any[] =>
			blocks.map( ( block ) => ( {
				clientId: block.clientId,
				name: block.name,
				content:
					block.attributes.content === undefined
						? undefined
						: String( block.attributes.content ),
				innerBlocks: summarize( block.innerBlocks ?? [] ),
			} ) );
		const record = ( window as any ).wp.data
			.select( 'core' )
			.getEditedEntityRecord( 'postType', 'post', id );
		return summarize( record.blocks ?? [] );
	}, postId );
}

function flatten( blocks: BlockSummary[] ): BlockSummary[] {
	return blocks.flatMap( ( block ) => [
		block,
		...flatten( block.innerBlocks ),
	] );
}

test.describe( 'Collaboration - WebSocket stale duplicate block', () => {
	test( 'does not duplicate a block a peer moved into a group while the user types in it', async ( {
		collaborationUtils,
		editor,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Stale duplicate block',
			date_gmt: new Date().toISOString(),
			content: CONTENT,
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { page2 } = collaborationUtils;

		// A first edit makes both editors hold the same client IDs, as they
		// do in any session where someone has already typed.
		await page.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ , block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).updateBlockAttributes(
				block.clientId,
				{ content: 'hello' }
			);
		} );
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getPostBlocks( page, post.id ),
					getPostBlocks( page2, post.id ),
				] );
				return (
					a.length === 2 &&
					a[ 1 ].content === 'hello' &&
					JSON.stringify(
						flatten( a ).map( ( x ) => x.clientId )
					) ===
						JSON.stringify(
							flatten( b ).map( ( x ) => x.clientId )
						)
				);
			} )
			.toBe( true );

		// Type "!" in the paragraph in the gap between core-data receiving
		// the peer's move and the block editor rendering it.
		await page.evaluate( ( postId ) => {
			const { select, dispatch, subscribe } = window.wp.data;
			const unsubscribe = subscribe( () => {
				const record = select( 'core' ).getEditedEntityRecord(
					'postType',
					'post',
					postId
				);
				if ( ! record.blocks || record.blocks.length === 2 ) {
					return;
				}
				unsubscribe();
				const [ , block ] = select( 'core/block-editor' ).getBlocks();
				dispatch( 'core/block-editor' ).updateBlockAttributes(
					block.clientId,
					{ content: 'hello!' }
				);
			}, 'core' );
		}, post.id );

		// The peer moves the paragraph into the group.
		await page2.evaluate( () => {
			const { select, dispatch } = window.wp.data;
			const [ group, block ] = select( 'core/block-editor' ).getBlocks();
			dispatch( 'core/block-editor' ).moveBlocksToPosition(
				[ block.clientId ],
				'',
				group.clientId,
				0
			);
		} );

		// Wait for both editors to agree on a document that holds the "!".
		await expect
			.poll( async () => {
				const [ a, b ] = await Promise.all( [
					getPostBlocks( page, post.id ),
					getPostBlocks( page2, post.id ),
				] );
				return (
					JSON.stringify( a ) === JSON.stringify( b ) &&
					flatten( a ).some( ( x ) => x.content === 'hello!' )
				);
			} )
			.toBe( true );

		for ( const blocks of [
			await getPostBlocks( page, post.id ),
			await getPostBlocks( page2, post.id ),
		] ) {
			const all = flatten( blocks );
			const clientIds = all.map( ( block ) => block.clientId );
			expect( new Set( clientIds ).size ).toBe( clientIds.length );
			expect( blocks ).toMatchObject( [
				{
					name: 'core/group',
					innerBlocks: [
						{
							name: 'core/paragraph',
							content: 'hello!',
							innerBlocks: [],
						},
					],
				},
			] );
			expect( blocks ).toHaveLength( 1 );
			expect(
				all.filter( ( block ) => block.name === 'core/paragraph' )
			).toHaveLength( 1 );
		}
		await editor.saveDraft();
		const saved = await requestUtils.rest( {
			path: `/wp/v2/posts/${ post.id }?context=edit`,
		} );
		expect( saved.content.raw.match( /<!-- wp:paragraph/g ) ).toHaveLength(
			1
		);
		expect( saved.content.raw ).toContain( '<p>hello!</p>' );
		const beforeReload = await getPostBlocks( page, post.id );
		await page.reload();
		await collaborationUtils.waitForEntityReady( page );
		await expect
			.poll( () => getPostBlocks( page, post.id ) )
			.toEqual( beforeReload );
	} );
} );
