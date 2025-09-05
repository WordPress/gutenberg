/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
/**
 * External dependencies
 */
const path = require( 'path' );

const createPages = async ( requestUtils ) => {
	await requestUtils.createPage( {
		title: 'Privacy Policy',
		status: 'publish',
	} );
	await requestUtils.createPage( {
		title: 'Sample Page',
		status: 'publish',
	} );
};

test.describe( 'Page List', () => {
	test.beforeAll( async ( { requestUtils } ) => {
		// Activate a theme with permissions to access the site editor.
		await requestUtils.activateTheme( 'emptytheme' );
		await createPages( requestUtils );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Go back to the default theme.
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
		] );
	} );

	test.beforeEach( async ( { admin, page } ) => {
		// Go to the pages page, as it has the list layout enabled by default.
		await admin.visitSiteEditor();
		await page.getByRole( 'button', { name: 'Pages' } ).click();
	} );

	test( 'Persists filter/search when switching layout', async ( {
		page,
	} ) => {
		// Search pages
		await page
			.getByRole( 'searchbox', { name: 'Search' } )
			.fill( 'Privacy' );

		// Switch layout
		await page.getByRole( 'button', { name: 'Layout' } ).click();
		await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

		// Confirm the table is visible
		await expect( page.getByRole( 'table' ) ).toContainText(
			'Privacy Policy'
		);

		// The search should still contain the search term
		await expect(
			page.getByRole( 'searchbox', { name: 'Search' } )
		).toHaveValue( 'Privacy' );
	} );

	test.describe( 'Quick Edit Mode', () => {
		const fields = {
			featuredImage: {
				performEdit: async ( page ) => {
					const placeholder = page.getByRole( 'button', {
						name: 'Choose an image…',
					} );
					await placeholder.click();
					const mediaLibrary = page.getByRole( 'dialog' );
					const TEST_IMAGE_FILE_PATH = path.resolve(
						__dirname,
						'../../assets/10x10_e2e_test_image_z9T8jK.png'
					);

					const fileChooserPromise =
						page.waitForEvent( 'filechooser' );
					await mediaLibrary.getByText( 'Select files' ).click();
					const fileChooser = await fileChooserPromise;
					await fileChooser.setFiles( TEST_IMAGE_FILE_PATH );
					await mediaLibrary
						.locator( '.media-frame-toolbar' )
						.waitFor( {
							state: 'hidden',
						} );

					await mediaLibrary
						.getByRole( 'button', { name: 'Select', exact: true } )
						.click();
				},
				assertInitialState: async ( page ) => {
					const el = page.getByText( 'Choose an image…' );
					const placeholder = page.getByRole( 'button', {
						name: 'Choose an image…',
					} );
					await expect( el ).toBeVisible();
					await expect( placeholder ).toBeVisible();
				},
				assertEditedState: async ( page ) => {
					const placeholder = page.getByRole( 'button', {
						name: 'Choose an image…',
					} );
					await expect( placeholder ).toBeHidden();
					const img = page.locator(
						'.fields-controls__featured-image-image'
					);
					await expect( img ).toBeVisible();
				},
			},
			statusVisibility: {
				performEdit: async ( page ) => {
					const statusAndVisibility = page.getByLabel(
						'Status & Visibility'
					);
					await statusAndVisibility.click();
					const options = [
						'Published',
						'Draft',
						'Pending Review',
						'Private',
					];

					for ( const option of options ) {
						await page
							.getByRole( 'radio', { name: option } )
							.click();
						await expect( statusAndVisibility ).toContainText(
							option
						);

						if ( option !== 'Private' ) {
							await page
								.getByRole( 'checkbox', {
									name: 'Password protected',
								} )
								.check();
						}
					}
				},
				assertInitialState: async ( page ) => {
					const statusAndVisibility = page.getByLabel(
						'Status & Visibility'
					);
					await expect( statusAndVisibility ).toContainText(
						'Published'
					);
				},
				assertEditedState: async ( page ) => {
					const statusAndVisibility = page.getByLabel(
						'Status & Visibility'
					);
					await expect( statusAndVisibility ).toContainText(
						'Private'
					);
				},
			},
			author: {
				assertInitialState: async ( page ) => {
					const author = page.getByLabel( 'Author' );
					await expect( author ).toContainText( 'admin' );
				},
				performEdit: async ( page ) => {
					const author = page.getByLabel( 'Author' );
					await author.click();
					const selectElement = page.locator(
						'select:has(option[value="1"])'
					);
					await selectElement.selectOption( { value: '1' } );
				},
				assertEditedState: async () => {},
			},
			date: {
				assertInitialState: async ( page ) => {
					const dateEl = page.getByLabel( 'Edit Date' );
					const date = new Date();
					const yy = String( date.getFullYear() );

					await expect( dateEl ).toContainText( yy );
				},
				performEdit: async ( page ) => {
					const dateEl = page.getByLabel( 'Edit Date' );
					await dateEl.click();
					const date = new Date();
					const yy = Number( date.getFullYear() );
					const yyEl = page.locator(
						`input[type="number"][value="${ yy }"]`
					);

					await yyEl.focus();
					await page.keyboard.press( 'ArrowUp' );
				},
				assertEditedState: async ( page ) => {
					const date = new Date();
					const yy = Number( date.getFullYear() );
					const dateEl = page.getByLabel( 'Edit Date' );
					await expect( dateEl ).toContainText( String( yy + 1 ) );
				},
			},
			slug: {
				assertInitialState: async ( page ) => {
					const slug = page.getByLabel( 'Edit Slug' );
					await expect( slug ).toContainText( 'privacy-policy' );
				},
				performEdit: async ( page ) => {
					const slug = page.getByLabel( 'Edit Slug' );
					await slug.click();
					await expect(
						page.getByRole( 'link', {
							name: 'http://localhost:8889/?',
						} )
					).toBeVisible();
				},
				assertEditedState: async () => {},
			},
			parent: {
				assertInitialState: async ( page ) => {
					const parent = page.getByLabel( 'Edit Parent' );
					await expect( parent ).toContainText( 'None' );
				},
				performEdit: async ( page ) => {
					const parent = page.getByLabel( 'Edit Parent' );
					await parent.click();
					await page
						.getByLabel( 'Parent', { exact: true } )
						.fill( 'Sample' );

					await page
						.getByRole( 'option', { name: 'Sample Page' } )
						.click();
				},
				assertEditedState: async ( page ) => {
					const parent = page.getByLabel( 'Edit Parent' );
					await expect( parent ).toContainText( 'Sample Page' );
				},
			},
			// TODO: Wrap up this test once https://github.com/WordPress/gutenberg/issues/68173 is fixed
			// template: {
			// 	assertInitialState: async ( page ) => {
			// 		const template = page.getByRole( 'button', {
			// 			name: 'Single Entries',
			// 		} );
			// 		await expect( template ).toContainText( 'Single Entries' );
			// 	},
			// 	edit: async ( page ) => {
			// 		const template = page.getByRole( 'button', {
			// 			name: 'Single Entries',
			// 		} );
			// 		await template.click();
			// 		await page
			// 			.getByRole( 'menuitem', { name: 'Swap template' } )
			// 			.click();
			// 	},
			// 	assertEditedState: async ( page ) => {
			//
			// 	},
			// },
			discussion: {
				assertInitialState: async ( page ) => {
					const discussion = page.getByLabel( 'Edit Discussion' );
					await expect( discussion ).toContainText( 'Closed' );
				},
				performEdit: async ( page ) => {
					const discussion = page.getByLabel( 'Edit Discussion' );
					await discussion.click();
					await page
						.getByLabel( 'Open', {
							exact: true,
						} )
						.check();
				},
				assertEditedState: async ( page ) => {
					const discussion = page.getByLabel( 'Edit Discussion' );
					await expect( discussion ).toContainText( 'Open' );
				},
			},
		};

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.setGutenbergExperiments( [
				'gutenberg-quick-edit-dataviews',
			] );
		} );

		test.beforeEach( async ( { admin, page } ) => {
			await admin.visitSiteEditor();
			await page.getByRole( 'button', { name: 'Pages' } ).click();
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();
			const privacyPolicyCheckbox = page.getByRole( 'checkbox', {
				name: 'Privacy Policy',
			} );

			await privacyPolicyCheckbox.check();

			await page.getByRole( 'button', { name: 'Details' } ).click();
		} );

		Object.entries( fields ).forEach(
			( [
				key,
				{ performEdit, assertInitialState, assertEditedState },
			] ) => {
				// Asserts are done in the individual functions
				// eslint-disable-next-line playwright/expect-expect
				test( `should initialize, edit, and update ${ key } field correctly`, async ( {
					page,
				} ) => {
					await assertInitialState( page );
					await performEdit( page );
					await assertEditedState( page );
				} );
			}
		);

		test( 'should save multiple field changes and update Data Views UI', async ( {
			page,
			requestUtils,
		} ) => {
			const selectedItem = page.locator( '.is-selected' );
			const imagePlaceholder = selectedItem.locator(
				'.fields-controls__featured-image-placeholder'
			);
			const status = selectedItem.getByRole( 'cell', {
				name: 'Published',
			} );
			await expect( status ).toBeVisible();

			const { featuredImage, statusVisibility } = fields;
			await statusVisibility.performEdit( page );
			await featuredImage.performEdit( page );
			// Ensure that no dropdown is open
			await page.getByRole( 'button', { name: 'Close' } ).click();
			const saveButton = page.getByLabel( 'Review 1 change…' );
			await saveButton.click();
			await page.getByRole( 'button', { name: 'Save' } ).click();
			const updatedStatus = selectedItem.getByRole( 'cell', {
				name: 'Private',
			} );
			await expect( imagePlaceholder ).toBeHidden();
			await expect( updatedStatus ).toBeVisible();

			// Reset the page to its original state
			await requestUtils.deleteAllPages();
			await createPages( requestUtils );
		} );

		// TODO: Wrap up this test once https://github.com/WordPress/gutenberg/pull/67584 is merged
		// test( 'should update pages according to the changes', async ( {
		// 	page,
		// } ) => {
		// 	const samplePage = page.getByRole( 'checkbox', {
		// 		name: 'Sample Page',
		// 	} );

		// 	await samplePage.check();

		// 	const table = page.getByRole( 'table' );

		// 	const selectedItems = table.locator( '.is-selected', {
		// 		strict: false,
		// 	} );

		// 	expect( await selectedItems.all() ).toHaveLength( 2 );

		// 	const imagePlaceholders = selectedItems.locator(
		// 		'.fields-controls__featured-image-placeholder',
		// 		{ strict: false }
		// 	);

		// 	for ( const imagePlaceholder of await imagePlaceholders.all() ) {
		// 		await expect( imagePlaceholder ).toBeVisible();
		// 	}

		// 	const statuses = selectedItems.getByRole( 'cell', {
		// 		name: 'Public',
		// 	} );

		// 	for ( const status of await statuses.all() ) {
		// 		await expect( status ).toBeVisible();
		// 	}

		// 	const { featuredImage, statusVisibility } = fields;
		// 	await statusVisibility.edit( page );
		// 	await featuredImage.edit( page );
		// 	// Ensure that no dropdown is open
		// 	await page.getByRole( 'button', { name: 'Close' } ).click();
		// 	const saveButton = page.getByLabel( 'Review 1 change…' );
		// 	await saveButton.click();
		// 	await page.getByRole( 'button', { name: 'Save' } ).click();
		// 	const updatedStatus = selectedItems.getByRole(
		// 		'cell',
		// 		{
		// 			name: 'Private',
		// 		},
		// 		{
		// 			strict: false,
		// 		}
		// 	);

		// 	for ( const imagePlaceholder of await imagePlaceholders.all() ) {
		// 		await expect( imagePlaceholder ).toBeHidden();
		// 	}

		// 	for ( const status of await updatedStatus.all() ) {
		// 		await expect( status ).toBeVisible();
		// 	}
		// } );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.setGutenbergExperiments( [] );
		} );
	} );
} );
