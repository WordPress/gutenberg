const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Site Logo', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		const logo = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
		const icon = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_green.png'
		);
		await requestUtils.updateSiteSettings( {
			site_logo: logo.id,
			site_icon: icon.id,
		} );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.updateSiteSettings( {
			site_logo: 0,
			site_icon: 0,
		} );
		await requestUtils.deleteAllMedia();
	} );

	test( 'shows the icon as not synced when it differs from the logo, without changing the block', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.setContent(
			'<!-- wp:site-logo {"shouldSyncIcon":true} /-->'
		);
		await editor.canvas
			.getByRole( 'document', { name: 'Block: Site Logo' } )
			.click();
		await editor.openDocumentSettingsSidebar();

		await expect(
			page.getByRole( 'checkbox', { name: 'Use as Site Icon' } )
		).not.toBeChecked();
		expect( await editor.getBlocks() ).toEqual( [
			{
				name: 'core/site-logo',
				attributes: {
					isLink: true,
					linkTarget: '_self',
					shouldSyncIcon: true,
				},
				innerBlocks: [],
			},
		] );
	} );
} );
