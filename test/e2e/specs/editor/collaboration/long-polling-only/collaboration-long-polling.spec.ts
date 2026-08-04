/**
 * External dependencies
 */
import type { Request } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';

const LONG_POLL_ROUTE = 'wp-sync/v1/long-poll';

function isLongPollRequest( request: Request ): boolean {
	return (
		request.method() === 'POST' && request.url().includes( LONG_POLL_ROUTE )
	);
}

function requestCarriesUpdates( request: Request ): boolean {
	try {
		const data = request.postDataJSON() as {
			rooms?: Array< { updates?: unknown[] } >;
		} | null;
		return Boolean(
			data?.rooms?.some( ( room ) => ( room.updates?.length ?? 0 ) > 0 )
		);
	} catch {
		return false;
	}
}

test.describe( 'Collaboration - HTTP Long Polling transport', () => {
	test( 'two clients sync content through the long-poll route', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const longPollRequests: Request[] = [];
		page.on( 'request', ( request ) => {
			if ( isLongPollRequest( request ) ) {
				longPollRequests.push( request );
			}
		} );

		const post = await requestUtils.createPost( {
			title: 'Long Polling Sync Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2, page2 } = collaborationUtils;

		const longPollRequests2: Request[] = [];
		page2.on( 'request', ( request ) => {
			if ( isLongPollRequest( request ) ) {
				longPollRequests2.push( request );
			}
		} );

		// The active transport is the one selected by the test plugin.
		await expect
			.poll( () =>
				page.evaluate(
					() => ( window as any )._wpCollaborationTransport
				)
			)
			.toBe( 'http-long-polling' );

		// User A inserts a paragraph block.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Hello from the long-poll transport' },
		} );

		// User B should see the paragraph after sync propagation.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: {
						content: 'Hello from the long-poll transport',
					},
				},
			] );

		// Both clients synced through the long-poll route.
		expect( longPollRequests.length ).toBeGreaterThan( 0 );
		await expect
			.poll( () => longPollRequests2.length )
			.toBeGreaterThan( 0 );
	} );

	test( 'sends a locally-typed change promptly while a long-poll is held', async ( {
		collaborationUtils,
		requestUtils,
		editor,
		page,
	} ) => {
		const post = await requestUtils.createPost( {
			title: 'Long Polling Abort-and-Resend Test',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		await collaborationUtils.openCollaborativeSession( post.id );

		const { editor2 } = collaborationUtils;

		/*
		 * Let the session settle so that user A's current long-poll request
		 * is being held open by the server with nothing to send. Waiting
		 * for an *empty* outgoing long-poll to start (and not finish) is
		 * the held request.
		 */
		await page.waitForRequest(
			( request ) =>
				isLongPollRequest( request ) &&
				! requestCarriesUpdates( request ),
			{ timeout: 15000 }
		);

		// Arm a waiter for the abort-and-resend request before typing.
		const resendRequestPromise = page.waitForRequest(
			( request ) =>
				isLongPollRequest( request ) &&
				requestCarriesUpdates( request ),
			{ timeout: 10000 }
		);

		const typedAt = Date.now();

		// User A makes a local change while the long-poll is held.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Prompt delivery' },
		} );

		/*
		 * The held request must be aborted and a request carrying the
		 * update issued promptly — sooner than the hold budget (4 s in the
		 * e2e plugin, 20 s by default) would allow if the client simply
		 * waited the held request out.
		 */
		await resendRequestPromise;
		const sendLatency = Date.now() - typedAt;
		expect( sendLatency ).toBeLessThan( 2500 );

		// User B receives the change well under the hold budget.
		await expect
			.poll( () => editor2.getBlocks(), { timeout: 10000 } )
			.toMatchObject( [
				{
					name: 'core/paragraph',
					attributes: { content: 'Prompt delivery' },
				},
			] );
	} );
} );
