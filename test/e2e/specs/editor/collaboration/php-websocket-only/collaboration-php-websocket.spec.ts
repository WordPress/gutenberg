/**
 * External dependencies
 */
import type { WebSocket as PlaywrightWebSocket } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';

test.describe( 'Collaboration - PHP WebSocket transport', () => {
	test( 'two clients sync content through the PHP WebSocket server', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const webSockets: PlaywrightWebSocket[] = [];
		page.on( 'websocket', ( ws ) => {
			webSockets.push( ws );
		} );

		const post = await requestUtils.createPost( {
			title: 'PHP WebSocket Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		// The active transport is the one selected by the test plugin.
		await expect
			.poll( () =>
				page.evaluate(
					() => ( window as any )._wpCollaborationTransport
				)
			)
			.toBe( 'php-websocket' );

		// User A opened a WebSocket to the PHP sync server (token attached).
		await expect
			.poll( () => webSockets.length, { timeout: 10000 } )
			.toBeGreaterThan( 0 );
		expect( webSockets[ 0 ].url() ).toContain( 'token=' );

		// User A inserts a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello from the PHP WebSocket transport' },
		} );

		// User B should see the paragraph after sync propagation.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Hello from the PHP WebSocket transport',
					},
				},
			] );

		// And the reverse direction: User B inserts, User A sees it.
		const { page2 } = collaborationUtils;
		await page2.evaluate( () => {
			const block = window.wp.blocks.createBlock( 'core/paragraph', {
				content: 'Hello back from User B',
			} );
			window.wp.data.dispatch( 'core/block-editor' ).insertBlock( block );
		} );

		await expect
			.poll( () => editor.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Hello from the PHP WebSocket transport',
					},
				},
				{
					name: 'core/paragraph',
					attributes: { content: 'Hello back from User B' },
				},
			] );
	} );

	test( 'refuses a WebSocket connection without a token', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'PHP WebSocket Auth Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		/*
		 * Connect a raw WebSocket from the page with no token. The user is
		 * logged in (valid cookie, allowed origin), but the missing one-time
		 * token must cause the server to reject the handshake, so the socket
		 * closes without ever opening.
		 */
		const result = await page.evaluate( () => {
			return new Promise< string >( ( resolve ) => {
				const url = ( window as any )
					._wpCollaborationWebSocketUrl as string;
				const ws = new WebSocket( url );
				const timeout = setTimeout( () => {
					ws.close();
					resolve( 'timeout' );
				}, 10000 );

				ws.addEventListener( 'open', () => {
					clearTimeout( timeout );
					resolve( 'open' );
				} );
				ws.addEventListener( 'close', () => {
					clearTimeout( timeout );
					resolve( 'closed' );
				} );
			} );
		} );

		expect( result ).toBe( 'closed' );
	} );
} );
