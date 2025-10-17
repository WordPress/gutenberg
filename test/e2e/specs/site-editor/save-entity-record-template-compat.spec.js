/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'calling saveEntityRecord with a theme template ID', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'emptytheme' );
	} );
	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );
	test.beforeEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );
	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllTemplates( 'wp_template' );
		await requestUtils.deleteAllTemplates( 'wp_template_part' );
	} );
	test( 'should work as expected', async ( { admin, page } ) => {
		await admin.visitSiteEditor();
		await page.evaluate( async () => {
			await window.wp.data.dispatch( 'core' ).saveEntityRecord(
				'postType',
				'wp_template',
				{
					id: 'emptytheme//index',
					title: 'saveEntityRecord test',
					content: 'test',
				},
				{ throwOnError: true }
			);
		} );
		const template = await page.evaluate( async () => {
			return await window.wp.data
				.select( 'core' )
				.getEntityRecord(
					'postType',
					'wp_template',
					'emptytheme//index'
				);
		} );
		expect( template.content.raw ).toEqual( 'test' );
		expect( template.theme ).toEqual( 'emptytheme' );
		await admin.visitSiteEditor( {
			postType: 'wp_template',
			activeView: 'user',
		} );
		await expect(
			page
				.getByRole( 'button', { name: 'saveEntityRecord test' } )
				.first()
		).toBeVisible();
		await expect( page.getByText( 'Template typeIndex' ) ).toBeVisible();
		await page.evaluate( async () => {
			return await window.wp.data
				.dispatch( 'core' )
				.deleteEntityRecord(
					'postType',
					'wp_template',
					'emptytheme//index'
				);
		} );
	} );

	test( 'should work as expected for different theme by calling the API directly', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		const template = await page.evaluate( async () => {
			return await window.wp.apiFetch( {
				path: '/wp/v2/templates',
				method: 'POST',
				data: {
					slug: 'test',
					title: 'for different theme',
					content: 'test',
					theme: 'twentytwentyone',
				},
			} );
		} );
		expect( template.content.raw ).toEqual( 'test' );
		expect( template.theme ).toEqual( 'twentytwentyone' );
		await admin.visitSiteEditor( {
			postType: 'wp_template',
			activeView: 'user',
		} );
		await expect(
			page.getByRole( 'button', { name: 'for different theme' } ).first()
		).toBeVisible();
		await page.evaluate( async ( _id ) => {
			return await window.wp.data
				.dispatch( 'core' )
				.deleteEntityRecord( 'postType', 'wp_template', _id );
		}, template.wp_id );
	} );

	test( 'getEntityRecord should work as expected', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		const template = await page.evaluate( async () => {
			return await window.wp.data
				.resolveSelect( 'core' )
				.getEntityRecord(
					'postType',
					'wp_template',
					'emptytheme//index'
				);
		} );
		expect( template.slug ).toEqual( 'index' );
		expect( template.type ).toEqual( 'wp_template' );
		expect( template.status ).toEqual( 'publish' );
		expect( template.wp_id ).toEqual( 0 );
		expect( template.is_custom ).toEqual( false );
		expect( template.theme ).toEqual( 'emptytheme' );
	} );

	test( 'getEditedEntityRecord should work as expected', async ( {
		admin,
		page,
	} ) => {
		await admin.visitSiteEditor();
		const template = await page.evaluate( async () => {
			return await window.wp.data
				.resolveSelect( 'core' )
				.getEditedEntityRecord(
					'postType',
					'wp_template',
					'emptytheme//index'
				);
		} );
		expect( template.slug ).toEqual( 'index' );
		expect( template.type ).toEqual( 'wp_template' );
		expect( template.status ).toEqual( 'publish' );
		expect( template.wp_id ).toEqual( 0 );
		expect( template.is_custom ).toEqual( false );
		expect( template.theme ).toEqual( 'emptytheme' );
	} );
} );
