/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe(
	'As a user I want the navigation block to fallback to the best possible default',
	() => {
		test.beforeAll( async ( { requestUtils } ) => {
			//TT3 is preferable to emptytheme because it already has the navigation block on its templates.
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { requestUtils } ) => {
			await Promise.all( [ requestUtils.deleteAllMenus() ] );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await Promise.all( [
				requestUtils.deleteAllMenus(),
				requestUtils.activateTheme( 'twentytwentyone' ),
			] );
		} );

		test.afterEach( async ( { requestUtils } ) => {
			await requestUtils.deleteAllPosts();
		} );

		test( 'default to a list of pages if there are no menus', async ( {
			admin,
			editor,
		} ) => {
			await admin.createNewPost();
			await editor.insertBlock( { name: 'core/navigation' } );

			const pageListBlock = editor.canvas.getByRole( 'document', {
				name: 'Block: Page List',
			} );

			await expect( pageListBlock ).toBeVisible( {
				// Wait for the Nav and Page List block API requests to resolve.
				// Note: avoid waiting on network requests as these are not perceivable
				// to the user.
				// See: https://github.com/WordPress/gutenberg/pull/45070#issuecomment-1373712007.
				timeout: 10000,
			} );

			// Check the markup of the block is correct.
			await editor.publishPost();
			const content = await editor.getEditedPostContent();
			expect( content ).toBe(
				`<!-- wp:navigation -->
<!-- wp:page-list /-->
<!-- /wp:navigation -->`
			);
		} );

		test( 'default to my only existing menu', async ( {
			admin,
			editor,
			page,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			const createdMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"WordPress","type":"custom","url":"http://www.wordpress.org/","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="WordPress"`
				)
			).toBeVisible();

			// Check the markup of the block is correct.
			await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: createdMenu.id },
				},
			] );
			await page.locator( 'role=button[name="Close panel"i]' ).click();

			// Check the block in the frontend.
			await page.goto( '/' );
			await expect(
				page.locator(
					`role=navigation >> role=link[name="WordPress"i]`
				)
			).toBeVisible();
		} );

		test( 'default to the only existing classic menu if there are no block menus', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			// Create a classic menu.
			await requestUtils.createClassicMenu( 'Test Classic 1' );
			await admin.createNewPost();

			await editor.insertBlock( { name: 'core/navigation' } );
			// We need to check the canvas after inserting the navigation block to be able to target the block.
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
				},
			] );

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="Custom link"`
				)
			).toBeVisible();

			// Check the block in the frontend.
			await page.goto( '/' );

			await expect(
				page.locator(
					`role=navigation >> role=link[name="Custom link"i]`
				)
			).toBeVisible();
		} );

		test( 'default to my most recently created menu', async ( {
			admin,
			page,
			editor,
			requestUtils,
		} ) => {
			await admin.createNewPost();
			await requestUtils.createNavigationMenu( {
				title: 'Test Menu 1',
				content:
					'<!-- wp:navigation-link {"label":"Menu 1 Link","type":"custom","url":"http://localhost:8889/#menu-1-link","kind":"custom","isTopLevelLink":true} /-->',
			} );

			//FIXME this is needed because if the two menus are created at the same time, the API will return them in the wrong order.
			//https://core.trac.wordpress.org/ticket/57914
			await editor.page.waitForTimeout( 1000 );

			const latestMenu = await requestUtils.createNavigationMenu( {
				title: 'Test Menu 2',
				content:
					'<!-- wp:navigation-link {"label":"Menu 2 Link","type":"custom","url":"http://localhost:8889/#menu-2-link","kind":"custom","isTopLevelLink":true} /-->',
			} );

			await editor.insertBlock( { name: 'core/navigation' } );

			// Check the markup of the block is correct.
			await editor.publishPost();
			await expect.poll( editor.getBlocks ).toMatchObject( [
				{
					name: 'core/navigation',
					attributes: { ref: latestMenu.id },
				},
			] );
			await page.locator( 'role=button[name="Close panel"i]' ).click();

			// Check the block in the canvas.
			await expect(
				editor.canvas.locator(
					`role=textbox[name="Navigation link text"i] >> text="Menu 2 Link"`
				)
			).toBeVisible();

			// Check the block in the frontend.
			await page.goto( '/' );
			await expect(
				page.locator(
					`role=navigation >> role=link[name="Menu 2 Link"i]`
				)
			).toBeVisible();
		} );
	}
);

test.describe( 'Navigation block', () => {
	test.describe(
		'As a user I want to see a warning if the menu referenced by a navigation block is not available',
		() => {
			test.beforeEach( async ( { admin } ) => {
				await admin.createNewPost();
			} );

			test( 'warning message shows when given an unknown ref', async ( {
				editor,
			} ) => {
				await editor.insertBlock( {
					name: 'core/navigation',
					attributes: {
						ref: 1,
					},
				} );

				// Check the markup of the block is correct.
				await editor.publishPost();

				await expect.poll( editor.getBlocks ).toMatchObject( [
					{
						name: 'core/navigation',
						attributes: { ref: 1 },
					},
				] );

				// Find the warning message
				const warningMessage = editor.canvas
					.getByRole( 'document', { name: 'Block: Navigation' } )
					.getByText(
						'Navigation menu has been deleted or is unavailable.'
					);
				await expect( warningMessage ).toBeVisible();
			} );
		}
	);
} );
