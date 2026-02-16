/**
 * External dependencies
 */
const path = require( 'path' );

/**
 * WordPress dependencies
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

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
		await requestUtils.deleteAllMedia();
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Go back to the default theme.
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMedia(),
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
						name: 'Choose file',
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
					const el = page.getByText( 'Choose file' );
					const placeholder = page.getByRole( 'button', {
						name: 'Choose file',
					} );
					await expect( el ).toBeVisible();
					await expect( placeholder ).toBeVisible();
				},
				assertEditedState: async ( page ) => {
					const placeholder = page.getByRole( 'button', {
						name: 'Choose file',
					} );
					await expect( placeholder ).toBeHidden();
					const img = page.locator( '.fields__media-edit-thumbnail' );
					await expect( img ).toBeVisible();
				},
			},
			statusVisibility: {
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Status & Visibility',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();
					const statusAndVisibility = editButton.locator( '..' );
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
					const statusAndVisibility = page
						.getByRole( 'button', {
							name: 'Edit Status & Visibility',
						} )
						.locator( '..' );
					await expect( statusAndVisibility ).toContainText(
						'Published'
					);
				},
				assertEditedState: async ( page ) => {
					const statusAndVisibility = page
						.getByRole( 'button', {
							name: 'Edit Status & Visibility',
						} )
						.locator( '..' );
					await expect( statusAndVisibility ).toContainText(
						'Private'
					);
				},
			},
			author: {
				assertInitialState: async ( page ) => {
					const author = page
						.getByRole( 'button', { name: 'Edit Author' } )
						.locator( '..' );
					await expect( author ).toContainText( 'admin' );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Author',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();
					const selectElement = page.locator(
						'select:has(option[value="1"])'
					);
					await selectElement.selectOption( {
						label: 'Test Author',
					} );
				},
				assertEditedState: async ( page ) => {
					const author = page
						.getByRole( 'button', { name: 'Edit Author' } )
						.locator( '..' );
					await expect( author ).toContainText( 'Test Author' );
				},
			},
			date: {
				assertInitialState: async ( page ) => {
					const dateEl = page
						.getByRole( 'button', { name: 'Edit Date' } )
						.locator( '..' );
					const date = new Date();
					const yy = String( date.getFullYear() );

					await expect( dateEl ).toContainText( yy );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Date',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();

					// Wait for the datetime control to appear
					const datetimeInput = page.locator(
						'input[type="datetime-local"]'
					);
					await datetimeInput.waitFor( { state: 'visible' } );

					// Get current datetime value and increment year
					const currentValue = await datetimeInput.inputValue();
					if ( currentValue ) {
						const currentDate = new Date( currentValue );
						const newDate = new Date( currentDate );
						newDate.setFullYear( currentDate.getFullYear() + 1 );

						// Format for datetime-local input (YYYY-MM-DDTHH:MM)
						const formattedDate = newDate
							.toISOString()
							.slice( 0, 16 );
						await datetimeInput.fill( formattedDate );
					}
				},
				assertEditedState: async ( page ) => {
					const date = new Date();
					const yy = Number( date.getFullYear() );
					const dateEl = page
						.getByRole( 'button', { name: 'Edit Date' } )
						.locator( '..' );
					await expect( dateEl ).toContainText( String( yy + 1 ) );
				},
			},
			slug: {
				assertInitialState: async ( page ) => {
					const slug = page
						.getByRole( 'button', { name: 'Edit Slug' } )
						.locator( '..' );
					await expect( slug ).toContainText( 'privacy-policy' );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Slug',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();
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
					const parent = page
						.getByRole( 'button', { name: 'Edit Parent' } )
						.locator( '..' );
					await expect( parent ).toContainText( 'None' );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Parent',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();
					await page
						.getByLabel( 'Parent', { exact: true } )
						.fill( 'Sample' );

					await page
						.getByRole( 'option', { name: 'Sample Page' } )
						.click();
				},
				assertEditedState: async ( page ) => {
					const parent = page
						.getByRole( 'button', { name: 'Edit Parent' } )
						.locator( '..' );
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
					const discussion = page
						.getByRole( 'button', {
							name: 'Edit Discussion',
						} )
						.locator( '..' );
					await expect( discussion ).toContainText( 'Closed' );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Discussion',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();
					await page
						.getByLabel( 'Open', {
							exact: true,
						} )
						.check();
				},
				assertEditedState: async ( page ) => {
					const discussion = page
						.getByRole( 'button', {
							name: 'Edit Discussion',
						} )
						.locator( '..' );
					await expect( discussion ).toContainText( 'Comments only' );
				},
			},
		};

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.setGutenbergExperiments( [
				'gutenberg-quick-edit-dataviews',
			] );
			// Create a test user for `author` field testing.
			await requestUtils.createUser( {
				username: 'testauthor',
				email: 'testauthor@example.com',
				firstName: 'Test',
				lastName: 'Author',
				password: '1',
				roles: [ 'author' ],
			} );
		} );

		test.beforeEach( async ( { admin, page } ) => {
			await admin.visitSiteEditor();
			await page.getByRole( 'button', { name: 'Pages' } ).click();
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

			// Trigger Quick Edit action on Privacy Policy row
			const row = page.getByRole( 'row', { name: /Privacy Policy/ } );
			await row.getByRole( 'button', { name: 'Quick Edit' } ).click();
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
			const { featuredImage, statusVisibility } = fields;
			await statusVisibility.performEdit( page );
			await featuredImage.performEdit( page );

			// Click Done to save changes (modal saves directly)
			await page.getByRole( 'button', { name: 'Done' } ).click();

			// Wait for modal to close and verify changes in the table
			await expect(
				page.locator( '.dataviews-action-modal__quick-edit' )
			).toBeHidden();

			// Find the Privacy Policy row and verify updated values
			const row = page.getByRole( 'row', { name: /Privacy Policy/ } );
			const updatedStatus = row.getByRole( 'cell', { name: 'Private' } );
			await expect( updatedStatus ).toBeVisible();

			// Verify featured image placeholder is gone (image was set)
			const imagePlaceholder = row.locator(
				'.fields__media-edit-placeholder'
			);
			await expect( imagePlaceholder ).toBeHidden();

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
		// 		'.fields__media-edit-placeholder',
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
			await requestUtils.deleteAllUsers();
		} );
	} );
} );
