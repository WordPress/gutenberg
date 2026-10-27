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
const HOME_LINK =
	'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->';

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

async function publishFromPanel( page, panel ) {
	await panel.getByRole( 'button', { name: 'Publish', exact: true } ).click();
	await page
		.getByRole( 'button', { name: 'Dismiss this notice' } )
		.filter( { hasText: 'published' } )
		.waitFor();
}

async function getMenuContent( requestUtils, menuId ) {
	const menu = await requestUtils.rest( {
		path: `/wp/v2/navigation/${ menuId }`,
		params: { context: 'edit' },
	} );
	return menu.content.raw;
}

test.describe( 'Pre-publish panel: choosing the menus a page is added to', () => {
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

	test( 'checks the menus the page is added to by default and publishes to them', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const autoMenu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: HOME_LINK,
			meta: { [ META_KEY ]: true },
		} );
		const otherMenu = await requestUtils.createNavigationMenu( {
			title: 'Other menu',
			content: HOME_LINK,
		} );
		const draft = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: { title: 'About', status: 'draft' },
		} );
		const linkedMenu = await requestUtils.createNavigationMenu( {
			title: 'Linked menu',
			content: `<!-- wp:navigation-link {"label":"About","type":"page","kind":"post-type","id":${ draft.id },"url":"${ draft.link }"} /-->`,
		} );

		await admin.editPost( draft.id );
		const panel = await openPrePublishPanel( page );
		await panel.getByRole( 'button', { name: 'Menus: 2 menus' } ).click();

		await expect(
			panel.getByRole( 'checkbox', { name: 'Main menu' } )
		).toBeChecked();
		await expect(
			panel.getByRole( 'checkbox', { name: 'Other menu' } )
		).not.toBeChecked();
		const linked = panel.getByRole( 'checkbox', { name: 'Linked menu' } );
		await expect( linked ).toBeChecked();
		await expect( linked ).toBeDisabled();
		// Each menu links to its editor, in a new tab.
		const link = panel.getByRole( 'link', { name: /^View Main menu/ } );
		await expect( link ).toHaveAttribute( 'target', '_blank' );
		const href = decodeURIComponent( await link.getAttribute( 'href' ) );
		expect( href ).toContain( menuEditorPath( autoMenu.id ) );

		await publishFromPanel( page, panel );

		expect( await getMenuContent( requestUtils, autoMenu.id ) ).toContain(
			`"id":${ draft.id }`
		);
		expect(
			await getMenuContent( requestUtils, otherMenu.id )
		).not.toContain( `"id":${ draft.id }` );
		expect( await getMenuContent( requestUtils, linkedMenu.id ) ).toBe(
			`<!-- wp:navigation-link {"label":"About","type":"page","kind":"post-type","id":${ draft.id },"url":"${ draft.link }"} /-->`
		);
	} );

	test( 'adds the page to a menu checked by the author', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const autoMenu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: HOME_LINK,
			meta: { [ META_KEY ]: true },
		} );
		const otherMenu = await requestUtils.createNavigationMenu( {
			title: 'Other menu',
			content: HOME_LINK,
		} );
		const draft = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: { title: 'About', status: 'draft' },
		} );

		await admin.editPost( draft.id );
		const panel = await openPrePublishPanel( page );
		await panel.getByRole( 'button', { name: 'Menus: Main menu' } ).click();
		await panel.getByRole( 'checkbox', { name: 'Other menu' } ).check();
		await expect(
			panel.getByRole( 'button', { name: 'Menus: 2 menus' } )
		).toBeVisible();

		await publishFromPanel( page, panel );

		expect( await getMenuContent( requestUtils, autoMenu.id ) ).toContain(
			`"id":${ draft.id }`
		);
		expect( await getMenuContent( requestUtils, otherMenu.id ) ).toContain(
			`"id":${ draft.id }`
		);
	} );

	test( 'skips a menu the author unchecks and keeps its setting on', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const autoMenu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content: HOME_LINK,
			meta: { [ META_KEY ]: true },
		} );
		const draft = await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/pages',
			data: { title: 'Legal', status: 'draft' },
		} );

		await admin.editPost( draft.id );
		const panel = await openPrePublishPanel( page );
		await panel.getByRole( 'button', { name: 'Menus: Main menu' } ).click();
		await panel.getByRole( 'checkbox', { name: 'Main menu' } ).uncheck();
		await expect(
			panel.getByRole( 'button', { name: 'Menus: None' } )
		).toBeVisible();

		await publishFromPanel( page, panel );

		expect(
			await getMenuContent( requestUtils, autoMenu.id )
		).not.toContain( `"id":${ draft.id }` );

		// The setting is untouched: the next page is still added.
		const next = await requestUtils.createPage( {
			title: 'Next',
			status: 'publish',
		} );
		expect( await getMenuContent( requestUtils, autoMenu.id ) ).toContain(
			`"id":${ next.id }`
		);
	} );

	test( 'offers every menu unchecked when none adds the page by default', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		await requestUtils.createNavigationMenu( {
			title: 'Other menu',
			content: HOME_LINK,
		} );

		await admin.createNewPost( { postType: 'page', title: 'About' } );
		const panel = await openPrePublishPanel( page );

		await panel.getByRole( 'button', { name: 'Menus: None' } ).click();
		await expect(
			panel.getByRole( 'checkbox', { name: 'Other menu' } )
		).not.toBeChecked();
	} );

	test( 'is not shown when the site has no menu', async ( {
		admin,
		page,
	} ) => {
		await admin.createNewPost( { postType: 'page', title: 'About' } );
		const menusLoaded = page.waitForResponse( ( response ) =>
			response.url().includes( '/wp/v2/navigation' )
		);
		const panel = await openPrePublishPanel( page );
		await menusLoaded;

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
			content: HOME_LINK,
			meta: { [ META_KEY ]: true },
		} );

		await admin.createNewPost( { title: 'Hello' } );
		const panel = await openPrePublishPanel( page );

		await expect(
			panel.getByRole( 'button', { name: /^Menus:/ } )
		).toBeHidden();
	} );

	test( 'says which link a child page goes under and leaves a menu without its parent unchecked', async ( {
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
		// Has no link to the parent, so the setting would not add the child.
		await requestUtils.createNavigationMenu( {
			title: 'Footer menu',
			content: HOME_LINK,
			meta: { [ META_KEY ]: true },
		} );
		// Already links the child.
		await requestUtils.createNavigationMenu( {
			title: 'Team menu',
			content: `<!-- wp:navigation-submenu {"label":"About","type":"page","kind":"post-type","id":${ parent.id },"url":"${ parent.link }"} --><!-- wp:navigation-link {"label":"Team","type":"page","kind":"post-type","id":${ child.id },"url":"${ child.link }"} /--><!-- /wp:navigation-submenu -->`,
		} );

		await admin.editPost( child.id );
		const panel = await openPrePublishPanel( page );
		await panel.getByRole( 'button', { name: 'Menus: 2 menus' } ).click();

		const main = panel.getByRole( 'checkbox', { name: 'Main menu' } );
		await expect( main ).toBeChecked();
		await expect( main ).toHaveAccessibleDescription( 'Under About' );
		await expect(
			panel.getByRole( 'checkbox', { name: 'Footer menu' } )
		).not.toBeChecked();
		const team = panel.getByRole( 'checkbox', { name: 'Team menu' } );
		await expect( team ).toBeChecked();
		await expect( team ).toBeDisabled();
	} );
} );
