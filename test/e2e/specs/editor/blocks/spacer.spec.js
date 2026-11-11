const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Spacer', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test( 'can be created by typing "/spacer"', async ( { editor, page } ) => {
		// Create a spacer with the slash block shortcut.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/spacer' );
		await expect(
			page.getByRole( 'option', { name: 'Spacer' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();
	} );

	test( 'can be resized using the drag handle and remains selected after being dragged', async ( {
		page,
		editor,
	} ) => {
		// Create a spacer with the slash block shortcut.
		await editor.canvas
			.locator( 'role=document[name="Add default block"i]' )
			.click();
		await page.keyboard.type( '/spacer' );
		await expect(
			page.getByRole( 'option', { name: 'Spacer' } )
		).toBeVisible();
		await page.keyboard.press( 'Enter' );

		const resizableHandle = editor.canvas.locator(
			// Use class name selector until we have `data-testid` for the resize handles.
			'role=document[name="Block: Spacer"i] >> css=.components-resizable-box__handle'
		);
		const elementPoint = await resizableHandle.boundingBox();
		await page.mouse.move( elementPoint.x, elementPoint.y );
		await page.mouse.down();
		await page.mouse.move( elementPoint.x + 0, elementPoint.y + 50 );
		await page.mouse.up();

		expect( await editor.getEditedPostContent() ).toMatchSnapshot();

		await expect(
			editor.canvas.locator(
				'role=document[name="Block: Spacer"i] >> css=.components-resizable-box__handle >> [tabindex]'
			)
		).toBeFocused();
	} );

	for ( const orientation of [ 'vertical', 'horizontal' ] ) {
		test( `respects custom spacing restrictions for a ${ orientation } spacer`, async ( {
			editor,
			page,
		} ) => {
			const originalDisableCustomSpacingSizes = await page.evaluate(
				() =>
					window.wp.data.select( 'core/block-editor' ).getSettings()
						.disableCustomSpacingSizes
			);
			const isHorizontal = orientation === 'horizontal';
			const dimension = isHorizontal ? 'width' : 'height';
			let selectedPreset = 'var:preset|spacing|40';
			const spacerAttributes = isHorizontal
				? {
						width: selectedPreset,
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: 'var(--wp--preset--spacing--40)',
							},
						},
					}
				: { height: selectedPreset };
			const spacerBlock = {
				name: 'core/spacer',
				attributes: spacerAttributes,
			};
			const getSpacerAttributes = async () => {
				const [ block ] = await editor.getBlocks();
				return ( isHorizontal ? block.innerBlocks[ 0 ] : block )
					.attributes;
			};
			const setCustomSpacingDisabled = ( disabled ) =>
				page.evaluate( ( disableCustomSpacingSizes ) => {
					window.wp.data
						.dispatch( 'core/block-editor' )
						.updateSettings( { disableCustomSpacingSizes } );
				}, disabled );

			try {
				await setCustomSpacingDisabled( true );
				await editor.insertBlock(
					isHorizontal
						? {
								name: 'core/group',
								attributes: {
									layout: {
										type: 'flex',
										orientation: 'horizontal',
									},
								},
								innerBlocks: [ spacerBlock ],
							}
						: spacerBlock
				);
				const spacer = editor.canvas.getByRole( 'document', {
					name: 'Block: Spacer',
					exact: true,
				} );
				const resizeHandle = spacer.locator(
					'.components-resizable-box__handle'
				);
				await spacer.click();
				await expect( resizeHandle ).toHaveCount( 0 );
				await expect
					.poll( getSpacerAttributes )
					.toMatchObject( spacerAttributes );

				if ( ! isHorizontal ) {
					await editor.openDocumentSettingsSidebar();
					await page
						.getByRole( 'slider', { name: 'Height', exact: true } )
						.press( 'ArrowRight' );
					selectedPreset = 'var:preset|spacing|50';
				}
				await expect.poll( getSpacerAttributes ).toMatchObject( {
					[ dimension ]: selectedPreset,
					...( isHorizontal && { style: spacerAttributes.style } ),
				} );

				await editor.saveDraft();
				await page.reload();
				await spacer.waitFor();
				await setCustomSpacingDisabled( true );
				await spacer.click();
				await expect( resizeHandle ).toHaveCount( 0 );
				await expect.poll( getSpacerAttributes ).toMatchObject( {
					[ dimension ]: selectedPreset,
					...( isHorizontal && { style: spacerAttributes.style } ),
				} );

				await setCustomSpacingDisabled( false );
				await expect( resizeHandle ).toBeVisible();
				const spacerBounds = await spacer.boundingBox();
				const handleBounds = await resizeHandle.boundingBox();
				const handleX = handleBounds.x + handleBounds.width / 2;
				const handleY = handleBounds.y + handleBounds.height / 2;
				await page.mouse.move( handleX, handleY );
				await page.mouse.down();
				await page.mouse.move(
					handleX + ( isHorizontal ? 50 : 0 ),
					handleY + ( isHorizontal ? 0 : 50 ),
					{ steps: 5 }
				);
				await page.mouse.up();
				await expect
					.poll(
						async () => ( await getSpacerAttributes() )[ dimension ]
					)
					.toMatch( /^\d+px$/ );
				const resizedAttributes = await getSpacerAttributes();
				expect(
					parseFloat( resizedAttributes[ dimension ] )
				).toBeGreaterThan( spacerBounds[ dimension ] );
				expect( resizedAttributes ).toMatchObject( {
					[ dimension ]: expect.stringMatching( /^\d+px$/ ),
					...( isHorizontal && {
						style: {
							layout: {
								selfStretch: 'fixed',
								flexSize: resizedAttributes.width,
							},
						},
					} ),
				} );
			} finally {
				await setCustomSpacingDisabled(
					originalDisableCustomSpacingSizes
				);
			}
		} );
	}

	test( 'should work in theme without spacing units support', async ( {
		editor,
		page,
	} ) => {
		await page.waitForFunction( () => window?.wp?.data );

		// Mock the theme.json data to simulate a theme without spacing units
		await page.evaluate( () => {
			const settings = window.wp.data
				.select( 'core/block-editor' )
				.getSettings();
			window.__originalSettings = settings;
			window.wp.data.dispatch( 'core/block-editor' ).updateSettings( {
				...settings,
				spacing: { units: false },
			} );
		} );

		await editor.insertBlock( { name: 'core/spacer' } );

		await expect(
			editor.canvas.locator( '.block-editor-warning' )
		).toBeHidden();
	} );
} );
