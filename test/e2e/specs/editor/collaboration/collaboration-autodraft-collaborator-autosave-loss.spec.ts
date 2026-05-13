/**
 * External dependencies
 */
import type { Page, Response } from '@playwright/test';

/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';
import { SECOND_USER } from './fixtures/collaboration-utils';

type RestPost = {
	id: number;
	status: string;
	title?: { raw?: string; rendered?: string } | string;
	content?: { raw?: string; rendered?: string } | string;
};

function rawField( field: RestPost[ 'title' ] ): string {
	if ( ! field ) {
		return '';
	}

	return typeof field === 'string'
		? field
		: field.raw ?? field.rendered ?? '';
}

async function getCurrentPostId( page: Page ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

function isAutosaveResponse( response: Response, postId: number ): boolean {
	if ( response.request().method() !== 'POST' ) {
		return false;
	}

	const url = new URL( response.url() );
	const route = `/wp/v2/posts/${ postId }/autosaves`;

	return (
		url.pathname.includes( `/wp-json${ route }` ) ||
		url.searchParams.get( 'rest_route' ) === route
	);
}

async function useFastAutosaveInterval( page: Page ): Promise< void > {
	await page.evaluate( () => {
		const editorStore = ( window as any ).wp.data.select( 'core/editor' );
		const settings = editorStore.getEditorSettings();

		( window as any ).wp.data
			.dispatch( 'core/editor' )
			.updateEditorSettings( {
				...settings,
				autosaveInterval: 1,
			} );
	} );
}

test.describe( 'Collaboration - auto-draft collaborator autosave retention', () => {
	test( 'keeps a new post discoverable when a collaborator makes the first autosaved edit', async ( {
		admin,
		collaborationUtils,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const title = 'RTC collaborator first autosave title';
		const marker = 'rtc-collaborator-first-autosave-content';

		await admin.createNewPost();
		await collaborationUtils.waitForEntityReady( page, {
			requireCollaboration: false,
			timeout: 30_000,
		} );
		await collaborationUtils.waitForCollaborationReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );

		// The author has created the auto-draft and shared/navigated away from
		// its edit URL before adding content. The collaborator performs the
		// first user-authored edit and receives the first autosave success.
		await admin.visitAdminPage( 'index.php' );

		const { page: collaboratorPage, editor: collaboratorEditor } =
			await collaborationUtils.joinUser( postId, SECOND_USER );

		await collaboratorEditor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( title );
		await collaboratorEditor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await collaboratorPage.keyboard.type( marker );

		const autosaveRequest = collaboratorPage.waitForResponse(
			( response ) => isAutosaveResponse( response, postId ),
			{ timeout: 30_000 }
		);
		await useFastAutosaveInterval( collaboratorPage );

		const autosaveResponse = await autosaveRequest;
		expect( autosaveResponse.status() ).toBe( 200 );
		await collaboratorPage.waitForFunction(
			() =>
				! ( window as any ).wp.data
					.select( 'core/editor' )
					.isAutosavingPost(),
			undefined,
			{ timeout: 30_000 }
		);

		const post = await requestUtils.rest< RestPost >( {
			path: `/wp/v2/posts/${ postId }`,
			params: {
				context: 'edit',
			},
		} );
		const drafts = await requestUtils.rest< RestPost[] >( {
			path: '/wp/v2/posts',
			params: {
				context: 'edit',
				status: 'draft',
				search: title,
			},
		} );

		expect( post.status ).toBe( 'draft' );
		expect( rawField( post.title ) ).toContain( title );
		expect( rawField( post.content ) ).toContain( marker );
		expect( drafts.map( ( draft ) => draft.id ) ).toContain( postId );
	} );
} );
