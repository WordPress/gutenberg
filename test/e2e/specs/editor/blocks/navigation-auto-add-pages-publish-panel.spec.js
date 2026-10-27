const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const META_KEY = 'wp_navigation_auto_add_pages';

// The menu links point at whichever site editor the site uses: the
// extensible site editor when its experiment is on, else the current one.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

function menuEditorPath( menuId ) {
	return isSiteEditorV2
		? `admin.php?page=site-editor-v2&p=/navigation/edit/${ menuId }`
		: `site-editor.php?p=/wp_navigation/${ menuId }`;
}

async function openPrePublishPanel( page ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Publish', exact: true } )
		.click();
	const panel = page.getByRole( 'region', { name: 'Editor publish' } );
	await expect(
		panel.getByRole( 'button', { name: 'Publish', exact: true } )
	).toBeVisible();
	return panel;
}

test.describe( 'Pre-publish panel: menus a page is added to', () => {
	test.beforeEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMenus(),
		] );
	} );

	test( 'lists the menus with the setting on, each linking to its editor', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const mainMenu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			meta: { [ META_KEY ]: true },
		} );
		await requestUtils.createNavigationMenu( {
			title: 'Other menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
		} );

		await admin.createNewPost( { postType: 'page', title: 'About' } );
		const panel = await openPrePublishPanel( page );

		await panel.getByRole( 'button', { name: 'Menus: Main menu' } ).click();
		const link = panel.getByRole( 'link', { name: 'Main menu' } );
		await expect( link ).toBeVisible();
		const href = decodeURIComponent( await link.getAttribute( 'href' ) );
		expect( href ).toContain( menuEditorPath( mainMenu.id ) );
		await expect( panel.getByText( 'Other menu' ) ).toBeHidden();
	} );

	test( 'is not shown when no menu has the setting on', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: 'Other menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
		} );

		await admin.createNewPost( { postType: 'page', title: 'About' } );
		const panel = await openPrePublishPanel( page );

		await expect(
			panel.getByRole( 'button', { name: /^Menus:/ } )
		).toBeHidden();
	} );

	test( 'is not shown for a post, which is never added to a menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			meta: { [ META_KEY ]: true },
		} );

		await admin.createNewPost( { title: 'Hello' } );
		const panel = await openPrePublishPanel( page );

		await expect(
			panel.getByRole( 'button', { name: /^Menus:/ } )
		).toBeHidden();
	} );

	test( 'says which link a child page goes under and skips menus that would not add it', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const parent = await requestUtils.createPage( {
			title: 'About',
			status: 'publish',
		} );
		const child = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: {
				title: 'Team',
				status: 'draft',
				parent: parent.id,
			},
		} );
		const parentLink = `<!-- wp:navigation-link {"label":"About","type":"page","kind":"post-type","id":${ parent.id },"url":"${ parent.link }"} /-->`;

		// Links the parent, so the child is nested under that link.
		await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: parentLink,
			meta: { [ META_KEY ]: true },
		} );
		// Has no link to the parent, so the child is not added.
		await requestUtils.createNavigationMenu( {
			title: 'Footer menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->',
			meta: { [ META_KEY ]: true },
		} );
		// Already links the child, so it is not added again.
		await requestUtils.createNavigationMenu( {
			title: 'Team menu',
			content: `<!-- wp:navigation-submenu {"label":"About","type":"page","kind":"post-type","id":${ parent.id },"url":"${ parent.link }"} --><!-- wp:navigation-link {"label":"Team","type":"page","kind":"post-type","id":${ child.id },"url":"${ child.link }"} /--><!-- /wp:navigation-submenu -->`,
			meta: { [ META_KEY ]: true },
		} );

		await admin.editPost( child.id );
		const panel = await openPrePublishPanel( page );

		await panel.getByRole( 'button', { name: 'Menus: Main menu' } ).click();
		const items = panel.getByRole( 'listitem' );
		await expect( items ).toHaveCount( 1 );
		await expect( items.first() ).toHaveText( 'Main menu, under About' );
		await expect(
			items.first().getByRole( 'link', { name: 'Main menu' } )
		).toBeVisible();
		await expect( panel.getByText( 'Footer menu' ) ).toBeHidden();
		await expect( panel.getByText( 'Team menu' ) ).toBeHidden();
	} );
} );
