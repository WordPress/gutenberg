import { writeFileSync } from 'fs';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

test.describe( 'Site Logo', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.activatePlugin( 'gutenberg-test-allow-svg-uploads' );
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/settings',
			data: { site_logo: 0 },
		} );
		await requestUtils.deleteAllMedia();
		await requestUtils.deactivatePlugin(
			'gutenberg-test-allow-svg-uploads'
		);
	} );

	test( 'keeps a linked SVG logo without a size visible after resizing', async ( {
		admin,
		editor,
		page,
		requestUtils,
	} ) => {
		// An SVG without its own width and height.
		const svgPath = test.info().outputPath( 'logo.svg' );
		writeFileSync(
			svgPath,
			'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 200 200"><circle cx="100" cy="100" r="100"/></svg>'
		);
		const media = await requestUtils.uploadMedia( svgPath );
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/media/${ media.id }`,
			data: { alt_text: 'Circle logo' },
		} );
		await requestUtils.rest( {
			method: 'POST',
			path: '/wp/v2/settings',
			data: { site_logo: media.id },
		} );

		await admin.createNewPost();
		await editor.insertBlock( { name: 'core/site-logo' } );
		await editor.openDocumentSettingsSidebar();

		const logo = editor.canvas.getByRole( 'img', {
			name: 'Circle logo',
			exact: true,
		} );
		await expect( logo ).toBeVisible();
		await expect(
			page.getByRole( 'checkbox', {
				name: 'Link image to home',
				exact: true,
			} )
		).toBeChecked();
		expect( ( await logo.boundingBox() )?.width ).toBe( 120 );

		await page
			.getByRole( 'spinbutton', { name: 'Image width', exact: true } )
			.click();
		await page.keyboard.press( 'ControlOrMeta+a' );
		await page.keyboard.type( '200' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/site-logo',
				attributes: { isLink: true, width: 200 },
			},
		] );
		await expect
			.poll( async () => ( await logo.boundingBox() )?.width )
			.toBe( 200 );
	} );
} );
