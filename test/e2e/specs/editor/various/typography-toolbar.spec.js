const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const FONT_FAMILIES = [
	{ slug: 'display', name: 'Display', fontFamily: 'Georgia, serif' },
	{ slug: 'body', name: 'Body', fontFamily: 'Helvetica, sans-serif' },
];

test.describe( 'Typography toolbar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-typography-toolbar',
		] );

		const stylesPostId =
			await requestUtils.getCurrentThemeGlobalStylesPostId();
		await requestUtils.rest( {
			method: 'POST',
			path: `/wp/v2/global-styles/${ stylesPostId }`,
			data: {
				id: stylesPostId,
				settings: {
					typography: {
						fontFamilies: { custom: FONT_FAMILIES },
					},
				},
				styles: {
					typography: {
						fontFamily: 'Helvetica, sans-serif',
						fontSize: '17px',
					},
					elements: {
						h2: {
							typography: {
								fontFamily: 'Georgia, serif',
								fontSize: '27px',
							},
						},
					},
				},
			},
		} );
	} );

	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.resetThemeGlobalStyles();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	const getToolbar = ( page ) =>
		page.getByRole( 'toolbar', { name: 'Block tools' } );

	test( 'names the font and size a paragraph renders at, alongside the usual tools', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const toolbar = getToolbar( page );
		await expect(
			toolbar.getByRole( 'button', { name: 'Font', exact: true } )
		).toHaveText( 'Body' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Size', exact: true } )
		).toHaveText( '17' );

		// The tools that were already there are untouched.
		await expect(
			toolbar.getByRole( 'button', { name: 'Bold' } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Align text' } )
		).toBeVisible();
	} );

	test( 'puts the font and the size before the alignment controls', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const labels = await getToolbar( page )
			.getByRole( 'button' )
			.evaluateAll( ( buttons ) =>
				buttons.map( ( button ) => button.getAttribute( 'aria-label' ) )
			);

		expect( labels.indexOf( 'Font' ) ).toBeLessThan(
			labels.indexOf( 'Align text' )
		);
		expect( labels.indexOf( 'Size' ) ).toBeLessThan(
			labels.indexOf( 'Align text' )
		);
		expect( labels.indexOf( 'Font' ) ).toBeLessThan(
			labels.indexOf( 'Size' )
		);
	} );

	test( 'reads a heading from the element its level renders as', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/heading',
			attributes: { content: 'The quiet hours', level: 2 },
		} );

		const toolbar = getToolbar( page );
		await expect(
			toolbar.getByRole( 'button', { name: 'Font', exact: true } )
		).toHaveText( 'Display' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Size', exact: true } )
		).toHaveText( '27' );
	} );

	test( 'a font is saved as a preset on the block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		await getToolbar( page )
			.getByRole( 'button', { name: 'Font', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Display' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { fontFamily: 'display' },
			},
		] );
	} );

	test( 'a theme size is saved as a preset, and a size of your own as a style', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const toolbar = getToolbar( page );
		await toolbar
			.getByRole( 'button', { name: 'Size', exact: true } )
			.click();
		// The size menu names each size by its number; Large is 36px.
		await page
			.getByRole( 'menuitemradio', { name: '36', exact: true } )
			.click();
		await expect
			.poll( editor.getBlocks )
			.toMatchObject( [
				{ name: 'core/paragraph', attributes: { fontSize: 'large' } },
			] );

		await toolbar
			.getByRole( 'button', { name: 'Size', exact: true } )
			.click();
		const customSize = page.getByRole( 'spinbutton', {
			name: 'Custom size',
		} );
		await customSize.fill( '33' );
		await customSize.press( 'Enter' );

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					fontSize: undefined,
					style: { typography: { fontSize: '33px' } },
				},
			},
		] );
	} );

	test( 'names the default size by the size it stands for', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		await getToolbar( page )
			.getByRole( 'button', { name: 'Size', exact: true } )
			.click();

		await expect( page.getByRole( 'menuitemradio' ).first() ).toHaveText(
			'17 - default'
		);
	} );

	test( 'offers the tools to a block that is not prose but has typography', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/buttons',
			innerBlocks: [
				{ name: 'core/button', attributes: { text: 'Press' } },
			],
		} );
		await editor.canvas
			.getByRole( 'textbox', { name: 'Button text' } )
			.click();

		const toolbar = getToolbar( page );
		await expect(
			toolbar.getByRole( 'button', { name: 'Font', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Size', exact: true } )
		).toBeVisible();
	} );

	test( 'leaves a block with no typography alone', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( { name: 'core/spacer' } );

		const toolbar = getToolbar( page );
		await expect(
			toolbar.getByRole( 'button', { name: 'Font', exact: true } )
		).toBeHidden();
		await expect(
			toolbar.getByRole( 'button', { name: 'Size', exact: true } )
		).toBeHidden();
	} );

	test( 'leaves the toolbar alone while the experiment is off', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await requestUtils.setGutenbergExperiments( [] );
		await page.reload();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		await expect(
			getToolbar( page ).getByRole( 'button', {
				name: 'Font',
				exact: true,
			} )
		).toBeHidden();

		await requestUtils.setGutenbergExperiments( [
			'gutenberg-typography-toolbar',
		] );
	} );
} );
