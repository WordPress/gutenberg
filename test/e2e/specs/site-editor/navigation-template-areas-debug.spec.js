/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

/**
 * Tests for NavigationMenuTemplateAreas preview feature.
 * Verifies that the preview area shows template PART previews (not full
 * page templates) for template parts that use the navigation menu.
 */
test.describe( 'NavigationMenuTemplateAreas', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await Promise.all( [
			requestUtils.deleteAllMenus(),
			requestUtils.deleteAllTemplates( 'wp_template_part' ),
		] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'navigation block with explicit ref: content.raw contains "ref":ID', async ( {
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Explicit Ref Menu',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'header-explicit-ref',
			content: `<!-- wp:navigation {"ref":${ menu.id }} /-->`,
		} );

		const parts = await requestUtils.rest( {
			path: '/wp/v2/template-parts',
		} );
		const part = parts.find( ( p ) => p.slug === 'header-explicit-ref' );

		// eslint-disable-next-line no-console
		console.log( 'explicit ref content.raw:', part?.content?.raw );

		// Proves: explicit ref IS searchable with "ref":ID.
		expect( part?.content?.raw ).toContain( `"ref":${ menu.id }` );
	} );

	test( 'navigation block without ref: content.raw does NOT contain "ref"', async ( {
		requestUtils,
	} ) => {
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'header-no-ref',
			content: `<!-- wp:navigation /-->`,
		} );

		const parts = await requestUtils.rest( {
			path: '/wp/v2/template-parts',
		} );
		const part = parts.find( ( p ) => p.slug === 'header-no-ref' );

		// eslint-disable-next-line no-console
		console.log( 'no ref content.raw:', part?.content?.raw );

		// Proves: no-ref nav block is NOT detectable by "ref":ID string search.
		expect( part?.content?.raw ).toContain( 'wp:navigation' );
		expect( part?.content?.raw ).not.toContain( '"ref"' );
	} );

	test( 'preview area shows template part with deeply nested navigation block', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Deeply Nested Menu',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );

		// Mirrors the real TwentyTwentyFive header structure with the nav block
		// nested four levels deep inside wp:group blocks.
		const content = `<!-- wp:group {"metadata":{"patternName":"twentytwentyfive/header","name":"Header"},"align":"full","layout":{"type":"default"}} -->
<div class="wp-block-group alignfull"><!-- wp:group {"layout":{"type":"constrained"}} -->
<div class="wp-block-group"><!-- wp:group {"align":"wide","layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"space-between"}} -->
<div class="wp-block-group alignwide"><!-- wp:site-title {"level":0} /-->

<!-- wp:group {"layout":{"type":"flex","flexWrap":"nowrap","justifyContent":"right"}} -->
<div class="wp-block-group"><!-- wp:navigation {"ref":${ menu.id },"overlayBackgroundColor":"base","overlayTextColor":"contrast","layout":{"type":"flex","justifyContent":"right","flexWrap":"wrap"}} /--></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group --></div>
<!-- /wp:group -->`;

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'deeply-nested-header',
			title: 'Deeply Nested Header',
			content,
		} );

		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menu.id }&postType=wp_navigation`
		);

		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		await expect( page.getByText( 'Deeply Nested Header' ) ).toBeVisible();
	} );

	test( 'preview area shows template part with explicit nav menu ref', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Preview Test Menu',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'preview-test-header',
			title: 'Preview Test Header',
			content: `<!-- wp:navigation {"ref":${ menu.id }} /-->`,
		} );

		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menu.id }&postType=wp_navigation`
		);

		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		// The preview area should show the template PART title.
		await expect( page.getByText( 'Preview Test Header' ) ).toBeVisible();
	} );

	test( 'preview area shows unbound nav block (no inner items) when it is the fallback menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		// Single menu = it is the fallback. Unbound block with no inner
		// items will resolve to it at render time.
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Only Menu',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'unbound-single-header',
			title: 'Unbound Single Header',
			content: `<!-- wp:navigation /-->`,
		} );

		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menu.id }&postType=wp_navigation`
		);

		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		// This menu is the fallback → unbound empty nav block matches.
		await expect( page.getByText( 'Unbound Single Header' ) ).toBeVisible();
	} );

	test( 'preview area does NOT show unbound nav block with inline items even for the fallback menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		// A nav block with its own navigation-link children is self-contained
		// and does not resolve to any navigation menu — never shown.
		const menu = await requestUtils.createNavigationMenu( {
			title: 'Fallback Menu',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'inline-nav-header',
			title: 'Inline Nav Header',
			content: `<!-- wp:navigation --><!-- wp:navigation-link {"label":"Blog","url":"#"} /--><!-- /wp:navigation -->`,
		} );

		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menu.id }&postType=wp_navigation`
		);

		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		// Nav block has inline items → self-contained, not shown.
		await expect( page.getByText( 'Inline Nav Header' ) ).toBeHidden();
	} );

	test( 'with multiple menus: unbound block shown for fallback (newest) menu only', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		// menuA is created first, menuB second → menuB is the fallback
		// (WordPress uses the most recently created published menu).
		const menuA = await requestUtils.createNavigationMenu( {
			title: 'Multi Menu A',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );
		const menuB = await requestUtils.createNavigationMenu( {
			title: 'Multi Menu B',
			content:
				'<!-- wp:navigation-link {"label":"About","url":"/about"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'unbound-multi-header',
			title: 'Unbound Multi Header',
			content: `<!-- wp:navigation /-->`,
		} );

		// Viewing the NON-fallback menu (menuA) → unbound block not shown.
		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menuA.id }&postType=wp_navigation`
		);
		await expect(
			page.getByRole( 'treegrid', { name: 'Block navigation structure' } )
		).toBeVisible();
		await expect( page.getByText( 'Unbound Multi Header' ) ).toBeHidden();

		// Viewing the fallback menu (menuB, most recently created) → shown.
		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menuB.id }&postType=wp_navigation`
		);
		await expect(
			page.getByRole( 'treegrid', { name: 'Block navigation structure' } )
		).toBeVisible();
		await expect( page.getByText( 'Unbound Multi Header' ) ).toBeVisible();
	} );

	test( 'preview area does NOT show template part using a different nav menu', async ( {
		admin,
		page,
		requestUtils,
	} ) => {
		const menuA = await requestUtils.createNavigationMenu( {
			title: 'Menu A',
			content: '<!-- wp:navigation-link {"label":"Home","url":"/"} /-->',
		} );
		const menuB = await requestUtils.createNavigationMenu( {
			title: 'Menu B',
			content:
				'<!-- wp:navigation-link {"label":"About","url":"/about"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'menu-b-header',
			title: 'Menu B Header',
			content: `<!-- wp:navigation {"ref":${ menuB.id }} /-->`,
		} );

		await admin.visitAdminPage(
			'site-editor.php',
			`postId=${ menuA.id }&postType=wp_navigation`
		);

		await expect(
			page.getByRole( 'treegrid', {
				name: 'Block navigation structure',
			} )
		).toBeVisible();

		// Template part for Menu B should NOT appear when viewing Menu A.
		await expect( page.getByText( 'Menu B Header' ) ).toBeHidden();
	} );
} );
