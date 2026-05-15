/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const EXTRA_POST_COUNT = 40;
const LARGE_FIELD_SIZE = 450 * 1024;
const MAX_SYNC_BODY_SIZE = 16 * 1024 * 1024;

// One room per extra post record, plus the baseline rooms the editor always
// registers when opening a post (the primary post plus its collection rooms,
// e.g. root/comment).
const EXPECTED_ROOMS = EXTRA_POST_COUNT + 4;

function isSyncUpdateRequest( url: string ): boolean {
	const decodedUrl = decodeURIComponent( url );
	return (
		decodedUrl.includes( '/wp-json/wp-sync/v1/updates' ) ||
		decodedUrl.includes( 'rest_route=/wp-sync/v1/updates' )
	);
}

test.describe( 'Collaboration sync body size', () => {
	test( 'keeps multi-room sync polls under the body-size limit', async ( {
		collaborationUtils,
		requestUtils,
		page,
	} ) => {
		test.setTimeout( 180_000 );
		test.slow();

		const syncRequests: Array< {
			length: number;
			rooms: number | null;
			updateCount: number | null;
		} > = [];
		const syncResponses: Array< {
			ok: boolean;
			status: number;
		} > = [];

		page.on( 'request', ( request ) => {
			if ( ! isSyncUpdateRequest( request.url() ) ) {
				return;
			}
			const body = request.postData() || '';
			let rooms = null;
			let updateCount = null;
			try {
				const parsed = JSON.parse( body );
				rooms = Array.isArray( parsed.rooms )
					? parsed.rooms.length
					: null;
				updateCount = Array.isArray( parsed.rooms )
					? parsed.rooms.reduce(
							( total: number, room: { updates?: unknown[] } ) =>
								total +
								( Array.isArray( room.updates )
									? room.updates.length
									: 0 ),
							0
					  )
					: null;
			} catch {}
			syncRequests.push( {
				length: Buffer.byteLength( body ),
				rooms,
				updateCount,
			} );
		} );

		page.on( 'response', ( response ) => {
			if ( ! isSyncUpdateRequest( response.url() ) ) {
				return;
			}
			syncResponses.push( {
				ok: response.ok(),
				status: response.status(),
			} );
		} );

		const post = await requestUtils.createPost( {
			title: 'Sync Body Size',
			status: 'draft',
			date_gmt: new Date().toISOString(),
		} );
		const extraPosts = [];
		for ( let i = 0; i < EXTRA_POST_COUNT; i++ ) {
			extraPosts.push(
				await requestUtils.createPost( {
					title: `Sync Body Size Extra ${ i }`,
					status: 'draft',
					date_gmt: new Date().toISOString(),
				} )
			);
		}
		const extraPostIds = extraPosts.map( ( extraPost ) => extraPost.id );

		await collaborationUtils.openPost( post.id );
		await collaborationUtils.joinUser( post.id, SECOND_USER );
		await collaborationUtils.waitForMutualDiscovery();

		await page.evaluate( async ( ids ) => {
			await Promise.all(
				ids.map( ( id ) =>
					window.wp.data
						.resolveSelect( 'core' )
						.getEntityRecord( 'postType', 'post', id )
				)
			);
		}, extraPostIds );

		await expect
			.poll(
				() =>
					Math.max(
						0,
						...syncRequests.map( ( request ) => request.rooms || 0 )
					),
				{ timeout: 20000 }
			)
			.toBe( EXPECTED_ROOMS );

		await page.evaluate(
			( { ids, largeFieldSize } ) => {
				const largeText = 'x'.repeat( largeFieldSize );
				for ( const id of ids ) {
					window.wp.data
						.dispatch( 'core' )
						.editEntityRecord( 'postType', 'post', id, {
							title: `${ id }-${ largeText }`,
						} );
				}
			},
			{ ids: extraPostIds, largeFieldSize: LARGE_FIELD_SIZE }
		);

		await expect
			.poll(
				() =>
					syncRequests.some(
						( request ) =>
							request.updateCount !== null &&
							request.updateCount > 0
					),
				{ timeout: 20000 }
			)
			.toBe( true );

		await expect
			.poll(
				() =>
					syncRequests.filter(
						( request ) =>
							request.updateCount !== null &&
							request.updateCount > 0
					).length,
				{ timeout: 20000 }
			)
			.toBeGreaterThan( 1 );

		expect(
			Math.max( 0, ...syncRequests.map( ( request ) => request.length ) )
		).toBeLessThanOrEqual( MAX_SYNC_BODY_SIZE );
		expect(
			syncResponses.some( ( response ) => response.status === 413 )
		).toBe( false );
		await expect(
			page.getByRole( 'dialog', { name: 'Connection lost' } )
		).toBeHidden();
	} );
} );
