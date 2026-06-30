/**
 * External dependencies
 */
import type { Page, Response } from '@playwright/test';

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

function rawField( field: RestPost[ 'content' ] ): string {
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

test.describe( 'Collaboration - stale autosave notice', () => {
	// Reproduces the spurious "There is an autosave of this post that is more
	// recent than the version below" notice that appears in real-time
	// collaboration.
	//
	// Root cause is two factors combining:
	//
	// 1. With RTC enabled, the author's draft autosave is NOT applied to the
	//    parent post (see Gutenberg_REST_Autosaves_Controller::create_item).
	//    It is stored as a per-user autosave revision instead, so the revision
	//    is always more recent than the parent post, even for a no-op autosave
	//    whose content is identical to the post.
	//
	// 2. WordPress core decides whether to show the notice in
	//    wp-admin/edit-form-blocks.php by comparing ONLY timestamps
	//    (`$autosave->post_modified_gmt > $post->post_modified_gmt`), never the
	//    revisioned fields. So a content-identical autosave still triggers the
	//    notice, and "View the autosave" opens a revision screen with no Content
	//    diff (just the title), because the content matches the saved post.
	test( 'does not show an unnecessary notice in RTC after a no-op autosave', async ( {
		collaborationUtils,
		editor,
		page,
		requestUtils,
	} ) => {
		test.setTimeout( 120_000 );

		const marker = 'rtc-stale-autosave-content';

		// Seed the post with the editor's canonical block serialization so the
		// autosave that follows is a true no-op (byte-identical content), which
		// is what makes the revision's Content diff blank.
		const content = `<!-- wp:paragraph -->\n<p>${ marker }</p>\n<!-- /wp:paragraph -->`;

		// Create a draft authored by the current user (admin). `wp_get_post_autosave`
		// resolves the autosave for the current user, so the author must own the
		// post. Backdate it so its `post_modified` is deterministically older than
		// the autosave we trigger below (autosave timestamps have one-second
		// resolution), without resorting to a wall-clock wait.
		const post = await requestUtils.createPost( {
			title: 'RTC stale autosave notice',
			status: 'draft',
			content,
			date_gmt: new Date( Date.now() - 60 * 60 * 1000 ).toISOString(),
		} );

		await collaborationUtils.openPost( post.id );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		const postId = await getCurrentPostId( page );
		expect( postId ).toBe( post.id );

		// Trigger a no-op autosave (nothing has been edited since load).
		const autosaveRequest = page.waitForResponse(
			( response ) => isAutosaveResponse( response, postId ),
			{ timeout: 30_000 }
		);
		await page.evaluate( () =>
			( window as any ).wp.data.dispatch( 'core/editor' ).autosave()
		);
		const autosaveResponse = await autosaveRequest;
		expect( autosaveResponse.status() ).toBe( 200 );
		await page.waitForFunction(
			() =>
				! ( window as any ).wp.data
					.select( 'core/editor' )
					.isAutosavingPost(),
			undefined,
			{ timeout: 30_000 }
		);

		// The autosave was a no-op (identical content), so the server must not
		// persist a redundant autosave revision. A lingering revision is exactly
		// what would later out-date the post and surface the spurious notice.
		const savedPost = await requestUtils.rest< RestPost >( {
			path: `/wp/v2/posts/${ postId }`,
			params: { context: 'edit' },
		} );
		const autosaves = await requestUtils.rest< RestPost[] >( {
			path: `/wp/v2/posts/${ postId }/autosaves`,
			params: { context: 'edit' },
		} );
		expect( rawField( savedPost.content ).trim() ).toBe( content.trim() );
		expect( autosaves ).toHaveLength( 0 );

		// Reload. The autosave was a no-op, so no autosave revision exists to
		// out-date the post, and the editor must not warn about "a more recent
		// autosave". Without the controller fix, WordPress would have stored a
		// redundant revision and surfaced the spurious notice here.
		await page.reload();
		await collaborationUtils.waitForCollaborationReady( page, {
			timeout: 30_000,
		} );
		await collaborationUtils.waitForEntityReady( page, {
			timeout: 30_000,
		} );

		// Wait until the editor has fully mounted (our paragraph is rendered).
		// The notice, if any, is created in the editor provider's mount effect,
		// so by this point it would already be present. This prevents a false
		// pass from asserting absence before the editor has had a chance to show it.
		await expect( editor.canvas.getByText( marker ) ).toBeVisible( {
			timeout: 30_000,
		} );

		await expect(
			page.locator( '.components-notice__content' ).filter( {
				hasText:
					'There is an autosave of this post that is more recent than the version below.',
			} )
		).toHaveCount( 0 );
	} );
} );
