import type { Locator, Page } from '@playwright/test';
import { test, expect } from '@wordpress/e2e-test-utils-playwright';

const getRotate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).rotate
	);

const getScale = ( locator: Locator ) =>
	locator.evaluate( ( element ) => window.getComputedStyle( element ).scale );

const getTranslate = ( locator: Locator ) =>
	locator.evaluate(
		( element ) => window.getComputedStyle( element ).translate
	);

async function showTransformControl( page: Page, name: RegExp ) {
	await page
		.getByRole( 'region', { name: 'Editor settings' } )
		.getByRole( 'button', { name: 'Transform options' } )
		.click();
	await page.getByRole( 'menuitemcheckbox', { name } ).click();
	await page.keyboard.press( 'Escape' );
}

test.describe( 'Transform block support', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// The theme opts into the transform tools with `appearanceTools`.
		await requestUtils.activateTheme( 'emptytheme' );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.activateTheme( 'twentytwentyone' );
	} );

	test( 'saves the rotation and fits the block to its content', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'Tilted' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Level' },
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', { name: 'Block: Heading' } )
		);
		await editor.openDocumentSettingsSidebar();
		await showTransformControl( page, /Rotation/ );
		await page
			.getByRole( 'region', { name: 'Editor settings' } )
			.getByRole( 'spinbutton', { name: 'Rotation' } )
			.fill( '30' );

		await expect
			.poll( editor.getEditedPostContent )
			.toContain(
				'<h2 class="wp-block-heading has-rotation" style="rotate:30deg">'
			);

		const editorHeading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect.poll( () => getRotate( editorHeading ) ).toBe( '30deg' );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const heading = page.getByRole( 'heading', { name: 'Tilted' } );
		await expect( heading ).toHaveAttribute( 'style', 'rotate:30deg' );
		expect( await getRotate( heading ) ).toBe( '30deg' );
		expect(
			await heading.evaluate(
				( element: HTMLElement ) =>
					element.offsetWidth <
					( element.nextElementSibling as HTMLElement ).offsetWidth
			)
		).toBe( true );
	} );

	test( 'keeps the grid size of a rotated grid item', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { layout: { type: 'grid', columnCount: 2 } },
			innerBlocks: [
				{
					name: 'core/heading',
					attributes: {
						content: 'Tilted',
						style: { transform: { rotate: '4deg' } },
					},
				},
				{ name: 'core/paragraph', attributes: { content: 'Level' } },
			],
		} );

		const isSameWidthAsSibling = ( element: HTMLElement ) =>
			element.offsetWidth ===
			( element.nextElementSibling as HTMLElement ).offsetWidth;

		const editorHeading = editor.canvas.getByRole( 'document', {
			name: 'Block: Heading',
		} );
		await expect.poll( () => getRotate( editorHeading ) ).toBe( '4deg' );
		await expect( editorHeading ).toHaveClass( /has-rotation/ );
		expect( await editorHeading.evaluate( isSameWidthAsSibling ) ).toBe(
			true
		);

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const heading = page.getByRole( 'heading', { name: 'Tilted' } );
		expect( await getRotate( heading ) ).toBe( '4deg' );
		await expect( heading ).toHaveClass( /has-rotation/ );
		expect( await heading.evaluate( isSameWidthAsSibling ) ).toBe( true );
	} );

	test( 'keeps the width of a rotated video', async ( { editor, page } ) => {
		await editor.insertBlock( {
			name: 'core/video',
			attributes: {
				src: 'https://example.com/video.mp4',
				caption: 'Caption',
				style: { transform: { rotate: '4deg' } },
			},
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'After' },
		} );

		const editorVideo = editor.canvas.locator( 'figure.wp-block-video' );
		await expect.poll( () => getRotate( editorVideo ) ).toBe( '4deg' );
		await expect( editorVideo ).not.toHaveClass( /has-rotation/ );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const video = page.locator( 'figure.wp-block-video' );
		expect( await getRotate( video ) ).toBe( '4deg' );
		await expect( video ).not.toHaveClass( /has-rotation/ );
		expect(
			await video.evaluate(
				( element: HTMLElement ) =>
					element.offsetWidth ===
					( element.nextElementSibling as HTMLElement ).offsetWidth
			)
		).toBe( true );
	} );

	test( 'keeps the width of rotated containers', async ( {
		editor,
		page,
	} ) => {
		const rotate = { transform: { rotate: '4deg' } };
		const paragraphs = [
			{ name: 'core/paragraph', attributes: { content: 'One' } },
			{ name: 'core/paragraph', attributes: { content: 'Two' } },
			{ name: 'core/paragraph', attributes: { content: 'Three' } },
		];
		await editor.insertBlock( {
			name: 'core/group',
			attributes: { className: 'is-plain', style: rotate },
			innerBlocks: [ paragraphs[ 0 ] ],
		} );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				className: 'is-row',
				layout: {
					type: 'flex',
					flexWrap: 'nowrap',
					justifyContent: 'space-between',
				},
				style: rotate,
			},
			innerBlocks: paragraphs.slice( 0, 2 ),
		} );
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				className: 'is-grid',
				layout: { type: 'grid', columnCount: 3 },
				style: rotate,
			},
			innerBlocks: paragraphs,
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { className: 'is-level', content: 'Level' },
		} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const levelWidth = await page
			.locator( '.is-level' )
			.evaluate( ( element: HTMLElement ) => element.offsetWidth );
		for ( const className of [ 'is-plain', 'is-row', 'is-grid' ] ) {
			const group = page.locator( `.wp-block-group.${ className }` );
			expect( await getRotate( group ) ).toBe( '4deg' );
			await expect( group ).not.toHaveClass( /has-rotation/ );
			expect(
				await group.evaluate(
					( element: HTMLElement ) => element.offsetWidth
				)
			).toBe( levelWidth );
		}
	} );

	test( 'does not fit a block with a zero rotation', async ( {
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
						'core/heading': { transform: { rotate: '0deg' } },
					},
				},
			},
		} );

		try {
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: { content: 'Global' },
			} );
			await editor.insertBlock( {
				name: 'core/heading',
				attributes: {
					content: 'Level',
					style: { transform: { rotate: '0deg' } },
				},
			} );
			await editor.insertBlock( {
				name: 'core/paragraph',
				attributes: { content: 'After' },
			} );

			await expect
				.poll( editor.getEditedPostContent )
				.toContain(
					'<h2 class="wp-block-heading" style="rotate:0deg">Level</h2>'
				);

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			const isSameWidthAsSibling = ( element: HTMLElement ) =>
				element.offsetWidth ===
				( element.nextElementSibling as HTMLElement ).offsetWidth;
			for ( const name of [ 'Global', 'Level' ] ) {
				const heading = page.getByRole( 'heading', { name } );
				expect( await getRotate( heading ) ).toBe( '0deg' );
				await expect( heading ).not.toHaveClass( /has-rotation/ );
				expect( await heading.evaluate( isSameWidthAsSibling ) ).toBe(
					true
				);
			}
		} finally {
			await requestUtils.resetThemeGlobalStyles();
		}
	} );

	test( 'saves only the axis a user sets over a Global Styles axis', async ( {
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
						'core/group': {
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
				name: 'core/group',
				innerBlocks: [
					{
						name: 'core/paragraph',
						attributes: { content: 'Offset' },
					},
				],
			} );
			await editor.openDocumentSettingsSidebar();
			await showTransformControl( page, /Offset/ );

			const settings = page.getByRole( 'region', {
				name: 'Editor settings',
			} );
			await expect(
				settings.getByRole( 'spinbutton', { name: 'X offset' } )
			).toHaveAttribute( 'placeholder', '30' );
			await settings
				.getByRole( 'spinbutton', { name: 'Y offset' } )
				.fill( '4' );

			await expect
				.poll( async () => {
					const [ block ] = await editor.getBlocks();
					return block.attributes.style;
				} )
				.toEqual( {
					transform: { translate: { y: '4px' } },
				} );

			const postId = await editor.publishPost();
			await page.goto( `/?p=${ postId }` );

			expect(
				await getTranslate( page.locator( '.wp-block-group' ) )
			).toBe( '30px 4px' );
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

	test( 'saves only the axis set on mobile and keeps the other one live', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/group',
			innerBlocks: [
				{ name: 'core/paragraph', attributes: { content: 'Offset' } },
			],
		} );
		await editor.openDocumentSettingsSidebar();
		await showTransformControl( page, /Offset/ );
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );
		const xOffset = settings.getByRole( 'spinbutton', {
			name: 'X offset',
		} );
		const yOffset = settings.getByRole( 'spinbutton', {
			name: 'Y offset',
		} );
		await xOffset.fill( '66' );
		await yOffset.fill( '35' );

		const setView = async ( name: string ) => {
			await page
				.getByRole( 'button', { name: 'View', exact: true } )
				.click();
			await page.getByRole( 'menuitemradio', { name } ).click();
			const responsive = page.getByRole( 'menuitemcheckbox', {
				name: 'Responsive styles',
			} );
			if (
				name === 'Mobile' &&
				( await responsive.getAttribute( 'aria-checked' ) ) !== 'true'
			) {
				await responsive.click();
			}
			await page.keyboard.press( 'Escape' );
		};

		await setView( 'Mobile' );
		// The state inspector remounts its panels, so optional controls start hidden.
		await showTransformControl( page, /Offset/ );
		await expect( yOffset ).toHaveAttribute( 'placeholder', '35' );
		await xOffset.fill( '21' );
		await setView( 'Desktop' );
		await yOffset.fill( '45' );

		await expect
			.poll( async () => {
				const [ block ] = await editor.getBlocks();
				return block.attributes.style;
			} )
			.toEqual( {
				transform: { translate: { x: '66px', y: '45px' } },
				'@mobile': { transform: { translate: { x: '21px' } } },
			} );

		const postId = await editor.publishPost();
		await page.goto( `/?p=${ postId }` );

		const group = page.locator( '.wp-block-group' );
		expect( await getTranslate( group ) ).toBe( '66px 45px' );
		await page.setViewportSize( { width: 400, height: 800 } );
		await expect.poll( () => getTranslate( group ) ).toBe( '21px 45px' );
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

			await editor.selectBlocks(
				editor.canvas
					.getByRole( 'document', { name: 'Block: Heading' } )
					.first()
			);
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
