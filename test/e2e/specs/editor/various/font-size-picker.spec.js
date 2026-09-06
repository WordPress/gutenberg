const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Size Picker', () => {
	test.beforeEach( async ( { admin } ) => {
		await admin.createNewPost();
	} );

	test.afterEach( async ( { page } ) => {
		const closeButton = page.locator(
			'role=region[name="Editor settings"i] >> role=button[name^="Close settings"i]'
		);

		if ( await closeButton.isVisible() ) {
			await closeButton.click();
		}
	} );

	test.describe( 'Common', () => {
		test( 'should apply a custom font size using the font size input', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type( 'Paragraph to be made "small"' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Set custom size' } )
				.click();
			await page.getByRole( 'spinbutton', { name: 'Font size' } ).click();

			await page.keyboard.type( '23' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"style":{"typography":{"fontSize":"23px"}}} -->
<p style="font-size:23px">Paragraph to be made "small"</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'should reset a custom font size using input field', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type( 'Paragraph reset - custom size' );
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Set custom size' } )
				.click();
			await page.getByRole( 'spinbutton', { name: 'Font size' } ).click();
			await page.keyboard.type( '23' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"style":{"typography":{"fontSize":"23px"}}} -->
<p style="font-size:23px">Paragraph reset - custom size</p>
<!-- /wp:paragraph -->` );

			await pageUtils.pressKeys( 'Backspace', { times: 2 } );
			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph -->
<p>Paragraph reset - custom size</p>
<!-- /wp:paragraph -->` );
		} );
	} );

	test.describe( 'More font sizes', () => {
		test.beforeEach( async ( { page } ) => {
			await page.evaluate( () => {
				// set a deep `path[]` property in object `obj` to `value`, immutably
				function setDeep( obj, path, value ) {
					function doSet( o, i ) {
						if ( i < path.length ) {
							const key = path[ i ];
							return { ...o, [ key ]: doSet( o[ key ], i + 1 ) };
						}
						return value;
					}
					return doSet( obj, 0 );
				}

				window.wp.data.dispatch( 'core/editor' ).updateEditorSettings(
					setDeep(
						window.wp.data
							.select( 'core/editor' )
							.getEditorSettings(),
						[
							'__experimentalFeatures',
							'typography',
							'fontSizes',
							'default',
						],
						[
							{
								name: 'Tiny',
								slug: 'tiny',
								size: '11px',
							},
							{
								name: 'Small',
								slug: 'small',
								size: '13px',
							},
							{
								name: 'Medium',
								slug: 'medium',
								size: '20px',
							},
							{
								name: 'Large',
								slug: 'large',
								size: '36px',
							},
							{
								name: 'Extra Large',
								slug: 'x-large',
								size: '42px',
							},
							{
								name: 'Huge',
								slug: 'huge',
								size: '48px',
							},
						]
					)
				);
			} );
		} );

		test( 'should apply a named font size using the font size buttons', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type( 'Paragraph to be made "large"' );
			await page
				.getByRole( 'group', { name: 'Font size' } )
				.getByRole( 'combobox', { name: 'Font size' } )
				.click();
			await pageUtils.pressKeys( 'ArrowDown', { times: 4 } );
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Paragraph to be made "large"</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'should reset a named font size using the tools panel menu', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type(
				'Paragraph with font size reset using tools panel menu'
			);
			await page
				.getByRole( 'group', { name: 'Font size' } )
				.getByRole( 'combobox', { name: 'Font size' } )
				.click();
			await pageUtils.pressKeys( 'ArrowDown', { times: 3 } );
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"medium"} -->
<p class="has-medium-font-size">Paragraph with font size reset using tools panel menu</p>
<!-- /wp:paragraph -->` );

			await page
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Reset Size' } ).click();
			await page.keyboard.press( 'Escape' ); // Close the menu

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph -->
<p>Paragraph with font size reset using tools panel menu</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'should reset a named font size using input field', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type(
				'Paragraph with font size reset using input field'
			);
			await page
				.getByRole( 'group', { name: 'Font size' } )
				.getByRole( 'combobox', { name: 'Font size' } )
				.click();
			await pageUtils.pressKeys( 'ArrowDown', { times: 2 } );
			await page.keyboard.press( 'Enter' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">Paragraph with font size reset using input field</p>
<!-- /wp:paragraph -->` );

			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Set custom size' } )
				.click();
			await page.getByRole( 'spinbutton', { name: 'Font size' } ).click();
			await pageUtils.pressKeys( 'primary+A' );
			await page.keyboard.press( 'Backspace' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph -->
<p>Paragraph with font size reset using input field</p>
<!-- /wp:paragraph -->` );
		} );
	} );

	test.describe( 'Few font sizes', () => {
		test( 'should apply a named font size using the font size buttons', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type( 'Paragraph to be made "large"' );
			await page
				.getByRole( 'radiogroup', { name: 'Font size' } )
				.getByRole( 'radio', { name: 'Large', exact: true } )
				.click();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"large"} -->
<p class="has-large-font-size">Paragraph to be made "large"</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'should reset a named font size using the tools panel menu', async ( {
			editor,
			page,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type(
				'Paragraph with font size reset using tools panel menu'
			);
			await page
				.getByRole( 'radiogroup', { name: 'Font size' } )
				.getByRole( 'radio', { name: 'Small' } )
				.click();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">Paragraph with font size reset using tools panel menu</p>
<!-- /wp:paragraph -->` );

			await page
				.getByRole( 'button', { name: 'Typography options' } )
				.click();
			await page.getByRole( 'menuitem', { name: 'Reset Size' } ).click();
			await page.keyboard.press( 'Escape' ); // Close the menu

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph -->
<p>Paragraph with font size reset using tools panel menu</p>
<!-- /wp:paragraph -->` );
		} );

		test( 'should reset a named font size using input field', async ( {
			editor,
			page,
			pageUtils,
		} ) => {
			await editor.openDocumentSettingsSidebar();
			await editor.canvas
				.locator( 'role=document[name="Add default block"i]' )
				.click();
			await page.keyboard.type(
				'Paragraph with font size reset using input field'
			);
			await page
				.getByRole( 'radiogroup', { name: 'Font size' } )
				.getByRole( 'radio', { name: 'Small' } )
				.click();

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph {"fontSize":"small"} -->
<p class="has-small-font-size">Paragraph with font size reset using input field</p>
<!-- /wp:paragraph -->` );

			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Set custom size' } )
				.click();
			await page.getByRole( 'spinbutton', { name: 'Font size' } ).click();
			await pageUtils.pressKeys( 'primary+A' );
			await page.keyboard.press( 'Backspace' );

			await expect.poll( editor.getEditedPostContent )
				.toBe( `<!-- wp:paragraph -->
<p>Paragraph with font size reset using input field</p>
<!-- /wp:paragraph -->` );
		} );
	} );
} );
