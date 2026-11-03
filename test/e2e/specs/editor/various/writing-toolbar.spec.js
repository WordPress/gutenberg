const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const FONT_FAMILIES = [
	{
		slug: 'display',
		name: 'Display',
		fontFamily: 'Georgia, serif',
	},
	{
		slug: 'body',
		name: 'Body',
		fontFamily: 'Helvetica, sans-serif',
	},
];

test.describe( 'Writing toolbar', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-writing-toolbar',
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

	test( 'offers the switch on a paragraph, but not on a block with nothing to write in', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );
		await expect(
			getToolbar( page ).getByRole( 'button', {
				name: 'Write',
				exact: true,
			} )
		).toBeVisible();

		await editor.insertBlock( { name: 'core/spacer' } );
		await expect(
			getToolbar( page ).getByRole( 'button', {
				name: 'Write',
				exact: true,
			} )
		).toBeHidden();
	} );

	test( 'swaps the design tools for the writing tools', async ( {
		editor,
		page,
	} ) => {
		// Two blocks, so the mover has somewhere to move to and renders.
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );

		const toolbar = getToolbar( page );
		await expect(
			toolbar.getByRole( 'button', { name: 'Move up' } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Style', exact: true } )
		).toBeHidden();

		await toolbar
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();

		await expect(
			toolbar.getByRole( 'button', { name: 'Write', exact: true } )
		).toHaveAttribute( 'aria-pressed', 'true' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Style', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Font', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Size', exact: true } )
		).toBeVisible();
		await expect(
			toolbar.getByRole( 'button', { name: 'Move up' } )
		).toBeHidden();
	} );

	test( 'a style turns a paragraph into a heading, keeping what was written', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const toolbar = getToolbar( page );
		await toolbar
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();
		await toolbar
			.getByRole( 'button', { name: 'Style', exact: true } )
			.click();
		await page.getByRole( 'menuitemradio', { name: 'Heading 2' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/heading',
				attributes: { content: 'Writing', level: 2 },
			},
		] );
	} );

	test( 'the style menu groups the headings under the font they are set in', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const toolbar = getToolbar( page );
		await toolbar
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();
		await toolbar
			.getByRole( 'button', { name: 'Style', exact: true } )
			.click();

		const menuGroup = ( name ) =>
			page.locator( '.components-menu-group', {
				has: page.getByText( name, { exact: true } ),
			} );

		await expect(
			menuGroup( 'Display' ).getByRole( 'menuitemradio', {
				name: 'Heading 2',
			} )
		).toBeVisible();
		await expect(
			menuGroup( 'Body' ).getByRole( 'menuitemradio', {
				name: 'Paragraph',
			} )
		).toBeVisible();
	} );

	test( 'a font is saved as a preset on the block', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Writing' },
		} );

		const toolbar = getToolbar( page );
		await toolbar
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();
		await toolbar
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
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();

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

	test( 'goes back to designing when another block is selected', async ( {
		editor,
		page,
	} ) => {
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'First' },
		} );
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: { content: 'Second' },
		} );

		const toolbar = getToolbar( page );
		await toolbar
			.getByRole( 'button', { name: 'Write', exact: true } )
			.click();
		await expect(
			toolbar.getByRole( 'button', { name: 'Style', exact: true } )
		).toBeVisible();

		await editor.selectBlocks(
			editor.canvas
				.getByRole( 'document', { name: 'Block: Paragraph' } )
				.first()
		);

		await expect(
			toolbar.getByRole( 'button', { name: 'Write', exact: true } )
		).toHaveAttribute( 'aria-pressed', 'false' );
		await expect(
			toolbar.getByRole( 'button', { name: 'Style', exact: true } )
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
				name: 'Write',
				exact: true,
			} )
		).toBeHidden();

		await requestUtils.setGutenbergExperiments( [
			'gutenberg-writing-toolbar',
		] );
	} );
} );
