import type { Locator } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';
import type { RequestUtils } from '@wordpress/e2e-test-utils-playwright';

const getRotate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

const getTranslate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).translate
	);

const getScale = ( locator: Locator ) =>
	locator.evaluate( ( element ) => window.getComputedStyle( element ).scale );

test.describe( 'Transform block support', () => {
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

	test( 'offsets the image with its caption and rotation but not the enlarged lightbox image', async ( {
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
				return block.attributes.style;
			} )
			.toEqual(
				expect.objectContaining( {
					transform: {
						rotate: '10deg',
						translate: { x: '12px', y: '-6px' },
					},
				} )
			);

		const editorFigure = editor.canvas.locator( 'figure.wp-block-image' );
		await expect
			.poll( () => getTranslate( editorFigure ) )
			.toBe( '12px -6px' );
		expect( await getRotate( editorFigure ) ).toBe( '10deg' );
		expect( await getTranslate( editorFigure.locator( 'img' ) ) ).toBe(
			'none'
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figure = page.locator( '.wp-lightbox-container' );
		const image = figure.locator( 'img' );
		expect( await getTranslate( figure ) ).toBe( '12px -6px' );
		expect( await getRotate( figure ) ).toBe( '10deg' );
		expect( await getTranslate( image ) ).toBe( 'none' );

		await image.click();
		const enlargedFigure = page
			.locator( '.wp-lightbox-overlay .wp-block-image' )
			.last();
		await expect( enlargedFigure.locator( 'img' ) ).toBeVisible();
		expect( await getTranslate( enlargedFigure ) ).toBe( 'none' );
		expect( await getRotate( enlargedFigure ) ).toBe( 'none' );
	} );

	test( 'keeps the Global Styles axis when a heading sets one axis', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const stylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/global-styles/${ stylesPostId }`,
			data: {
				id: stylesPostId,
				settings: {},
				styles: {
					blocks: {
						'core/heading': {
							transform: { translate: { x: '30px' } },
						},
					},
				},
			},
		} );

		try {
			// Global Styles reach the editor when it loads.
			await page.reload();
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Offset heading',
					style: {
						transform: { translate: { y: '4px' } },
						'@mobile': { transform: { translate: { y: '-4px' } } },
					},
				},
			} );

			const canvasHeading = editor.canvas.locator( 'h2', {
				hasText: 'Offset heading',
			} );
			await expect
				.poll( () => getTranslate( canvasHeading ) )
				.toBe( '30px 4px' );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const heading = page.getByRole( 'heading', {
				name: 'Offset heading',
			} );
			expect( await getTranslate( heading ) ).toBe( '30px 4px' );
			await page.setViewportSize( { width: 400, height: 800 } );
			await expect
				.poll( () => getTranslate( heading ) )
				.toBe( '30px -4px' );
		} finally {
			await requestUtils.resetThemeGlobalStyles();
		}
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

	test( 'scales the image with its caption but not the enlarged lightbox image', async ( {
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
		await page.getByRole( 'menuitemcheckbox', { name: /Scale/ } ).click();
		await page.keyboard.press( 'Escape' );
		await settings
			.getByRole( 'spinbutton', { name: 'Scale' } )
			.fill( '1.5' );

		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.style;
			} )
			.toEqual(
				expect.objectContaining( {
					transform: { rotate: '10deg', scale: 1.5 },
				} )
			);

		const editorFigure = editor.canvas.locator( 'figure.wp-block-image' );
		await expect.poll( () => getScale( editorFigure ) ).toBe( '1.5' );
		expect( await getRotate( editorFigure ) ).toBe( '10deg' );
		expect( await getScale( editorFigure.locator( 'img' ) ) ).toBe(
			'none'
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const figure = page.locator( '.wp-lightbox-container' );
		const image = figure.locator( 'img' );
		expect( await getScale( figure ) ).toBe( '1.5' );
		await expect( figure.locator( 'figcaption' ) ).toBeVisible();
		expect( await getScale( image ) ).toBe( 'none' );

		await image.click();
		const enlargedFigure = page
			.locator( '.wp-lightbox-overlay .wp-block-image' )
			.last();
		await expect( enlargedFigure.locator( 'img' ) ).toBeVisible();
		expect( await getScale( enlargedFigure ) ).toBe( 'none' );
		expect( await getRotate( enlargedFigure ) ).toBe( 'none' );
	} );

	test( 'shows a Global Styles scale and lets a heading override it', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const stylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/global-styles/${ stylesPostId }`,
			data: {
				id: stylesPostId,
				settings: {},
				styles: {
					blocks: {
						'core/heading': { transform: { scale: '120%' } },
					},
				},
			},
		} );

		try {
			// Global Styles reach the editor when it loads.
			await page.reload();
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'Inherited heading' },
			} );
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Scaled heading',
					style: { transform: { scale: 0.8 } },
				},
			} );

			// The computed `scale` of `120%` is `1.2`.
			await expect
				.poll( () =>
					getScale(
						editor.canvas.locator( 'h2', {
							hasText: 'Inherited heading',
						} )
					)
				)
				.toBe( '1.2' );
			await expect
				.poll( () =>
					getScale(
						editor.canvas.locator( 'h2', {
							hasText: 'Scaled heading',
						} )
					)
				)
				.toBe( '0.8' );

			await editor.canvas
				.getByRole( 'document', { name: 'Block: Heading' } )
				.first()
				.click();
			await editor.openDocumentSettingsSidebar();
			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await settings
				.getByRole( 'button', { name: 'Transform options' } )
				.click();
			await page
				.getByRole( 'menuitemcheckbox', { name: /Scale/ } )
				.click();
			await page.keyboard.press( 'Escape' );
			const scaleInput = settings.getByRole( 'spinbutton', {
				name: 'Scale',
			} );
			await expect( scaleInput ).toHaveValue( '1.2' );
			await scaleInput.focus();
			await page.keyboard.press( 'Tab' );
			const [ inheritedHeading ] = await editor.getBlocks();
			expect( inheritedHeading.attributes.style ).toBeUndefined();

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			expect(
				await getScale(
					page.getByRole( 'heading', { name: 'Inherited heading' } )
				)
			).toBe( '1.2' );
			expect(
				await getScale(
					page.getByRole( 'heading', { name: 'Scaled heading' } )
				)
			).toBe( '0.8' );
		} finally {
			await requestUtils.resetThemeGlobalStyles();
		}
	} );

	test( 'scales a heading on mobile only on the front end', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: {
				content: 'Scaled heading',
				style: {
					'@mobile': { transform: { scale: 0.9 } },
				},
			},
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const heading = page.getByRole( 'heading', {
			name: 'Scaled heading',
		} );
		expect( await getScale( heading ) ).toBe( 'none' );
		await page.setViewportSize( { width: 400, height: 800 } );
		await expect.poll( () => getScale( heading ) ).toBe( '0.9' );
	} );
} );
