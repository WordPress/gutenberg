import type { Page } from '@playwright/test';
import { test, expect } from '../fixtures';

function paragraph( content: string ): string {
	return `<!-- wp:paragraph -->\n<p>${ content }</p>\n<!-- /wp:paragraph -->`;
}

async function getCaret( page: Page ) {
	return page.evaluate( () => {
		const { getBlockIndex, getSelectionStart, getSelectionEnd } = (
			window as any
		 ).wp.data.select( 'core/block-editor' );
		const start = getSelectionStart();
		return {
			blockIndex: getBlockIndex( start.clientId ),
			start: start.offset,
			end: getSelectionEnd().offset,
		};
	} );
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

test.describe( 'Collaboration - deferred local update', () => {
	test( 'keeps a deferred edit and a peer edit that arrived first', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		// Two gates for the first editor. The first holds the messages that
		// its sockets receive. The second holds its zero-delay timers, which
		// is where the sync manager puts a local update when it sees no peer.
		await page.addInitScript( () => {
			const gate = {
				holdMessages: false,
				holdTimers: false,
				messages: [] as Array< () => void >,
				timers: [] as Array< () => void >,
				sockets: [] as WebSocket[],
			};
			( window as any ).__gate = gate;

			const NativeWebSocket = window.WebSocket;
			window.WebSocket = class extends NativeWebSocket {
				constructor(
					url: string | URL,
					protocols?: string | string[]
				) {
					super( url, protocols );
					gate.sockets.push( this );
					let handler: ( ( event: MessageEvent ) => void ) | null =
						null;
					Object.defineProperty( this, 'onmessage', {
						get: () => handler,
						set: ( value ) => {
							handler = value;
						},
					} );
					this.addEventListener( 'message', ( event ) => {
						if ( gate.holdMessages ) {
							gate.messages.push( () => handler?.( event ) );
						} else {
							handler?.( event );
						}
					} );
				}
			} as typeof WebSocket;

			const nativeSetTimeout = window.setTimeout;
			( window as any ).setTimeout = (
				callback: ( ...args: unknown[] ) => void,
				delay?: number,
				...args: unknown[]
			) => {
				if (
					gate.holdTimers &&
					typeof callback === 'function' &&
					! delay
				) {
					gate.timers.push( () => callback( ...args ) );
					return 0;
				}
				return nativeSetTimeout( callback, delay, ...args );
			};
		} );

		const post = await requestUtils.createPost( {
			title: 'Deferred update',
			content: [ 'Hello', 'Second' ].map( paragraph ).join( '\n\n' ),
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;
		const room = await collaborationUtils.getCurrentPostRoomName( page );

		// Each editor makes one edit, so that both hold the same block
		// client IDs before the test places the carets.
		await editor.canvas.getByText( 'Second', { exact: true } ).click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( 'x' );
		await expect
			.poll( () => getParagraphContents( page2 ) )
			.toEqual( [ 'Hello', 'Secondx' ] );
		await editor2.canvas.getByText( 'Secondx', { exact: true } ).click();
		await page2.keyboard.press( 'End' );
		await page2.keyboard.type( 'y' );
		await expect
			.poll( () => getParagraphContents( page ) )
			.toEqual( [ 'Hello', 'Secondxy' ] );

		await editor.canvas.getByText( 'Hello', { exact: true } ).click();
		await page.keyboard.press( 'End' );
		await editor2.canvas.getByText( 'Hello', { exact: true } ).click();
		await page2.keyboard.press( 'Home' );

		// The first editor's connection drops. Its provider removes the peer
		// from awareness and reconnects. The test holds what the new socket
		// receives, so the editor still sees no peer.
		await page.evaluate( () => {
			const gate = ( window as any ).__gate;
			gate.holdMessages = true;
			for ( const socket of gate.sockets ) {
				socket.close();
			}
		} );
		await page.waitForFunction(
			( roomName ) =>
				( window as any ).__gutenbergTestWebSocketSync.rooms[ roomName ]
					.awarenessCount === 1 &&
				( window as any ).__gate.sockets.some(
					( socket: WebSocket ) =>
						socket.readyState === 1 &&
						decodeURIComponent( socket.url ).includes( roomName )
				),
			room
		);

		// The peer types. The first editor's socket receives the change, and
		// the gate holds it.
		const held = await page.evaluate(
			() => ( window as any ).__gate.messages.length
		);
		await page2.keyboard.type( 'Bob says ' );
		await expect
			.poll( () => getParagraphContents( page2 ) )
			.toEqual( [ 'Bob says Hello', 'Secondxy' ] );
		await page.waitForFunction(
			( before ) => ( window as any ).__gate.messages.length > before,
			held
		);

		// The first editor types. It sees no peer, so the update waits on a
		// zero-delay timer.
		await page.evaluate( () => {
			( window as any ).__gate.holdTimers = true;
		} );
		await page.keyboard.type( '!' );
		// Read one time, without a poll: a pause in typing closes the undo
		// level, and that applies the deferred update.
		expect( await getParagraphContents( page ) ).toEqual( [
			'Hello!',
			'Secondxy',
		] );

		// The peer's change arrives before the timer runs.
		await page.evaluate( () => {
			const gate = ( window as any ).__gate;
			gate.holdMessages = false;
			for ( const deliver of gate.messages.splice( 0 ) ) {
				deliver();
			}
		} );
		await page.evaluate( () => {
			const gate = ( window as any ).__gate;
			gate.holdTimers = false;
			for ( const run of gate.timers.splice( 0 ) ) {
				run();
			}
		} );

		// Both edits stay, in both editors.
		const merged = [ 'Bob says Hello!', 'Secondxy' ];
		await expect
			.poll(
				async () => ( {
					first: await getParagraphContents( page ),
					peer: await getParagraphContents( page2 ),
				} ),
				{ timeout: 10_000 }
			)
			.toEqual( { first: merged, peer: merged } );

		// The first editor's caret stays after its own character.
		await expect
			.poll( () => getCaret( page ) )
			.toEqual( { blockIndex: 0, start: 15, end: 15 } );

		// The first editor can undo its own edit. The peer's edit stays.
		await page.keyboard.press( 'ControlOrMeta+z' );
		const undone = [ 'Bob says Hello', 'Secondxy' ];
		await expect
			.poll(
				async () => ( {
					first: await getParagraphContents( page ),
					peer: await getParagraphContents( page2 ),
				} ),
				{ timeout: 10_000 }
			)
			.toEqual( { first: undone, peer: undone } );
		await expect
			.poll( () => getCaret( page ) )
			.toEqual( { blockIndex: 0, start: 14, end: 14 } );
	} );
} );
