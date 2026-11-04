const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const getRotate = ( locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

const getTranslate = ( locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).translate
	);

test.describe( 'Transform block support', () => {
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

	test( 'offsets the image with a rotation but not its caption or enlarged lightbox image', async ( {
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
				style: { transform: { rotate: '10deg' } },
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
			.getByRole( 'menuitemcheckbox', { name: /X offset/ } )
			.click();
		await page
			.getByRole( 'menuitemcheckbox', { name: /Y offset/ } )
			.click();
		await page.keyboard.press( 'Escape' );
		await settings
			.getByRole( 'spinbutton', { name: 'X offset' } )
			.fill( '12' );
		await settings
			.getByRole( 'spinbutton', { name: 'Y offset' } )
			.fill( '-6' );

		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.style?.transform;
			} )
			.toEqual( {
				rotate: '10deg',
				translate: { x: '12px', y: '-6px' },
			} );

		const editorImage = editor.canvas.locator( '.wp-block-image img' );
		await expect
			.poll( () => getTranslate( editorImage ) )
			.toBe( '12px -6px' );
		expect( await getRotate( editorImage ) ).toBe( '10deg' );
		expect(
			await getTranslate(
				editor.canvas.locator( '.wp-block-image figcaption' )
			)
		).toBe( 'none' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const image = page.locator( '.wp-lightbox-container img' );
		expect( await getTranslate( image ) ).toBe( '12px -6px' );
		expect( await getRotate( image ) ).toBe( '10deg' );
		expect(
			await getTranslate(
				page.locator( '.wp-lightbox-container figcaption' )
			)
		).toBe( 'none' );

		await image.click();
		const enlargedImage = page
			.locator( '.wp-lightbox-overlay .wp-block-image img' )
			.first();
		await expect( enlargedImage ).toBeVisible();
		expect( await getTranslate( enlargedImage ) ).toBe( 'none' );
	} );

	test( 'offsets a heading on mobile only on the front end', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'Offset heading',
				style: {
					'@mobile': { transform: { translate: { y: '-4px' } } },
				},
			},
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const heading = page.getByRole( 'heading', {
			name: 'Offset heading',
		} );
		expect( await getTranslate( heading ) ).toBe( 'none' );
		await page.setViewportSize( { width: 400, height: 800 } );
		await expect.poll( () => getTranslate( heading ) ).toBe( '0px -4px' );
	} );
} );
