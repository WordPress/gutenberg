const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// The URL binding the link UI adds to a link picked from the site's content.
const URL_BINDING =
	'"metadata":{"bindings":{"url":{"source":"core/post-data","args":{"field":"link"}}}}';

function pageAttributes( page, label = page.title.raw ) {
	return `"label":"${ label }","type":"page","id":${ page.id },"url":"${ page.link }","kind":"post-type"`;
}

function boundPageLink( page ) {
	return `<!-- wp:navigation-link {${ pageAttributes( page ) },${ URL_BINDING }} /-->`;
}

test.describe( 'Navigation block: links to deleted content', () => {
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

	test( 'permanently deleting a page removes its bound link but keeps a submenu for it', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		const deleted = await requestUtils.createPage( {
			title: 'Deleted page',
			status: 'publish',
		} );
		const parent = await requestUtils.createPage( {
			title: 'Parent page',
			status: 'publish',
		} );
		const child = await requestUtils.createPage( {
			title: 'Child page',
			status: 'publish',
		} );
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Main menu',
			content:
				'<!-- wp:navigation-link {"label":"Home","url":"https://example.com","kind":"custom"} /-->' +
				boundPageLink( deleted ) +
				// A link to the same page with a typed-in URL and no binding.
				`<!-- wp:navigation-link {${ pageAttributes( deleted, 'Unbound link' ) }} /-->` +
				`<!-- wp:navigation-submenu {${ pageAttributes( parent ) },${ URL_BINDING }} -->` +
				boundPageLink( child ) +
				'<!-- /wp:navigation-submenu -->',
		} );

		await admin.createNewPost( { postType: 'page', title: 'Host page' } );
		await editor.insertBlock( {
			name: 'core/navigation',
			attributes: { ref: menu.id },
		} );

		const navigationBlock = editor.canvas.getByRole( 'document', {
			name: 'Block: Navigation',
		} );
		const pageLinks = navigationBlock.getByRole( 'document', {
			name: 'Block: Page Link',
		} );
		// The child link sits inside the submenu, which only shows its items
		// while it is being edited.
		await expect( pageLinks ).toHaveCount( 2 );
		await expect( pageLinks.first() ).toContainText( 'Deleted page' );
		await expect( pageLinks.last() ).toContainText( 'Unbound link' );

		await editor.publishPost();
		const hostPageUrl = await page.evaluate( () =>
			window.wp.data.select( 'core/editor' ).getPermalink()
		);

		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/pages/${ deleted.id }`,
			params: { force: true },
		} );
		await requestUtils.rest( {
			method: 'DELETE',
			path: `/wp/v2/pages/${ parent.id }`,
			params: { force: true },
		} );

		const updatedMenu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menu.id }`,
			params: { context: 'edit' },
		} );
		expect( updatedMenu.content.raw ).not.toContain(
			'"label":"Deleted page"'
		);
		expect( updatedMenu.content.raw ).toContain( '"label":"Unbound link"' );
		expect( updatedMenu.content.raw ).not.toContain(
			`"id":${ parent.id }`
		);
		expect( updatedMenu.content.raw ).toContain( `"id":${ child.id }` );

		await page.reload();
		await expect( navigationBlock ).toContainText( 'Home' );
		// Only the unbound link is left, flagged as invalid by the editor.
		await expect( pageLinks ).toHaveCount( 1 );
		await expect( pageLinks ).toContainText( 'Unbound link' );

		const menuBlocks = await editor.getBlocks( {
			clientId: await navigationBlock.getAttribute( 'data-block' ),
		} );
		expect( menuBlocks ).toMatchObject( [
			{
				name: 'core/navigation-link',
				attributes: { label: 'Home' },
			},
			{
				name: 'core/navigation-link',
				attributes: { label: 'Unbound link', id: deleted.id },
			},
			{
				name: 'core/navigation-submenu',
				attributes: { label: 'Parent page' },
				innerBlocks: [
					{
						name: 'core/navigation-link',
						attributes: { label: 'Child page', id: child.id },
					},
				],
			},
		] );
		expect( menuBlocks[ 2 ].attributes ).not.toHaveProperty( 'id' );
		expect( menuBlocks[ 2 ].attributes ).not.toHaveProperty( 'url' );

		await page.goto( hostPageUrl );
		// The admin bar has a navigation landmark too; target the block.
		const navigation = page.locator( '.wp-block-navigation' ).first();
		await expect( navigation ).toContainText( 'Home' );
		await expect( navigation ).toContainText( 'Parent page' );
		await expect( navigation ).toContainText( 'Child page' );
		// The unbound link points at a missing page, so it does not render.
		await expect( navigation ).not.toContainText( 'Deleted page' );
		await expect( navigation ).not.toContainText( 'Unbound link' );
	} );
} );
