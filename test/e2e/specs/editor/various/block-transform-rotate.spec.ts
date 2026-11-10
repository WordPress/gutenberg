import type { Locator } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

const getRotate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

test.describe( 'Transform rotate block support', () => {
	let uploadedMedia: Awaited< ReturnType< RequestUtils[ 'uploadMedia' ] > >;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
		uploadedMedia = await requestUtils.uploadMedia(
			'./assets/10x10_e2e_test_image_z9T8jK.png'
		);
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMedia();
	} );

	test( 'rotates the image with its caption but not the enlarged lightbox image', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/image',
			attributes: {
				id: uploadedMedia.id,
				url: uploadedMedia.source_url,
				caption: 'Caption',
				lightbox: { enabled: true },
			},
		} );
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings.getByRole( 'tab', { name: 'Styles' } ).click();
		await settings
			.getByRole( 'button', { name: 'Transform options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: /Rotation/ } )
			.click();
		await page.keyboard.press( 'Escape' );
		await settings
			.getByRole( 'spinbutton', { name: 'Rotation' } )
			.fill( '30' );

		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.style;
			} )
			.toMatchObject( { transform: { rotate: '30deg' } } );

		const editorFigure = editor.canvas.locator( 'figure.wp-block-image' );
		await expect.poll( () => getRotate( editorFigure ) ).toBe( '30deg' );
		await expect( editorFigure.locator( 'figcaption' ) ).toBeVisible();
		expect( await getRotate( editorFigure.locator( 'img' ) ) ).toBe(
			'none'
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figure = page.locator( '.wp-lightbox-container' );
		const image = figure.locator( 'img' );
		expect( await getRotate( figure ) ).toBe( '30deg' );
		await expect( figure.locator( 'figcaption' ) ).toBeVisible();
		expect( await getRotate( image ) ).toBe( 'none' );

		await image.click();
		const enlargedFigure = page
			.locator( '.wp-lightbox-overlay .wp-block-image' )
			.last();
		await expect( enlargedFigure.locator( 'img' ) ).toBeVisible();
		expect( await getRotate( enlargedFigure ) ).toBe( 'none' );
		expect( await getRotate( enlargedFigure.locator( 'img' ) ) ).toBe(
			'none'
		);
	} );
} );
