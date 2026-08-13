const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

// Applied style values must stay removable when the theme disables their
// controls: the value predates the restriction or came with pasted or
// declared content, and without a way to reset it it can never be removed.

// Turns editor settings off the way a theme would through theme.json
// settings. Plain objects merge one level at a time; an empty object or any
// other value replaces what the settings held.
const disableFeatures = async ( page, overrides ) => {
	await page.evaluate( ( overridesArg ) => {
		const merge = ( base, extra ) => {
			const merged = { ...base };
			for ( const [ key, value ] of Object.entries( extra ) ) {
				merged[ key ] =
					value &&
					typeof value === 'object' &&
					! Array.isArray( value ) &&
					Object.keys( value ).length
						? merge( base?.[ key ] ?? {}, value )
						: value;
			}
			return merged;
		};
		const { getSettings } = window.wp.data.select( 'core/block-editor' );
		const features = getSettings().__experimentalFeatures ?? {};
		window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
			__experimentalFeatures: merge( features, overridesArg ),
		} );
	}, overrides );
};

const inspectorRow = ( page, valueText ) =>
	page
		.locator( '.block-editor-block-inspector .components-tools-panel-item' )
		.filter( {
			has: page.locator( 'code', { hasText: valueText } ),
		} );

test.describe( 'Typography values whose controls the theme disables', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Styled',
				fontSize: 'large',
				style: {
					typography: { textAlign: 'center', letterSpacing: '2px' },
				},
			},
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		// Disable font sizes, letter spacing and text alignment, as a theme
		// would through theme.json settings.
		await disableFeatures( page, {
			typography: {
				defaultFontSizes: false,
				fontSizes: {},
				customFontSize: false,
				letterSpacing: false,
				textAlign: false,
			},
		} );
	} );

	test( 'resets each value independently from its panel row', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();

		const inspector = page.locator( '.block-editor-block-inspector' );
		const notice = inspector.locator( '.components-notice' );
		await expect( notice ).toContainText(
			'Some controls are disabled in this theme'
		);

		// Each value keeps its own row: the applied value in a code
		// element next to a Reset button.
		const sizeRow = inspectorRow( page, 'large' );
		const spacingRow = inspectorRow( page, '2px' );
		await expect( sizeRow.locator( 'code' ) ).toHaveText( 'large' );
		await expect( spacingRow.locator( 'code' ) ).toHaveText( '2px' );

		await sizeRow.getByRole( 'button', { name: 'Reset' } ).click();

		// Resetting one value leaves the others in place.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Styled',
					style: {
						typography: {
							textAlign: 'center',
							letterSpacing: '2px',
						},
					},
				},
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.fontSize
				)
			)
			.toBeUndefined();
		await expect( sizeRow ).toBeHidden();

		await spacingRow.getByRole( 'button', { name: 'Reset' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Styled',
					style: { typography: { textAlign: 'center' } },
				},
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.style?.typography
							?.letterSpacing
				)
			)
			.toBeUndefined();
		// The text alignment value remains, so the notice stays.
		await expect( notice ).toBeVisible();
	} );

	test( 'clears an applied text alignment from the reduced control', async ( {
		editor,
		page,
	} ) => {
		await editor.showBlockToolbar();
		await page.locator( 'role=button[name="Align text"]' ).click();

		// Only the active alignment is offered: the value can be removed,
		// not changed.
		const options = page.locator( 'role=menuitemradio' );
		await expect( options ).toHaveCount( 1 );
		await options.click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Styled', fontSize: 'large' },
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.style?.typography
							?.textAlign
				)
			)
			.toBeUndefined();

		// With the value gone, the control leaves the toolbar.
		await editor.showBlockToolbar();
		await expect(
			page.locator( 'role=button[name="Align text"]' )
		).toBeHidden();
	} );
} );

test.describe( 'Color values whose controls the theme disables', () => {
	test( 'keeps a text color preset removable', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Colored',
				textColor: 'vivid-red',
			},
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		await disableFeatures( page, {
			color: { text: false },
		} );

		await editor.openDocumentSettingsSidebar();

		const inspector = page.locator( '.block-editor-block-inspector' );
		await expect( inspector.locator( '.components-notice' ) ).toContainText(
			'Some controls are disabled in this theme'
		);

		const colorRow = inspectorRow( page, 'vivid-red' );
		await expect( colorRow.locator( 'code' ) ).toHaveText( 'vivid-red' );

		await colorRow.getByRole( 'button', { name: 'Reset' } ).click();

		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: { content: 'Colored' },
			},
		] );
		await expect
			.poll( () =>
				page.evaluate( () => {
					const { textColor, style } = window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes;
					return textColor ?? style?.color?.text;
				} )
			)
			.toBeUndefined();
		await expect( inspector.locator( '.components-notice' ) ).toBeHidden();
	} );
} );

test.describe( 'Background values whose controls the theme disables', () => {
	test( 'resets the image and the color independently', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/group',
			attributes: {
				backgroundColor: 'vivid-red',
				style: {
					background: {
						backgroundImage: {
							url: 'https://example.com/images/sunset.png',
						},
					},
				},
				layout: { type: 'constrained' },
			},
			innerBlocks: [
				{
					name: 'core/paragraph',
					attributes: { content: 'Inside' },
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.locator( '[data-type="core/group"]' )
		);
		await disableFeatures( page, {
			background: { backgroundImage: false },
			color: { background: false },
		} );

		await editor.openDocumentSettingsSidebar();

		const inspector = page.locator( '.block-editor-block-inspector' );
		await expect( inspector.locator( '.components-notice' ) ).toContainText(
			'Some controls are disabled in this theme'
		);

		// The image row shows the file name; the color row the preset slug.
		const imageRow = inspectorRow( page, 'sunset.png' );
		const colorRow = inspectorRow( page, 'vivid-red' );
		await expect( imageRow.locator( 'code' ) ).toHaveText( 'sunset.png' );
		await expect( colorRow.locator( 'code' ) ).toHaveText( 'vivid-red' );

		await imageRow.getByRole( 'button', { name: 'Reset' } ).click();

		// Resetting the image leaves the color in place.
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.style?.background
							?.backgroundImage
				)
			)
			.toBeUndefined();
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.backgroundColor
				)
			)
			.toBe( 'vivid-red' );
		await expect( imageRow ).toBeHidden();

		await colorRow.getByRole( 'button', { name: 'Reset' } ).click();

		await expect
			.poll( () =>
				page.evaluate( () => {
					const { backgroundColor, style } = window.wp.data
						.select( 'core/block-editor' )
						.getBlocks()[ 0 ].attributes;
					return backgroundColor ?? style?.color?.background;
				} )
			)
			.toBeUndefined();
		await expect( inspector.locator( '.components-notice' ) ).toBeHidden();
	} );
} );

test.describe( 'Spacing values whose controls the theme disables', () => {
	test( 'resets the padding independently from the margin', async ( {
		admin,
		editor,
		page,
	} ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/paragraph',
			attributes: {
				content: 'Spaced',
				style: {
					spacing: {
						padding: {
							top: '10px',
							right: '20px',
							bottom: '10px',
							left: '20px',
						},
						margin: { top: '5px', bottom: '5px' },
					},
				},
			},
		} );
		await editor.canvas.locator( '[data-type="core/paragraph"]' ).click();
		await disableFeatures( page, {
			spacing: { padding: false, margin: false },
		} );

		await editor.openDocumentSettingsSidebar();

		const inspector = page.locator( '.block-editor-block-inspector' );
		await expect( inspector.locator( '.components-notice' ) ).toContainText(
			'Some controls are disabled in this theme'
		);

		// The padding row shows the shorthand-style summary.
		const paddingRow = inspectorRow( page, '10px 20px' );
		const marginRow = inspectorRow( page, '5px 5px' );
		await expect( paddingRow.locator( 'code' ) ).toHaveText( '10px 20px' );
		await expect( marginRow.locator( 'code' ) ).toHaveText( '5px 5px' );

		await paddingRow.getByRole( 'button', { name: 'Reset' } ).click();

		// Resetting the padding leaves the margin in place.
		await expect.poll( editor.getBlocks ).toMatchObject( [
			{
				name: 'core/paragraph',
				attributes: {
					content: 'Spaced',
					style: {
						spacing: {
							margin: { top: '5px', bottom: '5px' },
						},
					},
				},
			},
		] );
		await expect
			.poll( () =>
				page.evaluate(
					() =>
						window.wp.data
							.select( 'core/block-editor' )
							.getBlocks()[ 0 ].attributes.style?.spacing?.padding
				)
			)
			.toBeUndefined();
		await expect( paddingRow ).toBeHidden();
		await expect( marginRow ).toBeVisible();
	} );
} );
