import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

/**
 * Reads the REST route out of a request URL.
 *
 * REST requests reach the server either as `/wp-json/<route>` or as
 * `index.php?rest_route=<route>`, depending on the permalink structure.
 *
 * @param url Request URL.
 * @return The REST route.
 */
function getRestRoute( url: string ): string {
	const parsed = new URL( url );

	return parsed.searchParams.get( 'rest_route' ) ?? parsed.pathname;
}

test.describe( 'Autosave loading', () => {
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllPosts();
	} );

	test( 'enables autosaving once the request resolves', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// Leaves the date to the server, as a draft created in the editor would.
		const post = await requestUtils.createPost( {
			title: 'Autosave loading',
			content:
				'<!-- wp:paragraph -->\n<p>Autosave loading</p>\n<!-- /wp:paragraph -->',
			status: 'draft',
		} as Parameters< RequestUtils[ 'createPost' ] >[ 0 ] );

		await admin.editPost( post.id );
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Paragraph' } )
			.click();
		await page.keyboard.press( 'End' );
		await page.keyboard.type( ' edited' );

		// False until the current user's `getAutosave` request has resolved.
		// If the editor waited on a resolution that never finishes, autosaving
		// would stay off with no visible error.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.isEditedPostAutosaveable()
				)
			)
			.toBe( true );

		const autosaved = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				/\/autosaves\/?$/.test( getRestRoute( response.url() ) )
		);
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).autosave()
		);
		expect( ( await autosaved ).ok() ).toBe( true );
	} );
} );
