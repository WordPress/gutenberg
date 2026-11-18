import type { Page } from '@playwright/test';
import type { Admin, RequestUtils } from '@wordpress/e2e-test-utils-playwright';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

type CreateTemplatePayload = Parameters<
	RequestUtils[ 'createTemplate' ]
>[ 1 ];

// Whether the run targets the extensible site editor (v2), which lives at
// `admin.php?page=site-editor-v2` and routes via the `p` query param.
const isSiteEditorV2 = !! process.env.GUTENBERG_E2E_SITE_EDITOR_V2;

const THEME = 'emptytheme';
const HEADER_ID = `${ THEME }//site-parts-header`;

function visitSiteParts( admin: Admin, path: string ) {
	const query = new URLSearchParams( { p: path } );
	if ( isSiteEditorV2 ) {
		query.set( 'page', 'site-editor-v2' );
		return admin.visitAdminPage( 'admin.php', query.toString() );
	}
	return admin.visitAdminPage( 'site-editor.php', query.toString() );
}

// The site editors render their navigation items as links (v2) or buttons
// (v1).
const navigationRole = isSiteEditorV2 ? 'link' : 'button';

// The area screen's own controls. In v2 the site editor's menu, which also
// has an Identity link, sits beside it, so look inside the screen's region.
function areaScreen( page: Page, area = 'Header' ) {
	return isSiteEditorV2 ? page.getByRole( 'region', { name: area } ) : page;
}

test.describe( 'Site parts', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( THEME );
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-site-parts',
		] );
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllMenus();

		const menu = await requestUtils.createNavigationMenu( {
			title: 'Site parts menu',
			content:
				'<!-- wp:navigation-link {"label":"About","type":"custom","url":"https://example.com/about"} /-->',
		} );

		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'site-parts-header',
			title: 'Site parts header',
			area: 'header',
			content: [
				'<!-- wp:site-logo /-->',
				'<!-- wp:site-title /-->',
				`<!-- wp:navigation {"ref":${ menu.id }} /-->`,
				'<!-- wp:social-links --><ul class="wp-block-social-links"><!-- wp:social-link {"url":"https://instagram.com/example","service":"instagram"} /--></ul><!-- /wp:social-links -->',
			].join( '\n' ),
			// The REST API takes the area, which the payload type leaves out.
		} as CreateTemplatePayload );
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'site-parts-header-alt',
			title: 'Site parts header alt',
			area: 'header',
			content: '<!-- wp:site-title /-->',
			// The REST API takes the area, which the payload type leaves out.
		} as CreateTemplatePayload );
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'site-parts-header-unused',
			title: 'Site parts header unused',
			area: 'header',
			content: '<!-- wp:site-title /-->',
			// The REST API takes the area, which the payload type leaves out.
		} as CreateTemplatePayload );
		await requestUtils.createTemplate( 'wp_template_part', {
			slug: 'site-parts-footer',
			title: 'Site parts footer',
			area: 'footer',
			content: '<!-- wp:site-tagline /-->',
			// The REST API takes the area, which the payload type leaves out.
		} as CreateTemplatePayload );
		await requestUtils.createTemplate( 'wp_template', {
			slug: 'index',
			title: 'Index',
			content:
				'<!-- wp:template-part {"slug":"site-parts-header","theme":"emptytheme"} /--><!-- wp:template-part {"slug":"site-parts-footer","theme":"emptytheme"} /-->',
		} );
		await requestUtils.createTemplate( 'wp_template', {
			slug: '404',
			title: '404',
			content:
				'<!-- wp:template-part {"slug":"site-parts-header-alt","theme":"emptytheme"} /-->',
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
		await requestUtils.deleteAllMenus();
		await requestUtils.setGutenbergExperiments( [] );
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'lists the parts the homepage uses', async ( { admin, page } ) => {
		await visitSiteParts( admin, '/site-parts' );

		await expect(
			page.getByRole( navigationRole, { name: /Header/ } )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, { name: /Footer/ } )
		).toBeVisible();
		// No header opens a navigation overlay.
		await expect(
			page.getByRole( navigationRole, { name: /Navigation overlay/ } )
		).toHaveCount( 0 );
	} );

	test( 'opens the primary header with panels for what it holds', async ( {
		admin,
		page,
	} ) => {
		await visitSiteParts( admin, '/site-parts' );
		await page.getByRole( navigationRole, { name: /Header/ } ).click();

		await expect(
			areaScreen( page ).getByRole( navigationRole, {
				name: 'Identity',
			} )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, { name: 'Menu' } )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, { name: 'Social icons' } )
		).toBeVisible();

		// Where the header appears, by template name.
		await expect( page.getByText( /Used on Index/ ).first() ).toBeVisible();

		// The 404 template's header is in use; the unused one isn't listed.
		await expect(
			page.getByRole( 'heading', { name: 'Other headers in use' } )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, {
				name: /Site parts header alt/,
			} )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, {
				name: /Site parts header unused/,
			} )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( navigationRole, { name: 'All headers' } )
		).toBeVisible();

		// The canvas edits the primary header.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data.select( 'core/editor' ).getCurrentPostId?.()
				)
			)
			.toBe( HEADER_ID );
	} );

	test( 'edits the header’s social icons', async ( { admin, page } ) => {
		await visitSiteParts( admin, '/site-parts/header' );
		await page
			.getByRole( navigationRole, { name: 'Social icons' } )
			.click();

		const instagram = page.getByRole( 'textbox', { name: 'Instagram' } );
		await expect( instagram ).toHaveValue(
			'https://instagram.com/example'
		);
		await instagram.fill( 'https://instagram.com/changed' );
		// Leaving the field makes the edit an undo step.
		await instagram.blur();

		await expect
			.poll( () =>
				page.evaluate( ( id ) => {
					const { blocks } = ( window as any ).wp.data
						.select( 'core' )
						.getEditedEntityRecord(
							'postType',
							'wp_template_part',
							id
						);
					type Block = {
						name: string;
						attributes: { url?: string };
						innerBlocks?: Block[];
					};
					const find = ( list?: Block[] ): string | undefined => {
						for ( const block of list ?? [] ) {
							if ( block.name === 'core/social-link' ) {
								return block.attributes.url;
							}
							const url = find( block.innerBlocks );
							if ( url ) {
								return url;
							}
						}
						return undefined;
					};
					return find( blocks );
				}, HEADER_ID )
			)
			.toBe( 'https://instagram.com/changed' );
	} );

	test( 'edits the header’s menu in place', async ( { admin, page } ) => {
		await visitSiteParts( admin, '/site-parts/header' );
		await page.getByRole( navigationRole, { name: 'Menu' } ).click();

		// The current menu shows first; switching it takes a deliberate step.
		await expect(
			page.getByText( 'Site parts menu', { exact: true } )
		).toBeVisible();
		await expect(
			page.getByRole( 'combobox', { name: 'Menu' } )
		).toHaveCount( 0 );
		await page.getByRole( 'button', { name: 'Change' } ).click();
		await expect(
			page.getByRole( 'combobox', { name: 'Menu' } )
		).toContainText( 'Site parts menu' );
		await page.getByRole( 'button', { name: 'Cancel' } ).click();
		await expect(
			page.getByRole( 'combobox', { name: 'Menu' } )
		).toHaveCount( 0 );
		await expect(
			page.getByRole( 'treegrid' ).getByRole( 'link', { name: /About/ } )
		).toBeVisible();
	} );

	test( 'edits the site name the header shows', async ( { admin, page } ) => {
		await visitSiteParts( admin, '/site-parts/header' );
		await areaScreen( page )
			.getByRole( navigationRole, { name: 'Identity' } )
			.click();

		await expect(
			page.getByRole( 'textbox', { name: 'Site Title' } )
		).toBeVisible();
		// The header has no Site Tagline block, so the form leaves it out.
		await expect(
			page.getByRole( 'textbox', { name: 'Site Tagline' } )
		).toHaveCount( 0 );
	} );
} );

test.describe( 'Site parts with the experiment off', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( THEME );
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'leaves the site editor as it was', async ( { admin, page } ) => {
		await visitSiteParts( admin, '/' );
		await expect(
			page.getByRole( navigationRole, { name: 'Styles' } )
		).toBeVisible();
		await expect(
			page.getByRole( navigationRole, { name: 'Site parts' } )
		).toHaveCount( 0 );

		for ( const path of [ '/site-parts', '/site-parts/header' ] ) {
			await visitSiteParts( admin, path );
			await expect(
				page
					.getByText(
						isSiteEditorV2
							? 'Route not found'
							: 'The requested page could not be found. Please check the URL.'
					)
					// v1 also announces the notice to screen readers.
					.first()
			).toBeVisible();
		}
	} );
} );
