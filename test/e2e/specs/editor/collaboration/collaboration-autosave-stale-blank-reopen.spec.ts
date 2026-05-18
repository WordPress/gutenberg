/**
 * External dependencies
 */
import type { BrowserContext, Page } from '@playwright/test';
import * as Y from 'yjs';
import * as buffer from 'lib0/buffer';

/**
 * WordPress dependencies
 */
import {
	Editor,
	type RequestUtils,
} from '@wordpress/e2e-test-utils-playwright';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

type RestField = { raw?: string; rendered?: string } | string;

type RestPost = {
	content?: RestField;
	meta?: { _crdt_document?: string };
	status: string;
	title?: RestField;
};

type RestRevision = {
	content?: RestField;
};

type EditorSnapshot = {
	blockCount: number;
	content: string;
	hasMarker: boolean;
	title: string;
};

const BASE_URL = process.env.WP_BASE_URL || 'http://localhost:8889';

function rawField( field?: RestField ): string {
	if ( ! field ) {
		return '';
	}
	return typeof field === 'string'
		? field
		: field.raw ?? field.rendered ?? '';
}

function crdtDocumentHasMarker(
	serialized: string | undefined,
	marker: string
) {
	if ( ! serialized ) {
		return false;
	}

	try {
		const { document } = JSON.parse( serialized );
		const doc = new Y.Doc();
		Y.applyUpdateV2( doc, buffer.fromBase64( document ) );
		return JSON.stringify( doc.getMap( 'document' ).toJSON() ).includes(
			marker
		);
	} catch {
		return false;
	}
}

function postIdFromEditorUrl( rawUrl: string ): number {
	const postId = Number( new URL( rawUrl ).searchParams.get( 'post' ) );
	if ( ! postId ) {
		throw new Error( `Could not find post ID in editor URL: ${ rawUrl }` );
	}
	return postId;
}

async function sleep( ms: number ) {
	await new Promise( ( resolve ) => setTimeout( resolve, ms ) );
}

async function waitForEditorReady( page: Page, timeout = 30_000 ) {
	await page.waitForFunction(
		() => {
			const wp = ( window as any ).wp;
			const data = wp?.data;
			const postId = data?.select( 'core/editor' )?.getCurrentPostId?.();

			return (
				( window as any )._wpCollaborationEnabled === true &&
				!! data &&
				!! wp?.blocks &&
				!! document.querySelector( '.edit-post-layout' ) &&
				!! postId &&
				data
					.select( 'core' )
					.hasFinishedResolution( 'getEntityRecord', [
						'postType',
						'post',
						postId,
					] )
			);
		},
		undefined,
		{ timeout }
	);
}

async function waitForSaveSettled( page: Page ) {
	await page.waitForFunction(
		() => {
			const editorSelect = ( window as any ).wp?.data?.select(
				'core/editor'
			);
			return (
				!! editorSelect &&
				! editorSelect.isSavingPost() &&
				! editorSelect.isAutosavingPost()
			);
		},
		undefined,
		{ timeout: 30_000 }
	);
}

async function setStablePreferences( page: Page ) {
	await page.evaluate( () => {
		const preferences = ( window as any ).wp.data.dispatch(
			'core/preferences'
		);
		preferences.set( 'core/edit-post', 'welcomeGuide', false );
		preferences.set( 'core/edit-post', 'fullscreenMode', false );
	} );
}

async function loginUser( page: Page ) {
	await page.goto( '/wp-login.php', { waitUntil: 'domcontentloaded' } );
	await page.locator( '#user_login' ).fill( SECOND_USER.username );
	await page.locator( '#user_pass' ).fill( SECOND_USER.password );
	await page.getByRole( 'button', { name: 'Log In' } ).click();
	await page.waitForURL( '**/wp-admin/**', { timeout: 30_000 } );
}

async function openDraftFromPostsList( {
	context,
	title,
}: {
	context: BrowserContext;
	title: string;
} ): Promise< Page > {
	const listPage = await context.newPage();
	const params = new URLSearchParams( {
		post_status: 'draft',
		post_type: 'post',
		s: title,
	} );

	for ( let attempt = 0; attempt < 30; attempt++ ) {
		await listPage.goto( `/wp-admin/edit.php?${ params }`, {
			waitUntil: 'domcontentloaded',
		} );

		const rowTitle = listPage
			.locator( 'a.row-title' )
			.filter( { hasText: title } )
			.first();

		if (
			await rowTitle
				.waitFor( { state: 'visible', timeout: 2_500 } )
				.then( () => true )
				.catch( () => false )
		) {
			await rowTitle.click();
			await listPage.waitForURL(
				/\/wp-admin\/post\.php\?post=\d+&action=edit/,
				{ timeout: 30_000 }
			);
			await waitForEditorReady( listPage );
			await setStablePreferences( listPage );
			return listPage;
		}

		await sleep( 5_000 );
	}

	throw new Error(
		`Draft list row for "${ title }" did not appear in time.`
	);
}

async function openEditorPage(
	context: BrowserContext,
	url: string
): Promise< Page > {
	const editorPage = await context.newPage();
	editorPage.on( 'dialog', ( dialog ) => dialog.accept() );
	await editorPage.goto( url, { waitUntil: 'domcontentloaded' } );
	await waitForEditorReady( editorPage );
	await setStablePreferences( editorPage );
	return editorPage;
}

async function getEditorSnapshot(
	page: Page,
	marker: string
): Promise< EditorSnapshot > {
	return page.evaluate( ( bodyMarker ) => {
		const data = ( window as any ).wp.data;
		const editorSelect = data.select( 'core/editor' );
		const blocks = data.select( 'core/block-editor' ).getBlocks();
		const content = editorSelect.getEditedPostAttribute( 'content' ) ?? '';
		const title = editorSelect.getEditedPostAttribute( 'title' ) ?? '';
		const serialized = JSON.stringify( {
			blocks,
			content,
			title,
		} );

		return {
			blockCount: blocks.length,
			content,
			hasMarker: serialized.includes( bodyMarker ),
			title,
		};
	}, marker );
}

async function addBodyMarker( editor: Editor, page: Page, marker: string ) {
	const addDefaultBlock = editor.canvas.getByRole( 'button', {
		name: 'Add default block',
	} );

	if ( await addDefaultBlock.isVisible().catch( () => false ) ) {
		await addDefaultBlock.click();
	} else {
		await editor.canvas
			.locator( '[data-type="core/paragraph"]' )
			.last()
			.click();
	}

	await page.keyboard.type( marker );
}

async function getRestPost(
	requestUtils: RequestUtils,
	postId: number
): Promise< RestPost > {
	return requestUtils.rest< RestPost >( {
		path: `/wp/v2/posts/${ postId }`,
		params: { context: 'edit' },
	} );
}

async function getRevisionMarkerCount(
	requestUtils: RequestUtils,
	postId: number,
	marker: string
): Promise< number > {
	const revisions = await requestUtils
		.rest< RestRevision[] >( {
			path: `/wp/v2/posts/${ postId }/revisions`,
			params: { context: 'edit', per_page: 20 },
		} )
		.catch( () => [] );

	return revisions.filter( ( revision ) =>
		rawField( revision.content ).includes( marker )
	).length;
}

async function expectSavedPostContainsMarker(
	requestUtils: RequestUtils,
	postId: number,
	title: string,
	marker: string
) {
	await expect
		.poll(
			async () => {
				const post = await getRestPost( requestUtils, postId );
				return {
					contentHasMarker: rawField( post.content ).includes(
						marker
					),
					crdtDocumentHasMarker: crdtDocumentHasMarker(
						post.meta?._crdt_document,
						marker
					),
					title: rawField( post.title ),
				};
			},
			{ timeout: 20_000 }
		)
		.toEqual( {
			contentHasMarker: true,
			crdtDocumentHasMarker: true,
			title,
		} );

	await expect
		.poll( () => getRevisionMarkerCount( requestUtils, postId, marker ), {
			timeout: 10_000,
		} )
		.toBeGreaterThan( 0 );
}

async function expectEditorShowsSavedPost(
	page: Page,
	title: string,
	marker: string
) {
	const snapshot = await getEditorSnapshot( page, marker );

	expect( snapshot.title ).toBe( title );
	expect( snapshot.hasMarker ).toBe( true );
	expect( snapshot.content ).toContain( marker );
	expect( snapshot.blockCount ).toBeGreaterThan( 0 );
}

test.describe( 'Collaboration - autosaved draft opened from Posts', () => {
	test( 'keeps the saved title and body after a stale blank collaborator tab closes', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 240_000 );

		const unique = Date.now();
		const title = `RTC natural title-only draft ${ unique }`;
		const marker = `rtc-natural-body-marker-${ unique }`;
		const browser = page.context().browser();

		if ( ! browser ) {
			throw new Error( 'Browser unavailable.' );
		}

		let secondContext: BrowserContext | undefined;
		let secondPage: Page | undefined;
		let freshPage: Page | undefined;
		let directPage: Page | undefined;

		try {
			secondContext = await browser.newContext( {
				baseURL: BASE_URL,
				storageState: { cookies: [], origins: [] },
				viewport: { height: 700, width: 960 },
			} );

			const loginPage = await secondContext.newPage();
			await loginUser( loginPage );
			await loginPage.close();

			await admin.createNewPost( { postType: 'post' } );
			await waitForEditorReady( page );
			await collaborationUtils.waitForCollaborationReady( page, {
				timeout: 30_000,
			} );
			await setStablePreferences( page );

			await editor.canvas
				.getByRole( 'textbox', { name: 'Add title' } )
				.fill( title );

			secondPage = await openDraftFromPostsList( {
				context: secondContext,
				title,
			} );

			const visibleEditUrl = secondPage.url();
			const postId = postIdFromEditorUrl( visibleEditUrl );
			const secondEditor = new Editor( { page: secondPage } );

			await secondEditor.canvas
				.getByRole( 'textbox', { name: /Add title|Title/ } )
				.fill( '' );

			const saveButton = secondPage
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Save draft' } );
			await expect( saveButton ).toBeDisabled();

			await page.bringToFront();
			await addBodyMarker( editor, page, marker );
			await editor.saveDraft();
			await waitForSaveSettled( page );

			await expectSavedPostContainsMarker(
				requestUtils,
				postId,
				title,
				marker
			);

			freshPage = await openEditorPage( page.context(), visibleEditUrl );
			await expectEditorShowsSavedPost( freshPage, title, marker );
			await freshPage.close();
			freshPage = undefined;

			await secondPage.close();
			secondPage = undefined;

			directPage = await openEditorPage( page.context(), visibleEditUrl );
			await expectEditorShowsSavedPost( directPage, title, marker );
			await sleep( 5_000 );
			await expectEditorShowsSavedPost( directPage, title, marker );
			await directPage.close();
			directPage = undefined;

			for ( let index = 0; index < 2; index++ ) {
				const repeatPage = await openEditorPage(
					page.context(),
					visibleEditUrl
				);
				await expectEditorShowsSavedPost( repeatPage, title, marker );
				await repeatPage.close();
			}
		} finally {
			await directPage?.close().catch( () => undefined );
			await freshPage?.close().catch( () => undefined );
			await secondPage?.close().catch( () => undefined );
			await secondContext?.close().catch( () => undefined );
		}
	} );
} );
