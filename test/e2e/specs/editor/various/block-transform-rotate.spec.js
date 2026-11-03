const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const getRotate = ( locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

test.describe( 'Transform rotate block support', () => {
	let uploadedMedia;

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

	test( 'rotates the image but not its caption or enlarged lightbox image', async ( {
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
				return block.attributes.style?.transform?.rotate;
			} )
			.toBe( '30deg' );

		const editorImage = editor.canvas.locator( '.wp-block-image img' );
		await expect.poll( () => getRotate( editorImage ) ).toBe( '30deg' );
		expect(
			await getRotate(
				editor.canvas.locator( '.wp-block-image figcaption' )
			)
		).toBe( 'none' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const image = page.locator( '.wp-lightbox-container img' );
		expect( await getRotate( image ) ).toBe( '30deg' );
		expect(
			await getRotate( page.locator( '.wp-lightbox-container' ) )
		).toBe( 'none' );
		expect(
			await getRotate(
				page.locator( '.wp-lightbox-container figcaption' )
			)
		).toBe( 'none' );

		await image.click();
		const enlargedImage = page
			.locator( '.wp-lightbox-overlay .wp-block-image img' )
			.first();
		await expect( enlargedImage ).toBeVisible();
		expect( await getRotate( enlargedImage ) ).toBe( 'none' );
	} );

	test( 'stores a rotation under the hover state', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{ name: 'core/button', attributes: { text: 'Hi' } },
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Button',
				exact: true,
			} )
		);
		await editor.openDocumentSettingsSidebar();

		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		await settings
			.getByRole( 'button', { name: 'State: Default' } )
			.click();
		await page.getByRole( 'menuitem', { name: 'Hover' } ).click();
		await page.keyboard.press( 'Escape' );

		await settings
			.getByRole( 'button', { name: 'Transform options' } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: /Rotation/ } )
			.click();
		await page.keyboard.press( 'Escape' );
		await settings
			.getByRole( 'spinbutton', { name: 'Rotation' } )
			.fill( '10' );

		await expect
			.poll( async () => {
				const [ { innerBlocks } ] = await editor.getBlocks();
				return innerBlocks[ 0 ].attributes.style;
			} )
			.toEqual( { ':hover': { transform: { rotate: '10deg' } } } );
	} );
} );
