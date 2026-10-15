const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Whether the run targets the extensible site editor (v2), which lives at
// `admin.php?page=site-editor-v2` and routes via the `p` query param.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;
const rootTitle = isSiteEditorV2 ? 'Home' : 'Design';

test.describe( 'Site editor navigation announcements', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'announces the current screen only when the screen changes', async ( {
		admin,
		page,
	} ) => {
		// Record every assertive message from the first load on. speak()
		// clears the region before each message, so a repeat is recorded too.
		await page.addInitScript( () => {
			window.__assertiveMessages = [];
			let previous = '';
			new window.MutationObserver( () => {
				const text =
					document.getElementById( 'a11y-speak-assertive' )
						?.textContent ?? '';
				if ( text !== previous ) {
					previous = text;
					if ( text.trim() ) {
						window.__assertiveMessages.push( text.trim() );
					}
				}
			} ).observe( document, {
				subtree: true,
				childList: true,
				characterData: true,
			} );
		} );
		const messages = () =>
			page.evaluate( () => window.__assertiveMessages );

		await admin.visitSiteEditor();
		await expect( page ).toHaveTitle( new RegExp( `^${ rootTitle } ‹` ) );

		await page
			.getByRole( isSiteEditorV2 ? 'link' : 'button', {
				name: 'Pages',
				exact: true,
			} )
			.click();
		await expect( page ).toHaveTitle( /^Pages ‹/ );
		await expect.poll( messages ).toEqual( [ 'Pages' ] );

		// A search only changes the query string.
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Sample' );
		// v2 encodes its route, query included, in the `p` param.
		await expect( page ).toHaveURL( /search(=|%3D)Sample/ );

		// Back to the root screen of the sidebar.
		await (
			isSiteEditorV2
				? page.getByRole( 'link', { name: 'Home', exact: true } )
				: page.getByRole( 'button', { name: 'Back' } )
		)
			.first()
			.click();

		// Nothing was announced on first load or for the search.
		await expect( page ).toHaveTitle( new RegExp( `^${ rootTitle } ‹` ) );
		await expect.poll( messages ).toEqual( [ 'Pages', rootTitle ] );
	} );
} );
