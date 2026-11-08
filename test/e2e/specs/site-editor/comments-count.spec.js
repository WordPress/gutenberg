const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Comments Count in the page preview', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'page',
			title: 'Page',
			content: '<!-- wp:post-title /--><!-- wp:post-comments-count /-->',
		} );
	} );

	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments();
		await requestUtils.deleteAllPages();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments();
		await requestUtils.deleteAllPages();
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.resetPreferences();
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	// The extensible site editor's Pages list has no preview.
	test( 'keeps the count of the previewed page when an earlier page answers late @site-editor-v1-only', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const pageA = await requestUtils.createPage( {
			title: 'Page A',
			status: 'publish',
			comment_status: 'open',
		} );
		const pageB = await requestUtils.createPage( {
			title: 'Page B',
			status: 'publish',
			comment_status: 'open',
		} );
		await requestUtils.createComment( { post: pageA.id, content: 'A1' } );
		await requestUtils.createComment( { post: pageB.id, content: 'B1' } );
		await requestUtils.createComment( { post: pageB.id, content: 'B2' } );

		// Show pages inside their template, where the Comments Count is.
		await admin.visitSiteEditor( { postType: 'page' } );
		await editor.setPreferences( 'core', {
			renderingModes: { emptytheme: { page: 'template-locked' } },
		} );

		// Hold the request for Page A's comments until Page B is shown.
		const isPageACountRequest = ( request ) => {
			const url = decodeURIComponent( request.url() );
			return (
				url.includes( '/wp/v2/comments' ) &&
				new RegExp( `[?&]post=${ pageA.id }(&|$)` ).test( url ) &&
				! url.includes( 'type=note' )
			);
		};
		let releasePageA;
		const pageAReleased = new Promise( ( resolve ) => {
			releasePageA = resolve;
		} );
		await page.route( '**/wp/v2/comments**', async ( route ) => {
			if ( isPageACountRequest( route.request() ) ) {
				await pageAReleased;
			}
			await route.continue();
		} );

		await admin.visitSiteEditor( { postType: 'page', postId: pageA.id } );
		const commentsCount = editor.canvas.getByRole( 'document', {
			name: 'Block: Comments Count',
		} );
		await expect( commentsCount ).toHaveText( '0' );

		await page
			.getByRole( 'button', { name: 'Page B', exact: true } )
			.focus();
		await page.keyboard.press( 'Enter' );
		await expect( commentsCount ).toHaveText( '2' );

		const pageAResponse = page.waitForResponse( ( response ) =>
			isPageACountRequest( response.request() )
		);
		releasePageA();
		await pageAResponse;
		// Let the page handle the response before checking it changed nothing.
		await page.evaluate(
			() =>
				new Promise( ( resolve ) =>
					window.requestAnimationFrame( () =>
						window.requestAnimationFrame( resolve )
					)
				)
		);
		await expect( commentsCount ).toHaveText( '2' );
	} );
} );
