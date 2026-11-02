const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Font Library', () => {
	test.describe( 'When a blank theme is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'emptytheme' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'emptytheme//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'should display the "no font installed." message', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Add fonts',
				} )
				.click();
			await page.getByRole( 'tab', { name: 'Library' } ).click();
			await expect(
				page.getByLabel( 'library' ).getByText( 'No fonts installed.' )
			).toBeVisible();
		} );

		test( 'should display the "Manage fonts" icon', async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );
	} );

	test.describe( 'When a theme with bundled fonts is active', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentythree' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'twentytwentythree//index',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'should display the "Manage fonts" icon', async ( { page } ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			const manageFontsIcon = page.getByRole( 'button', {
				name: 'Manage fonts',
			} );
			await expect( manageFontsIcon ).toBeVisible();
		} );

		test( 'should open the "Manage fonts" modal when clicking the "Manage fonts" icon', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Manage fonts',
				} )
				.click();
			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts', exact: true } )
			).toBeVisible();
		} );

		test( 'keeps Category and Search fields stable when switching categories', async ( {
			admin,
			page,
		} ) => {
			const categories = [
				{ slug: 'serif', name: 'Serif' },
				{
					slug: 'sans-serif',
					name: 'Serifenlose Schriftarten mit einer langen Bezeichnung',
				},
				{ slug: 'display', name: 'خطوط العرض ذات الاسم الطويل جدًا' },
			];
			const collection = {
				slug: 'google-fonts',
				name: 'Google Fonts',
				description: '',
				categories,
				font_families: [],
			};
			await page.route( '**/wp/v2/font-collections**', ( route ) =>
				route.fulfill( {
					json: new URL( route.request().url() ).pathname.endsWith(
						'/google-fonts'
					)
						? collection
						: [ collection ],
				} )
			);

			await page.evaluate( () => {
				window.localStorage.setItem(
					'wp-font-library-google-fonts-permission',
					'true'
				);
			} );

			const dialog = page.getByRole( 'dialog', { name: 'Fonts' } );
			const category = dialog.getByRole( 'combobox', {
				name: 'Category',
			} );
			const search = dialog.getByRole( 'searchbox', { name: 'Search' } );

			for ( const width of [ 1280, 390, 320 ] ) {
				await page.setViewportSize( { width, height: 900 } );
				await admin.visitSiteEditor();
				const stylesUrl = new URL( page.url() );
				stylesUrl.searchParams.set( 'p', '/styles' );
				await page.goto( stylesUrl.href );
				await page
					.getByRole( 'button', { name: 'Typography' } )
					.click();
				await page
					.getByRole( 'button', { name: 'Manage fonts' } )
					.click();
				await page
					.getByRole( 'tab', { name: 'Install Fonts' } )
					.click();

				for ( const direction of [ 'ltr', 'rtl' ] ) {
					await page.evaluate( ( dir ) => {
						document.documentElement.dir = dir;
					}, direction );
					await expect( category ).toBeVisible();
					await expect( search ).toBeVisible();
					const categoryBounds = await category.boundingBox();
					const searchBounds = await search.boundingBox();
					for ( const bounds of [ categoryBounds, searchBounds ] ) {
						expect( bounds.x ).toBeGreaterThanOrEqual( 0 );
						expect( bounds.x + bounds.width ).toBeLessThanOrEqual(
							width
						);
					}

					for ( const { name } of [
						...categories,
						{ name: 'All' },
					] ) {
						await category.focus();
						await page.keyboard.press( 'Space' );
						await page
							.getByRole( 'option', { name, exact: true } )
							.click();
						await expect( category ).toHaveText( name );
						expect( await category.boundingBox() ).toEqual(
							categoryBounds
						);
						expect( await search.boundingBox() ).toEqual(
							searchBounds
						);
					}
				}
			}
		} );

		test( 'should show font variant panel when clicking on a font family', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();
			await page.getByRole( 'button', { name: 'Typography' } ).click();
			await page
				.getByRole( 'button', {
					name: 'Manage fonts',
				} )
				.click();
			await page.getByRole( 'button', { name: 'System Font' } ).click();
			await expect(
				page.getByRole( 'heading', { name: 'System Font' } )
			).toBeVisible();
			await expect(
				page.getByRole( 'checkbox', { name: 'System Font Normal' } )
			).toBeVisible();
		} );
	} );

	test.describe( 'When switching Theme Style variations', () => {
		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.activateTheme( 'twentytwentyfour' );
		} );

		test.beforeEach( async ( { admin } ) => {
			await admin.visitSiteEditor( {
				postId: 'twentytwentyfour//home',
				postType: 'wp_template',
				canvas: 'edit',
			} );
		} );

		test( 'clicking on a font in the global styles sidebar should activate the font in the overlay when switching Theme Style variation', async ( {
			page,
		} ) => {
			await page
				.getByRole( 'region', { name: 'Editor top bar' } )
				.getByRole( 'button', { name: 'Styles' } )
				.click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			// Activate "Ember" Theme Variation.
			await page.getByRole( 'button', { name: 'Ember' } ).click();

			// Click "Back" button
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			await page.getByRole( 'button', { name: 'Typography' } ).click();

			// Click "Jost 2 variants" button
			await page
				.getByRole( 'button', { name: 'Jost 2 variants' } )
				.click();

			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts' } )
			).toBeVisible();

			// Check correct font is displayed in Font Library
			await expect(
				page.getByRole( 'heading', { name: 'Jost' } )
			).toBeVisible();

			// Close the Font Library dialog
			await page.getByRole( 'button', { name: 'Close' } ).click();

			// Click "Back"
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			// Click "Browse styles"
			await page.getByRole( 'button', { name: 'Browse styles' } ).click();

			// Activate "Maelstrom" Theme Variation.
			await page.getByRole( 'button', { name: 'Maelstrom' } ).click();

			// Click "Back" button
			await page
				.getByRole( 'region', { name: 'Editor settings' } )
				.getByRole( 'button', { name: 'Back', exact: true } )
				.click();

			await page.getByRole( 'button', { name: 'Typography' } ).click();

			// Click Cardo font-family.
			await page
				.getByRole( 'button', { name: 'Cardo 3 variants' } )
				.click();

			await expect( page.getByRole( 'dialog' ) ).toBeVisible();
			await expect(
				page.getByRole( 'heading', { name: 'Fonts' } )
			).toBeVisible();

			// Check correct font is displayed in Font Library
			await expect(
				page.getByRole( 'heading', { name: 'Cardo' } )
			).toBeVisible();
		} );
	} );
} );
