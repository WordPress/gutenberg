/**
 * External dependencies
 */
import type { BrowserContext, Page, Request, Route } from '@playwright/test';

/**
 * WordPress dependencies
 */
import type {
	Admin,
	Editor,
	RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from '../fixtures';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';
const ADMIN_USER = process.env.WP_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.WP_PASSWORD || 'password';

type RestField = { raw?: string; rendered?: string } | string;
type RestPost = {
	content?: RestField;
	id: number;
};

type SyncEvidence = {
	count: number;
	rooms: Set< string >;
};

type SaveSummary = {
	label: string;
	requestParagraphs: string[];
	requestHasInitial: boolean;
	requestHasA: boolean;
	requestHasB: boolean;
	requestHasC: boolean;
	responseParagraphs: string[];
	responseHasInitial: boolean;
	responseHasA: boolean;
	responseHasB: boolean;
	responseHasC: boolean;
	responseStatus: number;
};

type ScenarioResult = {
	attempt: number;
	afterBSaveDirty: boolean;
	afterBSaveHadA: boolean;
	afterBSaveHadB: boolean;
	beforeBSaveHadA: boolean;
	bSave?: SaveSummary;
	followUpSave?: SaveSummary;
	finalContent: string;
	finalParagraphs: string[];
	finalHasA: boolean;
	finalHasB: boolean;
	finalHasC: boolean;
	markerA: string;
	markerB: string;
	markerC: string;
	postId: number;
	room: string;
	rtc: {
		collaborationEnabled: boolean;
		scripts: string[];
	};
	stalePreconditionExercised: boolean;
	syncA: {
		count: number;
		rooms: string[];
	};
	syncB: {
		count: number;
		rooms: string[];
	};
};

function paragraphMarkup( content: string ) {
	return `<!-- wp:paragraph --><p>${ content }</p><!-- /wp:paragraph -->`;
}

function rawField( field?: RestField ): string {
	if ( ! field ) {
		return '';
	}
	return typeof field === 'string'
		? field
		: field.raw ?? field.rendered ?? '';
}

function paragraphContents( content: string ) {
	return Array.from(
		content.matchAll( /<p(?:\s[^>]*)?>(.*?)<\/p>/gs ),
		( match ) => match[ 1 ]
	);
}

function sleep( ms: number ) {
	return new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

function syncObserver( page: Page ): SyncEvidence {
	const state: SyncEvidence = { count: 0, rooms: new Set() };

	page.on( 'response', async ( response ) => {
		if (
			! response.url().includes( 'wp-sync' ) ||
			response.status() !== 200
		) {
			return;
		}
		state.count += 1;
		try {
			const payload = await response.json();
			for ( const room of payload?.rooms ?? [] ) {
				if ( room?.room ) {
					state.rooms.add( room.room );
				}
			}
		} catch {}
	} );

	return state;
}

function isPostSaveRequest( request: Request, postId: number ) {
	const url = new URL( request.url() );
	const method = request.method();
	const expectedRoute = `/wp/v2/posts/${ postId }`;
	const pathname = url.pathname.replace( /\/$/, '' );
	const restRoute = url.searchParams
		.get( 'rest_route' )
		?.replace( /\/$/, '' );

	return (
		( method === 'POST' || method === 'PUT' ) &&
		( pathname.endsWith( `/wp-json${ expectedRoute }` ) ||
			restRoute === expectedRoute )
	);
}

function requestContent( request: Request ) {
	const postData = request.postData() ?? '';
	try {
		return String( JSON.parse( postData )?.content ?? '' );
	} catch {}
	return new URLSearchParams( postData ).get( 'content' ) ?? '';
}

async function holdSyncRequests( page: Page ) {
	let releaseGate = () => {};
	let hasInterceptedRequest = false;
	const gate = new Promise< void >( ( resolve ) => {
		releaseGate = resolve;
	} );
	const matchesSyncRequest = ( url: URL ) => {
		const decodedUrl = decodeURIComponent( url.href );
		return (
			decodedUrl.includes( '/wp-json/wp-sync/v1/updates' ) ||
			decodedUrl.includes( 'rest_route=/wp-sync/v1/updates' )
		);
	};
	const handler = async ( route: Route ) => {
		hasInterceptedRequest = true;
		await gate;
		await route.continue();
	};

	await page.route( matchesSyncRequest, handler );
	let released = false;

	return {
		release: () => {
			if ( released ) {
				return;
			}
			released = true;
			releaseGate();
		},
		waitUntilBlocked: async () => {
			await expect
				.poll( () => hasInterceptedRequest, { timeout: 35000 } )
				.toBe( true );
		},
	};
}

async function waitForEditorReady( page: Page, postId: number ) {
	await page.waitForFunction(
		( id ) =>
			( window as any )._wpCollaborationEnabled === true &&
			( window as any ).wp?.data &&
			( window as any ).wp?.blocks &&
			( window as any ).wp.data
				.select( 'core/editor' )
				.getCurrentPostId() === Number( id ) &&
			( window as any ).wp.data
				.select( 'core' )
				.hasFinishedResolution( 'getEntityRecord', [
					'postType',
					'post',
					Number( id ),
				] ) &&
			! ( window as any ).wp.data.select( 'core/editor' ).isSavingPost(),
		postId,
		{ timeout: 30000 }
	);
	await page.waitForFunction(
		() => document.querySelector( 'iframe[name="editor-canvas"]' ),
		undefined,
		{ timeout: 30000 }
	);
}

async function openPrimaryEditor(
	admin: Admin,
	editor: Editor,
	page: Page,
	postId: number
) {
	await admin.visitAdminPage( 'post.php', `post=${ postId }&action=edit` );
	await editor.setPreferences( 'core/edit-post', {
		welcomeGuide: false,
		fullscreenMode: false,
	} );
	await waitForEditorReady( page, postId );
}

async function openSameAdminEditor( admin: Admin, postId: number ) {
	const context = await admin.browser.newContext( {
		baseURL: BASE_URL,
	} );
	const page = await context.newPage();

	try {
		await page.goto( '/wp-login.php' );
		await page.locator( '#user_login' ).fill( ADMIN_USER );
		await page.locator( '#user_pass' ).fill( ADMIN_PASSWORD );
		await page.getByRole( 'button', { name: 'Log In' } ).click();
		await page.waitForURL( '**/wp-admin/**' );

		await page.goto( `/wp-admin/post.php?post=${ postId }&action=edit` );
		await page.waitForFunction(
			() => ( window as any ).wp?.data && ( window as any ).wp?.blocks,
			undefined,
			{ timeout: 30000 }
		);
		await page.evaluate( () => {
			( window as any ).wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'welcomeGuide', false );
			( window as any ).wp.data
				.dispatch( 'core/preferences' )
				.set( 'core/edit-post', 'fullscreenMode', false );
		} );
		await waitForEditorReady( page, postId );
		return { context, page };
	} catch ( error ) {
		await context.close();
		throw error;
	}
}

async function waitForMutualDiscovery( pageA: Page, pageB: Page ) {
	await Promise.all(
		[ pageA, pageB ].map( ( page ) =>
			page
				.getByRole( 'button', { name: /Collaborators list/ } )
				.waitFor( { timeout: 30000 } )
		)
	);
}

async function waitForSyncRoom(
	state: SyncEvidence,
	room: string,
	label: string
) {
	await expect
		.poll(
			() => ( {
				count: state.count,
				hasRoom: state.rooms.has( room ),
				rooms: Array.from( state.rooms ),
			} ),
			{
				message: `${ label } should poll ${ room } via /wp-sync`,
				timeout: 35000,
			}
		)
		.toMatchObject( {
			hasRoom: true,
		} );
}

async function collectRtcEvidence( page: Page ) {
	return page.evaluate( () => ( {
		collaborationEnabled:
			( window as any )._wpCollaborationEnabled === true,
		scripts: Array.from( document.scripts )
			.map( ( script ) => script.src )
			.filter(
				( src ) =>
					src.includes( '/build/scripts/sync/' ) ||
					src.includes( '/build/scripts/core-data/' ) ||
					src.includes( '/build/scripts/editor/' ) ||
					src.includes( '/build/scripts/edit-post/' )
			),
	} ) );
}

function editorFrame( page: Page ) {
	const frame = page.frame( { name: 'editor-canvas' } );
	if ( ! frame ) {
		throw new Error( 'Editor iframe is not available.' );
	}
	return frame;
}

async function appendParagraphWithKeyboard( page: Page, marker: string ) {
	const frame = editorFrame( page );
	const editable = frame
		.locator( '[data-type="core/paragraph"][contenteditable="true"]' )
		.first();
	await editable.waitFor( { state: 'visible', timeout: 30000 } );

	await editable.click();
	await page.keyboard.press( 'End' );
	await page.keyboard.press( 'Enter' );
	await page.keyboard.type( marker );
	await page.waitForFunction(
		( expected ) =>
			( window as any ).wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.some( ( block: { attributes?: { content?: string } } ) =>
					String( block.attributes?.content ?? '' ).includes(
						expected
					)
				),
		marker,
		{ timeout: 7000 }
	);
	await page.waitForFunction(
		( expected ) =>
			String(
				( window as any ).wp.data
					.select( 'core/editor' )
					.getEditedPostContent()
			).includes( expected ),
		marker,
		{ timeout: 7000 }
	);
}

async function appendParagraphProgrammatically( page: Page, marker: string ) {
	await page.evaluate( ( content ) => {
		const block = ( window as any ).wp.blocks.createBlock(
			'core/paragraph',
			{
				content,
			}
		);
		( window as any ).wp.data
			.dispatch( 'core/block-editor' )
			.insertBlocks( block );
	}, marker );
	await page.waitForFunction(
		( expected ) =>
			String(
				( window as any ).wp.data
					.select( 'core/editor' )
					.getEditedPostContent()
			).includes( expected ),
		marker,
		{ timeout: 7000 }
	);
}

async function saveDraftWithToolbar(
	page: Page,
	postId: number,
	label: string,
	initialText: string,
	markerA: string,
	markerB: string,
	markerC: string
): Promise< SaveSummary > {
	const button = page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: /^Save draft$/ } );
	await button.waitFor( { state: 'visible', timeout: 30000 } );
	await page.waitForFunction(
		() =>
			( window as any ).wp.data
				.select( 'core/editor' )
				.isEditedPostDirty(),
		undefined,
		{ timeout: 30000 }
	);
	const responsePromise = page.waitForResponse(
		( response ) => isPostSaveRequest( response.request(), postId ),
		{ timeout: 30000 }
	);
	await button.click();
	const response = await responsePromise;
	let responseContent = '';
	try {
		responseContent = rawField( ( await response.json() )?.content );
	} catch {}
	await page.waitForFunction(
		() =>
			! ( window as any ).wp.data.select( 'core/editor' ).isSavingPost(),
		undefined,
		{ timeout: 30000 }
	);

	const sentContent = requestContent( response.request() );
	return {
		label,
		requestParagraphs: paragraphContents( sentContent ),
		requestHasInitial: sentContent.includes( initialText ),
		requestHasA: sentContent.includes( markerA ),
		requestHasB: sentContent.includes( markerB ),
		requestHasC: sentContent.includes( markerC ),
		responseParagraphs: paragraphContents( responseContent ),
		responseHasInitial: responseContent.includes( initialText ),
		responseHasA: responseContent.includes( markerA ),
		responseHasB: responseContent.includes( markerB ),
		responseHasC: responseContent.includes( markerC ),
		responseStatus: response.status(),
	};
}

async function editorHasText( page: Page, marker: string ) {
	return page.evaluate(
		( expected ) =>
			( window as any ).wp.data
				.select( 'core/block-editor' )
				.getBlocks()
				.some( ( block: { attributes?: { content?: string } } ) =>
					String( block.attributes?.content ?? '' ).includes(
						expected
					)
				),
		marker
	);
}

async function waitForServerText(
	requestUtils: RequestUtils,
	postId: number,
	marker: string
) {
	await expect
		.poll(
			async () =>
				rawField(
					(
						await requestUtils.rest< RestPost >( {
							path: `/wp/v2/posts/${ postId }`,
							params: { context: 'edit' },
						} )
					).content
				),
			{ timeout: 30000 }
		)
		.toContain( marker );
}

async function getPersistedContent(
	requestUtils: RequestUtils,
	postId: number
) {
	return rawField(
		(
			await requestUtils.rest< RestPost >( {
				path: `/wp/v2/posts/${ postId }`,
				params: { context: 'edit' },
			} )
		).content
	);
}

async function runSameAccountScenario( {
	admin,
	attempt,
	delayBeforeBSaveMs,
	editor,
	page,
	requestUtils,
	requireStaleBeforeBSave,
}: {
	admin: Admin;
	attempt: number;
	delayBeforeBSaveMs: number;
	editor: Editor;
	page: Page;
	requestUtils: RequestUtils;
	requireStaleBeforeBSave: boolean;
} ): Promise< ScenarioResult > {
	const markerA = `rtc-a-${ Date.now() }-${ attempt }`;
	const markerB = `rtc-b-${ Date.now() }-${ attempt }`;
	const markerC = `rtc-c-${ Date.now() }-${ attempt }`;
	const initialText = 'Initial body.';
	const post = await requestUtils.createPost( {
		title: `Same-account stale save ${ Date.now() }`,
		status: 'draft',
		date_gmt: new Date().toISOString(),
		content: paragraphMarkup( initialText ),
	} );
	const postId = post.id;
	const room = `postType/post:${ postId }`;
	let secondaryContext: BrowserContext | undefined;
	let releaseSecondarySync: ( () => void ) | undefined;

	try {
		await openPrimaryEditor( admin, editor, page, postId );
		const joined = await openSameAdminEditor( admin, postId );
		secondaryContext = joined.context;
		const pageB = joined.page;

		const syncA = syncObserver( page );
		const syncB = syncObserver( pageB );

		await waitForMutualDiscovery( page, pageB );
		await Promise.all( [
			waitForSyncRoom( syncA, room, 'Window A' ),
			waitForSyncRoom( syncB, room, 'Window B' ),
		] );
		const rtc = await collectRtcEvidence( page );
		const secondarySyncGate = await holdSyncRequests( pageB );
		releaseSecondarySync = secondarySyncGate.release;
		// Polling is sequential. Intercepting the next request proves any request
		// that started before the route was installed has already completed.
		await secondarySyncGate.waitUntilBlocked();

		await appendParagraphWithKeyboard( page, markerA );
		await saveDraftWithToolbar(
			page,
			postId,
			'A',
			initialText,
			markerA,
			markerB,
			markerC
		);
		await waitForServerText( requestUtils, postId, markerA );

		if ( delayBeforeBSaveMs > 0 ) {
			await sleep( delayBeforeBSaveMs );
		}

		await appendParagraphWithKeyboard( pageB, markerB );
		const beforeBSaveHadA = await editorHasText( pageB, markerA );
		if ( requireStaleBeforeBSave && beforeBSaveHadA ) {
			return {
				attempt,
				afterBSaveDirty: false,
				afterBSaveHadA: false,
				afterBSaveHadB: false,
				beforeBSaveHadA,
				finalContent: '',
				finalParagraphs: [],
				finalHasA: false,
				finalHasB: false,
				finalHasC: false,
				markerA,
				markerB,
				markerC,
				postId,
				room,
				rtc,
				stalePreconditionExercised: false,
				syncA: {
					count: syncA.count,
					rooms: Array.from( syncA.rooms ),
				},
				syncB: {
					count: syncB.count,
					rooms: Array.from( syncB.rooms ),
				},
			};
		}

		const bSave = await saveDraftWithToolbar(
			pageB,
			postId,
			'B',
			initialText,
			markerA,
			markerB,
			markerC
		);
		await waitForServerText( requestUtils, postId, markerB );
		await expect
			.poll( () => editorHasText( pageB, markerA ), { timeout: 10000 } )
			.toBe( true );
		await expect
			.poll(
				() =>
					pageB.evaluate( () =>
						( window as any ).wp.data
							.select( 'core/editor' )
							.isEditedPostDirty()
					),
				{ timeout: 10000 }
			)
			.toBe( false );
		const afterBSaveHadA = await editorHasText( pageB, markerA );
		const afterBSaveHadB = await editorHasText( pageB, markerB );
		const afterBSaveDirty = await pageB.evaluate( () =>
			( window as any ).wp.data
				.select( 'core/editor' )
				.isEditedPostDirty()
		);

		// Save once more before polling is released. This proves the accepted
		// candidate became B's live editor state, not only a one-off REST payload.
		await appendParagraphProgrammatically( pageB, markerC );
		const followUpSave = await saveDraftWithToolbar(
			pageB,
			postId,
			'B follow-up',
			initialText,
			markerA,
			markerB,
			markerC
		);
		await waitForServerText( requestUtils, postId, markerC );

		const finalContent = await getPersistedContent( requestUtils, postId );
		releaseSecondarySync();
		releaseSecondarySync = undefined;
		return {
			attempt,
			afterBSaveDirty,
			afterBSaveHadA,
			afterBSaveHadB,
			beforeBSaveHadA,
			bSave,
			followUpSave,
			finalContent,
			finalParagraphs: paragraphContents( finalContent ),
			finalHasA: finalContent.includes( markerA ),
			finalHasB: finalContent.includes( markerB ),
			finalHasC: finalContent.includes( markerC ),
			markerA,
			markerB,
			markerC,
			postId,
			room,
			rtc,
			stalePreconditionExercised: true,
			syncA: {
				count: syncA.count,
				rooms: Array.from( syncA.rooms ),
			},
			syncB: {
				count: syncB.count,
				rooms: Array.from( syncB.rooms ),
			},
		};
	} finally {
		releaseSecondarySync?.();
		await secondaryContext?.close();
	}
}

async function runUntilStalePrecondition(
	options: Omit<
		Parameters< typeof runSameAccountScenario >[ 0 ],
		'attempt'
	>,
	maxAttempts: number
) {
	let lastResult: ScenarioResult | undefined;
	for ( let attempt = 1; attempt <= maxAttempts; attempt++ ) {
		lastResult = await runSameAccountScenario( {
			...options,
			attempt,
		} );
		if ( lastResult.stalePreconditionExercised ) {
			return lastResult;
		}
	}
	throw new Error(
		`Could not exercise a stale same-account editor window after ${ maxAttempts } attempts. Last result: ${ JSON.stringify(
			lastResult
		) }`
	);
}

test.describe( 'Collaboration - same-user stale content overwrite', () => {
	test( 'preserves content saved by another same-account window before polling catches up', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	}, testInfo ) => {
		test.setTimeout( 180000 );
		void collaborationUtils;

		const result = await runUntilStalePrecondition(
			{
				admin,
				delayBeforeBSaveMs: 0,
				editor,
				page,
				requestUtils,
				requireStaleBeforeBSave: true,
			},
			6
		);

		await testInfo.attach( 'same-account-stale-save-trace', {
			body: JSON.stringify( result, null, 2 ),
			contentType: 'application/json',
		} );

		expect( result.rtc.collaborationEnabled ).toBe( true );
		expect( result.syncA.rooms ).toContain( result.room );
		expect( result.syncB.rooms ).toContain( result.room );
		expect( result.beforeBSaveHadA ).toBe( false );
		expect( result.afterBSaveHadA ).toBe( true );
		expect( result.afterBSaveHadB ).toBe( true );
		expect( result.afterBSaveDirty ).toBe( false );
		expect( result.bSave?.requestHasInitial ).toBe( true );
		expect( result.bSave?.requestHasA ).toBe( true );
		expect( result.bSave?.requestHasB ).toBe( true );
		expect( result.bSave?.responseStatus ).toBe( 200 );
		expect( result.bSave?.responseHasInitial ).toBe( true );
		expect( result.bSave?.responseHasA ).toBe( true );
		expect( result.bSave?.responseHasB ).toBe( true );
		expect( result.followUpSave?.requestHasInitial ).toBe( true );
		expect( result.followUpSave?.requestHasA ).toBe( true );
		expect( result.followUpSave?.requestHasB ).toBe( true );
		expect( result.followUpSave?.requestHasC ).toBe( true );
		expect( result.followUpSave?.responseStatus ).toBe( 200 );
		expect( result.followUpSave?.responseHasInitial ).toBe( true );
		expect( result.followUpSave?.responseHasA ).toBe( true );
		expect( result.followUpSave?.responseHasB ).toBe( true );
		expect( result.followUpSave?.responseHasC ).toBe( true );
		expect( result.finalContent ).toContain( 'Initial body.' );
		expect( result.finalHasA ).toBe( true );
		expect( result.finalHasB ).toBe( true );
		expect( result.finalHasC ).toBe( true );

		const expectedParagraphs = [
			'Initial body.',
			result.markerA,
			result.markerB,
		].sort();
		const expectedFollowUpParagraphs = [
			...expectedParagraphs,
			result.markerC,
		].sort();
		expect(
			[ ...( result.bSave?.requestParagraphs ?? [] ) ].sort()
		).toEqual( expectedParagraphs );
		expect(
			[ ...( result.bSave?.responseParagraphs ?? [] ) ].sort()
		).toEqual( expectedParagraphs );
		expect(
			[ ...( result.followUpSave?.requestParagraphs ?? [] ) ].sort()
		).toEqual( expectedFollowUpParagraphs );
		expect(
			[ ...( result.followUpSave?.responseParagraphs ?? [] ) ].sort()
		).toEqual( expectedFollowUpParagraphs );
		expect( [ ...result.finalParagraphs ].sort() ).toEqual(
			expectedFollowUpParagraphs
		);
	} );
} );
