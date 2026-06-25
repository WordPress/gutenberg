/**
 * External dependencies
 */
import type { BrowserContext, Page, Request } from '@playwright/test';

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
import { test, expect } from './fixtures';

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';
const ADMIN_USER = process.env.WP_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.WP_PASSWORD || 'password';
const DELAYED_CONTROL_MS = 12000;

type RestField = { raw?: string; rendered?: string } | string;
type RestPost = {
	content?: RestField;
	id: number;
};

type SyncEvidence = {
	count: number;
	rooms: Set< string >;
};

type SaveTraceEntry = {
	label: string;
	method: string;
	requestPostData: string;
	requestAt: string;
	responseContentRaw?: string;
	responseAt?: string;
	responseStatus?: number;
	url: string;
};

type SaveSummary = {
	label: string;
	requestHasA: boolean;
	requestHasB: boolean;
	responseHasA: boolean;
	responseHasB: boolean;
	responseStatus?: number;
};

type ScenarioResult = {
	attempt: number;
	beforeBSaveHadA: boolean;
	bSave?: SaveSummary;
	finalContent: string;
	finalHasA: boolean;
	finalHasB: boolean;
	markerA: string;
	markerB: string;
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
	const url = request.url();
	const method = request.method();
	return (
		( method === 'POST' || method === 'PUT' ) &&
		( url.includes( `/wp/v2/posts/${ postId }` ) ||
			url.includes( `rest_route=%2Fwp%2Fv2%2Fposts%2F${ postId }` ) )
	);
}

function attachSaveTrace( page: Page, label: string, postId: number ) {
	const entries: SaveTraceEntry[] = [];

	page.on( 'request', ( request ) => {
		if ( ! isPostSaveRequest( request, postId ) ) {
			return;
		}
		entries.push( {
			label,
			method: request.method(),
			requestPostData: request.postData() ?? '',
			requestAt: new Date().toISOString(),
			url: request.url(),
		} );
	} );

	page.on( 'response', async ( response ) => {
		const request = response.request();
		if ( ! isPostSaveRequest( request, postId ) ) {
			return;
		}
		const entry = entries
			.slice()
			.reverse()
			.find(
				( item ) =>
					item.url === request.url() &&
					item.method === request.method() &&
					item.responseStatus === undefined
			);
		if ( ! entry ) {
			return;
		}
		entry.responseStatus = response.status();
		entry.responseAt = new Date().toISOString();
		try {
			const body = await response.json();
			entry.responseContentRaw = body?.content?.raw ?? '';
		} catch {
			entry.responseContentRaw = '';
		}
	} );

	return entries;
}

function requestContent( entry: SaveTraceEntry ) {
	try {
		return String( JSON.parse( entry.requestPostData )?.content ?? '' );
	} catch {}
	return new URLSearchParams( entry.requestPostData ).get( 'content' ) ?? '';
}

function summarizeSave(
	entries: SaveTraceEntry[],
	markerA: string,
	markerB: string,
	label: string
): SaveSummary | undefined {
	const candidates = entries
		.filter( ( entry ) => entry.label === label )
		.map( ( entry ) => {
			const requestBody = requestContent( entry );
			const responseBody = String( entry.responseContentRaw ?? '' );
			return {
				label,
				requestHasA: requestBody.includes( markerA ),
				requestHasB: requestBody.includes( markerB ),
				responseHasA: responseBody.includes( markerA ),
				responseHasB: responseBody.includes( markerB ),
				responseStatus: entry.responseStatus,
			};
		} );

	return (
		candidates
			.slice()
			.reverse()
			.find( ( entry ) => entry.requestHasA || entry.requestHasB ) ??
		candidates.at( -1 )
	);
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

async function saveDraftWithToolbar( page: Page ) {
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
	await button.click();
	await page.waitForFunction(
		() =>
			! ( window as any ).wp.data.select( 'core/editor' ).isSavingPost(),
		undefined,
		{ timeout: 30000 }
	);
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
							path: `/wp/v2/posts/${ postId }?context=edit`,
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
				path: `/wp/v2/posts/${ postId }?context=edit`,
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
	const post = await requestUtils.createPost( {
		title: `Same-account stale save ${ Date.now() }`,
		status: 'draft',
		date_gmt: new Date().toISOString(),
		content: paragraphMarkup( 'Initial body.' ),
	} );
	const postId = post.id;
	const room = `postType/post:${ postId }`;
	let secondaryContext: BrowserContext | undefined;

	try {
		await openPrimaryEditor( admin, editor, page, postId );
		const joined = await openSameAdminEditor( admin, postId );
		secondaryContext = joined.context;
		const pageB = joined.page;

		const syncA = syncObserver( page );
		const syncB = syncObserver( pageB );
		const saveTraceA = attachSaveTrace( page, 'A', postId );
		const saveTraceB = attachSaveTrace( pageB, 'B', postId );

		await waitForMutualDiscovery( page, pageB );
		await Promise.all( [
			waitForSyncRoom( syncA, room, 'Window A' ),
			waitForSyncRoom( syncB, room, 'Window B' ),
		] );
		const rtc = await collectRtcEvidence( page );

		await appendParagraphWithKeyboard( page, markerA );
		await saveDraftWithToolbar( page );
		await waitForServerText( requestUtils, postId, markerA );

		if ( delayBeforeBSaveMs > 0 ) {
			await sleep( delayBeforeBSaveMs );
		}

		const beforeBSaveHadA = await editorHasText( pageB, markerA );
		if ( requireStaleBeforeBSave && beforeBSaveHadA ) {
			return {
				attempt,
				beforeBSaveHadA,
				finalContent: '',
				finalHasA: false,
				finalHasB: false,
				markerA,
				markerB,
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

		await appendParagraphWithKeyboard( pageB, markerB );
		await saveDraftWithToolbar( pageB );
		await waitForServerText( requestUtils, postId, markerB );

		const finalContent = await getPersistedContent( requestUtils, postId );
		const combinedTrace = [ ...saveTraceA, ...saveTraceB ];
		return {
			attempt,
			beforeBSaveHadA,
			bSave: summarizeSave( combinedTrace, markerA, markerB, 'B' ),
			finalContent,
			finalHasA: finalContent.includes( markerA ),
			finalHasB: finalContent.includes( markerB ),
			markerA,
			markerB,
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
		expect( result.bSave?.requestHasB ).toBe( true );
		expect( result.finalHasA ).toBe( true );
		expect( result.finalHasB ).toBe( true );
	} );

	test( 'preserves both edits after the stale window receives polling updates', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	}, testInfo ) => {
		test.setTimeout( 150000 );
		void collaborationUtils;

		const result = await runSameAccountScenario( {
			admin,
			attempt: 1,
			delayBeforeBSaveMs: DELAYED_CONTROL_MS,
			editor,
			page,
			requestUtils,
			requireStaleBeforeBSave: false,
		} );

		await testInfo.attach( 'same-account-delayed-control-trace', {
			body: JSON.stringify( result, null, 2 ),
			contentType: 'application/json',
		} );

		expect( result.rtc.collaborationEnabled ).toBe( true );
		expect( result.syncA.rooms ).toContain( result.room );
		expect( result.syncB.rooms ).toContain( result.room );
		expect( result.beforeBSaveHadA ).toBe( true );
		expect( result.bSave?.requestHasB ).toBe( true );
		expect( result.finalHasA ).toBe( true );
		expect( result.finalHasB ).toBe( true );
	} );
} );
