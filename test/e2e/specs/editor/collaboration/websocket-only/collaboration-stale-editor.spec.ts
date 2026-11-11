import type { Page, WebSocketRoute } from '@playwright/test';
import { test, expect } from '../fixtures';

function paragraph( content: string ): string {
	return `<!-- wp:paragraph -->\n<p>${ content }</p>\n<!-- /wp:paragraph -->`;
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

async function typeAtEndOf(
	page: Page,
	editorCanvas: {
		getByRole: ( role: 'document', options: { name: string } ) => any;
	},
	text: string,
	keys: string
) {
	await editorCanvas
		.getByRole( 'document', { name: 'Block: Paragraph' } )
		.filter( { hasText: text } )
		.first()
		.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.type( keys );
}

test.describe( 'Collaboration - WebSocket stale editor', () => {
	test( 'keeps a keystroke made before the websocket has synced a peer change', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Keystroke before sync',
			date_gmt: new Date().toISOString(),
			content: [ 'Hello', 'Second' ].map( paragraph ).join( '\n\n' ),
			status: 'draft',
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		// Dirty the post and save it, so the document is persisted with the
		// post and a reload hydrates from it.
		await typeAtEndOf( page, editor.canvas, 'Hello', '!' );
		await expect
			.poll( () => getParagraphContents( collaborationUtils.page2 ) )
			.toEqual( [ 'Hello!', 'Second' ] );
		await editor.saveDraft();

		// The peer changes the document after the persisted copy was written.
		await typeAtEndOf(
			collaborationUtils.page2,
			collaborationUtils.editor2.canvas,
			'Second',
			' peer'
		);
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'Hello!', 'Second peer' ] );

		// Refuse every websocket connection until the keystroke is made, so
		// the reloaded editor hydrates from the stale persisted document and
		// the provider keeps retrying without learning about the peer's change.
		let holding = true;
		await page.routeWebSocket( /./, ( ws: WebSocketRoute ) => {
			if ( holding ) {
				void ws.close();
				return;
			}
			const server = ws.connectToServer();
			ws.onMessage( ( message ) => server.send( message ) );
			server.onMessage( ( message ) => ws.send( message ) );
		} );

		await page.reload();
		await collaborationUtils.waitForEntityReady( page );
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'Hello!', 'Second' ] );

		// Type before the socket has synced.
		await typeAtEndOf( page, editor.canvas, 'Hello!', '?' );
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'Hello!?', 'Second' ] );
		const roomName =
			await collaborationUtils.getCurrentPostRoomName( page );
		expect(
			await page.evaluate(
				( room ) =>
					( window as any ).__gutenbergTestWebSocketSync?.rooms?.[
						room
					]?.synced,
				roomName
			)
		).not.toBe( true );

		holding = false;
		await page.waitForFunction(
			( room ) =>
				( window as any ).__gutenbergTestWebSocketSync?.rooms?.[ room ]
					?.synced === true,
			roomName,
			{ timeout: 15000 }
		);

		const expected = [ 'Hello!?', 'Second peer' ];
		await expect
			.poll( () => getParagraphContents( page ), { timeout: 15000 } )
			.toEqual( expected );
		await expect
			.poll( () => getParagraphContents( collaborationUtils.page2 ), {
				timeout: 15000,
			} )
			.toEqual( expected );
	} );

	test.describe( 'with a template part in the post', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllTemplates( 'wp_template_part' );
			await requestUtils.activateTheme( 'twentytwentyone' );
		} );

		test( 'keeps both editors converged while both type around a template part', async ( {
			collaborationUtils,
			requestUtils,
			editor,
			page,
		} ) => {
			await requestUtils.createTemplate( 'wp_template_part', {
				slug: 'rtc-part',
				title: 'RTC part',
				content: paragraph( 'Part text' ),
			} );
			const post = await requestUtils.createPost( {
				title: 'Template part in post',
				date_gmt: new Date().toISOString(),
				content: [
					'<!-- wp:template-part {"slug":"rtc-part","theme":"emptytheme"} /-->',
					paragraph( 'Hello' ),
				].join( '\n\n' ),
				status: 'draft',
			} );
			await collaborationUtils.openCollaborativeSession( post.id );
			const { editor2, page2 } = collaborationUtils;

			// The block editor's `getBlocks()` leaves out the inner blocks of
			// a template part, which another entity controls, so read them
			// by the template part's client ID.
			const getState = ( p: Page ) =>
				p.evaluate( () => {
					const { getBlocks } = ( window as any ).wp.data.select(
						'core/block-editor'
					);
					const blocks = getBlocks();
					const part = blocks.find(
						( block: { name: string } ) =>
							block.name === 'core/template-part'
					);
					return {
						names: blocks.map( ( b: { name: string } ) => b.name ),
						part: part
							? getBlocks( part.clientId ).map(
									( b: {
										attributes: { content?: unknown };
									} ) => String( b.attributes.content ?? '' )
								)
							: null,
						paragraphs: blocks
							.filter(
								( b: { name: string } ) =>
									b.name === 'core/paragraph'
							)
							.map(
								( b: { attributes: { content?: unknown } } ) =>
									String( b.attributes.content ?? '' )
							),
					};
				} );
			const state = ( hello: string ) => ( {
				names: [ 'core/template-part', 'core/paragraph' ],
				part: [ 'Part text' ],
				paragraphs: [ hello ],
			} );
			for ( const p of [ page, page2 ] ) {
				await expect
					.poll( () => getState( p ), { timeout: 15000 } )
					.toEqual( state( 'Hello' ) );
			}

			await typeAtEndOf( page, editor.canvas, 'Hello', '!' );
			await expect
				.poll( () => getState( page2 ), { timeout: 15000 } )
				.toEqual( state( 'Hello!' ) );

			await typeAtEndOf( page2, editor2.canvas, 'Hello!', '?' );
			await expect
				.poll( () => getState( page ), { timeout: 15000 } )
				.toEqual( state( 'Hello!?' ) );

			await typeAtEndOf( page, editor.canvas, 'Hello!?', '.' );
			await expect
				.poll( () => getState( page2 ), { timeout: 15000 } )
				.toEqual( state( 'Hello!?.' ) );
			expect( await getState( page ) ).toEqual( state( 'Hello!?.' ) );
		} );
	} );
} );
