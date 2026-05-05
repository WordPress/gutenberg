/**
 * External dependencies
 */
import type { BrowserContext, Page } from '@playwright/test';

/**
 * WordPress dependencies
 */
import { Editor } from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';
const REST_BASE = '/gutenberg-test/v1/sync-storage-cursor-backfill';

const BACKFILLED_TEXT = 'Backfilled split-room paragraph';
const TRIGGER_TEXT = 'Normal merge trigger paragraph';

interface SyncUpdate {
	data: string;
	type: string;
}

interface CapturedSyncUpdate extends SyncUpdate {
	client_id: number;
}

interface SeededSyncUpdate extends CapturedSyncUpdate {
	meta_id: number;
}

interface SyncRoomPayload {
	after: number;
	awareness: Record< string, unknown > | null;
	client_id: number;
	room: string;
	updates: SyncUpdate[];
}

interface SyncPayload {
	rooms: SyncRoomPayload[];
}

interface SyncRoomResponse {
	end_cursor: number;
	room: string;
}

interface SyncResponse {
	rooms: SyncRoomResponse[];
}

interface StorageDiagnosis {
	cursor: number;
	lineages: {
		post_id: number;
		post_name: string;
		updates: SeededSyncUpdate[];
	}[];
}

async function openSecondUserEditor(
	page: Page,
	postId: number
): Promise< Editor > {
	await page.goto( '/wp-login.php' );
	await page.locator( '#user_login' ).fill( SECOND_USER.username );
	await page.locator( '#user_pass' ).fill( SECOND_USER.password );
	await page.getByRole( 'button', { name: 'Log In' } ).click();
	await page.waitForURL( '**/wp-admin/**' );

	await page.goto( `/wp-admin/post.php?post=${ postId }&action=edit` );
	await page.waitForFunction( () => window?.wp?.data && window?.wp?.blocks );
	await page.evaluate( () => {
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-post', 'welcomeGuide', false );
		window.wp.data
			.dispatch( 'core/preferences' )
			.set( 'core/edit-post', 'fullscreenMode', false );
	} );
	await page.waitForFunction(
		() =>
			( window as any )._wpCollaborationEnabled === true &&
			window?.wp?.data &&
			window?.wp?.blocks,
		undefined,
		{ timeout: 15000 }
	);

	return new Editor( { page } );
}

async function typeParagraph( editor: Editor, page: Page, text: string ) {
	await editor.canvas
		.getByRole( 'button', { name: 'Add default block' } )
		.click();
	await page.keyboard.insertText( text );
}

async function getBlockContents( editor: Editor ): Promise< string[] > {
	const blocks = await editor.getBlocks();
	return blocks.map( ( block: { attributes: Record< string, unknown > } ) =>
		String( block.attributes.content ?? '' )
	);
}

function createMockAwareness( roomPayload: SyncRoomPayload ) {
	if ( ! roomPayload.awareness ) {
		return {};
	}

	const fakeClientId = roomPayload.client_id + 1;
	const awareness = roomPayload.awareness as {
		collaboratorInfo?: Record< string, unknown >;
	};

	return {
		[ roomPayload.client_id ]: roomPayload.awareness,
		[ fakeClientId ]: {
			...awareness,
			collaboratorInfo: {
				...( awareness.collaboratorInfo ?? {} ),
				id: 0,
				name: 'Synthetic collaborator',
				slug: 'synthetic-collaborator',
			},
		},
	};
}

async function mockSyncAndCaptureUpdates(
	page: Page,
	room: string,
	capturedUpdates: CapturedSyncUpdate[]
) {
	let responseCount = 0;

	await page.route( /wp-sync/, async ( route ) => {
		const request = route.request();

		if ( request.method() !== 'POST' ) {
			await route.continue();
			return;
		}

		const payload = JSON.parse( request.postData() || '{"rooms":[]}' ) as
			| SyncPayload
			| undefined;

		for ( const roomPayload of payload?.rooms ?? [] ) {
			if ( roomPayload.room !== room ) {
				continue;
			}

			for ( const update of roomPayload.updates ?? [] ) {
				if ( update.type !== 'update' ) {
					continue;
				}

				capturedUpdates.push( {
					client_id: roomPayload.client_id,
					data: update.data,
					type: update.type,
				} );
			}
		}

		responseCount++;

		await route.fulfill( {
			body: JSON.stringify( {
				rooms: ( payload?.rooms ?? [] ).map( ( roomPayload ) => ( {
					awareness: createMockAwareness( roomPayload ),
					end_cursor: roomPayload.after,
					room: roomPayload.room,
					should_compact: false,
					total_updates: 0,
					updates: [],
				} ) ),
			} ),
			contentType: 'application/json',
			status: 200,
		} );
	} );

	return {
		getResponseCount: () => responseCount,
	};
}

async function waitForRoomCursorGreaterThan(
	page: Page,
	room: string,
	cursor: number
) {
	const deadline = Date.now() + 15000;

	while ( Date.now() < deadline ) {
		const response = await page.waitForResponse(
			( candidate ) =>
				candidate.url().includes( 'wp-sync' ) &&
				candidate.status() === 200,
			{ timeout: Math.max( deadline - Date.now(), 1 ) }
		);
		const body = ( await response.json() ) as SyncResponse;
		const roomResponse = body.rooms.find(
			( candidate ) => candidate.room === room
		);

		if ( roomResponse && roomResponse.end_cursor > cursor ) {
			return roomResponse.end_cursor;
		}
	}

	throw new Error(
		`Timed out waiting for ${ room } cursor to advance past ${ cursor }.`
	);
}

async function diagnoseStorage(
	requestUtils: any,
	room: string
): Promise< StorageDiagnosis > {
	return requestUtils.rest< StorageDiagnosis >( {
		path: `${ REST_BASE }/diagnose?room=${ encodeURIComponent( room ) }`,
	} );
}

function diagnosisContainsAllUpdates(
	diagnosis: StorageDiagnosis,
	seededUpdates: SeededSyncUpdate[]
) {
	const storedData = new Set(
		diagnosis.lineages.flatMap( ( lineage ) =>
			lineage.updates.map( ( update ) => update.data )
		)
	);

	return seededUpdates.every( ( update ) => storedData.has( update.data ) );
}

test.describe( 'Collaboration - cursor backfill race', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin(
			'gutenberg-test-plugin-sync-storage-cursor-backfill'
		);
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deactivatePlugin(
			'gutenberg-test-plugin-sync-storage-cursor-backfill'
		);
	} );

	test( 'active session receives a repaired duplicate update after its cursor', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		const { meta_ids: gapIds } = await requestUtils.rest< {
			meta_ids: number[];
		} >( {
			data: { count: 120 },
			method: 'POST',
			path: `${ REST_BASE }/cursor-gaps`,
		} );
		const maxGapId = Math.max( ...gapIds );

		const post = await requestUtils.createPost( {
			date_gmt: new Date().toISOString(),
			status: 'draft',
			title: 'Cursor Backfill Race',
		} );
		const room = `postType/post:${ post.id }`;

		await collaborationUtils.openCollaborativeSession( post.id );
		const { editor2, page2 } = collaborationUtils;

		// The active editor has now observed normal sync updates with cursors
		// allocated after the reserved gaps. The test-only backfill below then
		// simulates a historical duplicate lineage whose source rows are older
		// than this active cursor. Generating that old meta_id ordering from
		// browser-only actions is the non-deterministic production race; the
		// paragraph update itself is captured from a real editor action and
		// then seeded into the duplicate lineage.
		await waitForRoomCursorGreaterThan( page, room, maxGapId );

		let donorContext: BrowserContext | undefined;
		let freshContext: BrowserContext | undefined;

		try {
			donorContext = await admin.browser.newContext( {
				baseURL: BASE_URL,
			} );
			const donorPage = await donorContext.newPage();
			const capturedUpdates: CapturedSyncUpdate[] = [];
			const mockedSync = await mockSyncAndCaptureUpdates(
				donorPage,
				room,
				capturedUpdates
			);
			const donorEditor = await openSecondUserEditor(
				donorPage,
				post.id
			);

			await expect
				.poll( () => mockedSync.getResponseCount(), {
					timeout: 10000,
				} )
				.toBeGreaterThan( 0 );

			await typeParagraph( donorEditor, donorPage, BACKFILLED_TEXT );
			await expect
				.poll( () => capturedUpdates.length, { timeout: 10000 } )
				.toBeGreaterThan( 0 );

			const responsesAfterCapture = mockedSync.getResponseCount();
			await expect
				.poll( () => mockedSync.getResponseCount(), {
					timeout: 5000,
				} )
				.toBeGreaterThanOrEqual( responsesAfterCapture + 1 );

			await donorContext.close();
			donorContext = undefined;

			expect( capturedUpdates.length ).toBeLessThanOrEqual(
				gapIds.length
			);

			const seededUpdates = capturedUpdates.map(
				( update, index ): SeededSyncUpdate => ( {
					...update,
					meta_id: gapIds[ index ],
				} )
			);

			await requestUtils.rest( {
				data: {
					room,
					updates: seededUpdates,
				},
				method: 'POST',
				path: `${ REST_BASE }/duplicate`,
			} );

			const splitDiagnosis = await diagnoseStorage( requestUtils, room );
			expect( splitDiagnosis.lineages.length ).toBeGreaterThan( 1 );

			await typeParagraph( editor2, page2, TRIGGER_TEXT );

			await expect
				.poll(
					async () => {
						const diagnosis = await diagnoseStorage(
							requestUtils,
							room
						);
						return (
							diagnosis.lineages.length === 1 &&
							diagnosisContainsAllUpdates(
								diagnosis,
								seededUpdates
							)
						);
					},
					{ timeout: 10000 }
				)
				.toBe( true );

			await expect
				.poll( () => getBlockContents( editor ), {
					timeout: 10000,
				} )
				.toContain( TRIGGER_TEXT );

			await collaborationUtils.waitForSyncCycle( page, 3 );

			await expect
				.poll( () => getBlockContents( editor ), {
					timeout: 10000,
				} )
				.toContain( BACKFILLED_TEXT );

			const activeContents = await getBlockContents( editor );
			expect( activeContents ).toContain( TRIGGER_TEXT );

			freshContext = await admin.browser.newContext( {
				baseURL: BASE_URL,
			} );
			const freshPage = await freshContext.newPage();
			const freshEditor = await openSecondUserEditor(
				freshPage,
				post.id
			);

			await waitForRoomCursorGreaterThan( freshPage, room, 0 );

			await expect
				.poll( () => getBlockContents( freshEditor ), {
					timeout: 10000,
				} )
				.toContain( BACKFILLED_TEXT );
		} finally {
			await donorContext?.close();
			await freshContext?.close();
		}
	} );
} );
