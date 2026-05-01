/**
 * Internal dependencies
 */
import { test, expect } from './fixtures';

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

async function getCurrentPostId( page: {
	evaluate: < T >( callback: () => T ) => Promise< T >;
} ): Promise< number > {
	return page.evaluate( () =>
		( window as any ).wp.data.select( 'core/editor' ).getCurrentPostId()
	);
}

test.describe( 'Collaboration - auto-draft autosave retention', () => {
	test( 'keeps a new post discoverable after the editor automatically autosaves it', async ( {
		admin,
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const title = 'RTC automatic auto-draft autosave title';
		const marker = 'rtc-automatic-auto-draft-autosave-content';

		await admin.visitAdminPage( 'post-new.php' );
		await editor.setPreferences( 'core/edit-post', {
			welcomeGuide: false,
			fullscreenMode: false,
		} );
		await collaborationUtils.waitForEntityReady( page, {
			requireCollaboration: false,
			timeout: 30_000,
		} );
		await collaborationUtils.waitForCollaborationReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );
		const autosaveRequest = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				response
					.url()
					.includes( `/wp-json/wp/v2/posts/${ postId }/autosaves` ),
			{ timeout: 90_000 }
		);

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( title );
		await editor.canvas
			.getByRole( 'button', { name: 'Add default block' } )
			.click();
		await page.keyboard.type( marker );

		await autosaveRequest;
		await page.waitForFunction(
			() =>
				! ( window as any ).wp.data
					.select( 'core/editor' )
					.isAutosavingPost(),
			undefined,
			{ timeout: 30_000 }
		);

		const post = await requestUtils.rest< RestPost >( {
			path: `/wp/v2/posts/${ postId }?context=edit`,
		} );
		const drafts = await requestUtils.rest< RestPost[] >( {
			path: `/wp/v2/posts?context=edit&status=draft&search=${ encodeURIComponent(
				title
			) }`,
		} );

		expect( post.status ).toBe( 'draft' );
		expect( rawField( post.title ) ).toContain( title );
		expect( rawField( post.content ) ).toContain( marker );
		expect( drafts.map( ( draft ) => draft.id ) ).toContain( postId );
	} );
} );
