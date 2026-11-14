const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );
const { setPublishDate } = require( '../editor/various/post-summary/utils' );

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

	test.beforeEach( async ( { admin } ) => {
		// Go to the pages page, as it has the list layout enabled by default.
		await admin.visitSiteEditor( { postType: 'page' } );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		// Go back to the default theme.
		await Promise.all( [
			requestUtils.activateTheme( 'twentytwentyone' ),
			requestUtils.deleteAllPages(),
			requestUtils.deleteAllMedia(),
		] );
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
						name: 'Set featured image',
					} );
					await placeholder.click();
					const mediaLibrary = page.getByRole( 'dialog', {
						name: 'Featured image',
					} );
					const TEST_IMAGE_FILE_PATH =
						'./assets/10x10_e2e_test_image_z9T8jK.png';

					// The media modal opens on the "Media Library" tab once
					// the library has items (e.g. after a previous upload),
					// so make sure the upload tab is the active one.
					await mediaLibrary
						.getByRole( 'tab', { name: 'Upload files' } )
						.click();

					const selectFiles =
						mediaLibrary.getByText( 'Select files' );
					const fileChooserPromise =
						page.waitForEvent( 'filechooser' );
					await selectFiles.click();
					const fileChooser = await fileChooserPromise;
					await fileChooser.setFiles( TEST_IMAGE_FILE_PATH );
					await mediaLibrary
						.locator( '.media-frame-toolbar' )
						.waitFor( {
							state: 'hidden',
						} );

					await mediaLibrary
						.getByRole( 'button', {
							name: 'Set featured image',
							exact: true,
						} )
						.click();
				},
				assertInitialState: async ( page ) => {
					const el = page.getByText( 'Set featured image' );
					const placeholder = page.getByRole( 'button', {
						name: 'Set featured image',
					} );
					await expect( el ).toBeVisible();
					await expect( placeholder ).toBeVisible();
				},
				assertEditedState: async ( page ) => {
					const placeholder = page.getByRole( 'button', {
						name: 'Set featured image',
					} );
					await expect( placeholder ).toBeHidden();
					const img = page.locator( '.media-edit__thumbnail' );
					await expect( img ).toBeVisible();
				},
			},
			statusVisibility: {
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Status',
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
							name: 'Edit Status',
						} )
						.locator( '..' );
					await expect( statusAndVisibility ).toContainText(
						'Published'
					);
				},
				assertEditedState: async ( page ) => {
					const statusAndVisibility = page
						.getByRole( 'button', {
							name: 'Edit Status',
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

					// A recent date reads as "Today at 10:28 am" or "November
					// 3 10:28 am", without the year, but always has the time.
					await expect( dateEl ).toContainText( /\d{1,2}:\d{2}/ );
				},
				performEdit: async ( page ) => {
					const editButton = page.getByRole( 'button', {
						name: 'Edit Date',
					} );
					await editButton.locator( '..' ).hover();
					await editButton.click();

					// Increment the year in the date and time picker.
					const yearInput = page.getByRole( 'spinbutton', {
						name: 'Year',
					} );
					await expect( yearInput ).not.toHaveValue( '' );
					const currentYear = Number( await yearInput.inputValue() );
					await yearInput.fill( String( currentYear + 1 ) );
					await yearInput.press( 'Enter' );
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
							// The permalink preview, on whatever host the
							// test site runs.
							name: /^https?:\/\/[^/]+\//,
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
						.getByRole( 'combobox', {
							name: 'Parent',
							exact: true,
						} )
						.fill( 'Sample' );

					await page
						.getByRole( 'option', { name: 'Sample Page' } )
						.first()
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
			await admin.visitSiteEditor( { postType: 'page' } );
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

			// Trigger Quick Edit action on Privacy Policy row.
			const row = page
				.getByRole( 'row', {
					name: /Privacy Policy/,
				} )
				.filter( {
					// Targets newly created pages which are published by default.
					has: page.getByRole( 'cell', { name: 'Published' } ),
				} );
			await row.getByRole( 'button', { name: 'Quick edit' } ).click();
			await expect(
				page.getByRole( 'dialog', { name: 'Quick edit', exact: true } )
			).toHaveAttribute( 'data-wp-ui-overlay-modal', '' );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.deleteAllUsers();
		} );

		test( 'should initialize, edit, and update featuredImage field correctly', async ( {
			page,
		} ) => {
			await fields.featuredImage.assertInitialState( page );
			const placeholder = page.getByRole( 'button', {
				name: 'Set featured image',
			} );
			const mediaLibrary = page.getByRole( 'dialog', {
				name: 'Featured image',
			} );
			await placeholder.click();

			await expect( mediaLibrary ).toBeVisible();
			await page.evaluate( () => {
				window.mediaEscapeCount = 0;
				window.wp.media.frame.on(
					'escape',
					() => window.mediaEscapeCount++
				);
			} );
			await page.keyboard.press( 'Escape' );
			await expect( mediaLibrary ).toBeHidden();
			await expect( placeholder ).toBeFocused();
			await page.keyboard.press( 'Enter' );
			await expect( mediaLibrary ).toBeVisible();
			await expect
				.poll( () => page.evaluate( () => window.mediaEscapeCount ) )
				.toBe( 1 );
			await page.evaluate( () => {
				window.mediaEscapeCount = 0;
				window.wp.media.frame.on(
					'escape',
					() => window.mediaEscapeCount++
				);
			} );
			await mediaLibrary
				.getByRole( 'button', {
					name: 'Close',
					exact: true,
				} )
				.click();
			await expect( mediaLibrary ).toBeHidden();
			await expect
				.poll( () => page.evaluate( () => window.mediaEscapeCount ) )
				.toBe( 1 );
			await page.evaluate( () => {
				window.wp.media.frame.open();
			} );
			await expect( mediaLibrary ).toBeVisible();

			await mediaLibrary
				.getByRole( 'button', {
					name: 'Close',
					exact: true,
				} )
				.click();
			await expect( mediaLibrary ).toBeHidden();
			await fields.featuredImage.performEdit( page );
			await fields.featuredImage.assertEditedState( page );
		} );

		Object.entries( fields )
			.filter( ( [ key ] ) => key !== 'featuredImage' )
			.forEach(
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
				page.getByRole( 'dialog', { name: /^(Quick edit|Bulk edit)$/ } )
			).toBeHidden();

			// Find the Privacy Policy row and verify updated values
			const row = page.getByRole( 'row', { name: /Privacy Policy/ } );
			const updatedStatus = row.getByRole( 'cell', { name: 'Private' } );
			await expect( updatedStatus ).toBeVisible();

			// Verify featured image placeholder is gone (image was set)
			const imagePlaceholder = row.locator( '.media-edit__placeholder' );
			await expect( imagePlaceholder ).toBeHidden();

			// Reset the page to its original state
			await requestUtils.deleteAllPages();
			await createPages( requestUtils );
		} );

		test( 'waits for saving before closing', async ( {
			page,
			requestUtils,
		} ) => {
			const quickEditUrl = page.url();
			await page.getByRole( 'button', { name: 'Edit Status' } ).click();
			await page
				.getByRole( 'radio', { name: 'Draft', exact: true } )
				.check();
			await page.keyboard.press( 'Escape' );

			let releaseSave;
			const saveGate = new Promise( ( resolve ) => {
				releaseSave = resolve;
			} );
			let saveStarted;
			const saving = new Promise( ( resolve ) => {
				saveStarted = resolve;
			} );
			await page.route( '**/wp/v2/pages/*', async ( route ) => {
				if ( route.request().method() !== 'POST' ) {
					await route.continue();
					return;
				}
				saveStarted();
				await saveGate;
				await route.continue();
			} );

			const saved = page.waitForResponse(
				( response ) =>
					response.url().includes( '/wp/v2/pages/' ) &&
					response.request().method() === 'POST'
			);
			try {
				await page
					.getByRole( 'button', { name: 'Done', exact: true } )
					.click();
				await saving;
				await expect( page ).toHaveURL( quickEditUrl );
				await expect(
					page.getByRole( 'dialog', {
						name: 'Quick edit',
						exact: true,
					} )
				).toBeVisible();
			} finally {
				releaseSave();
			}
			await expect(
				page.getByRole( 'dialog', { name: 'Quick edit', exact: true } )
			).toBeHidden();
			await expect(
				page
					.getByRole( 'row', { name: /Privacy Policy/ } )
					.getByRole( 'cell', { name: 'Draft', exact: true } )
			).toBeVisible();
			const record = await ( await saved ).json();
			await requestUtils.rest( {
				path: `/wp/v2/pages/${ record.id }`,
				method: 'POST',
				data: { status: 'publish' },
			} );
		} );

		test( 'discards unsaved edits when reopened', async ( { page } ) => {
			await page.emulateMedia( { reducedMotion: 'no-preference' } );
			const dialog = page.getByRole( 'dialog', {
				name: 'Quick edit',
				exact: true,
			} );
			await dialog.getByRole( 'button', { name: 'Edit Status' } ).click();
			await page
				.getByRole( 'radio', { name: 'Draft', exact: true } )
				.check();
			await page.keyboard.press( 'Escape' );
			const reopening = page.evaluate(
				() =>
					new Promise( ( resolve ) => {
						const modal = document.querySelector(
							'[data-wp-ui-overlay-modal]'
						);
						const observer = new MutationObserver( () => {
							if ( modal.hasAttribute( 'data-ending-style' ) ) {
								observer.disconnect();
								// Browser Back reopens the same selection during the exit animation.
								window.history.back();
								resolve( modal.isConnected );
							}
						} );
						observer.observe( modal, { attributes: true } );
					} )
			);
			await dialog
				.getByRole( 'button', { name: 'Cancel', exact: true } )
				.click();
			expect( await reopening ).toBe( true );
			await dialog.getByRole( 'button', { name: 'Edit Status' } ).click();
			await expect(
				page.getByRole( 'radio', { name: 'Published', exact: true } )
			).toBeChecked();
			await expect(
				page.getByRole( 'radio', { name: 'Draft', exact: true } )
			).not.toBeChecked();
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
		// 		'.media-edit__placeholder',
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

		test.describe( 'Field trigger', () => {
			const getStatusField = async ( page ) => {
				const editButton = page.getByRole( 'button', {
					name: 'Edit Status',
				} );
				const row = editButton.locator( '..' );
				// The raw mouse clicks below use the row's bounding box, so
				// wait for it to stop moving first — the extensible site
				// editor's quick edit surface animates in.
				await row.hover();
				return { editButton, row };
			};

			test( 'opens the flyout when clicking anywhere on the row', async ( {
				page,
			} ) => {
				const { editButton, row } = await getStatusField( page );
				const box = await row.boundingBox();

				// Click the value area, away from the edit button.
				await page.mouse.click(
					box.x + box.width * 0.5,
					box.y + box.height / 2
				);

				await expect(
					page.getByRole( 'radio', { name: 'Draft' } )
				).toBeVisible();
				await expect( editButton ).toHaveAttribute(
					'aria-expanded',
					'true'
				);
			} );

			test( 'returns focus to the edit button when the flyout is dismissed', async ( {
				page,
			} ) => {
				const { editButton, row } = await getStatusField( page );
				const box = await row.boundingBox();
				await page.mouse.click(
					box.x + box.width * 0.5,
					box.y + box.height / 2
				);
				await expect(
					page.getByRole( 'radio', { name: 'Draft' } )
				).toBeVisible();

				await page.keyboard.press( 'Escape' );

				await expect(
					page.getByRole( 'radio', { name: 'Draft' } )
				).toBeHidden();
				await expect( editButton ).toBeFocused();

				// Focus landing back on the trigger is what lets the field be
				// reopened from the keyboard.
				await page.keyboard.press( 'Enter' );
				await expect(
					page.getByRole( 'radio', { name: 'Draft' } )
				).toBeVisible();
			} );

			test( 'keeps the flyout usable after double-clicking a field row', async ( {
				page,
			} ) => {
				const { row } = await getStatusField( page );
				const box = await row.boundingBox();
				const x = box.x + box.width * 0.5;
				const y = box.y + box.height / 2;

				// A double click used to leave a text selection behind, which
				// made every later click on a row a no-op. See #79348. It now
				// toggles the flyout twice, leaving it closed.
				await page.mouse.dblclick( x, y );
				await expect(
					page.getByRole( 'radio', { name: 'Draft' } )
				).toBeHidden();

				const dateEditButton = page.getByRole( 'button', {
					name: 'Edit Date',
				} );
				await dateEditButton.click();

				await expect( dateEditButton ).toHaveAttribute(
					'aria-expanded',
					'true'
				);
			} );
		} );
	} );

	test.describe( 'Bulk Quick Edit', () => {
		test( 'keeps bulk-editable fields accessible after table sorting', async ( {
			page,
		} ) => {
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

			const table = page.getByRole( 'table' );
			await page.getByRole( 'button', { name: 'View options' } ).click();
			await page.getByRole( 'combobox', { name: 'Sort by' } ).click();
			await page
				.getByRole( 'option', { name: 'Title', exact: true } )
				.click();
			await page.keyboard.press( 'Escape' );
			await table.getByRole( 'checkbox', { name: 'Select all' } ).click();
			// The extensible site editor keeps the selection in the URL, so
			// the checkbox only flips once the route has re-rendered.
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Deselect all',
					exact: true,
				} )
			).toBeChecked();
			await page
				.getByRole( 'button', { name: 'Bulk edit', exact: true } )
				.click();

			const modal = page.getByRole( 'dialog', {
				name: /^(Quick edit|Bulk edit)$/,
			} );
			await expect( modal ).toContainText(
				'Changes will be applied to all selected pages.'
			);
			for ( const name of [
				'Edit Status',
				'Edit Date',
				'Edit Author',
				'Edit Discussion',
			] ) {
				await expect(
					modal.getByRole( 'button', { name } )
				).toBeVisible();
			}
			await modal.getByRole( 'button', { name: 'Edit Status' } ).click();
			const pending = page.getByRole( 'radio', {
				name: 'Pending Review',
			} );
			await pending.check();
			await expect( pending ).toBeChecked();
			await page.keyboard.press( 'Escape' );
			await expect(
				modal.getByRole( 'button', { name: 'Edit Status' } )
			).toBeFocused();
		} );

		test( 'keeps mobile grid selection visible and restores focus after cancelling', async ( {
			page,
		} ) => {
			await page.setViewportSize( { width: 390, height: 844 } );
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Grid' } ).click();
			await page.getByRole( 'checkbox', { name: 'Select all' } ).click();
			const selection = page.getByRole( 'checkbox', {
				name: 'Deselect all',
			} );
			await expect( selection ).toBeChecked();
			const toolbar = page.locator( '.dataviews-bulk-actions' );
			await toolbar.getByRole( 'button', { name: 'Actions' } ).click();
			await expect(
				page.getByRole( 'menuitem', { name: 'Bulk edit' } )
			).toBeVisible();
			await expect( selection ).toBeInViewport( { ratio: 1 } );
			await expect(
				toolbar.getByText( /items selected/ )
			).toBeInViewport( { ratio: 1 } );
			await page.keyboard.press( 'Escape' );
			await toolbar.getByRole( 'button', { name: 'Cancel' } ).click();
			await expect(
				page.getByRole( 'checkbox', {
					name: 'Select all',
					exact: true,
				} )
			).toBeFocused();
		} );
	} );

	test.describe( 'Quick Edit Date Timezone Consistency', () => {
		const PAGE_DATE_GMT = '2026-02-15T17:30:00';
		const PAGE_TITLE = 'Timezone Test Page';

		test.beforeAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				timezone: 'Etc/GMT+5',
			} );
			await requestUtils.createPage( {
				title: PAGE_TITLE,
				status: 'publish',
				date_gmt: PAGE_DATE_GMT,
			} );
		} );

		test.afterAll( async ( { requestUtils } ) => {
			await requestUtils.updateSiteSettings( {
				timezone: '',
			} );
			await requestUtils.deleteAllPages();
			await createPages( requestUtils );
		} );

		test( 'should display and edit dates in the WP timezone', async ( {
			admin,
			page,
		} ) => {
			await admin.visitSiteEditor( { postType: 'page' } );
			await page.getByRole( 'button', { name: 'Layout' } ).click();
			await page.getByRole( 'menuitemradio', { name: 'Table' } ).click();

			// Open Quick Edit for the timezone test page.
			const row = page.getByRole( 'row', {
				name: new RegExp( PAGE_TITLE ),
			} );
			await row.getByRole( 'button', { name: 'Quick edit' } ).click();

			// Open the date field for editing.
			const editButton = page.getByRole( 'button', {
				name: 'Edit Date',
			} );
			await editButton.locator( '..' ).hover();
			await editButton.click();

			const year = page.getByRole( 'spinbutton', { name: 'Year' } );
			const month = page.getByRole( 'combobox', { name: 'Month' } );
			const day = page.getByRole( 'spinbutton', { name: 'Day' } );
			const hours = page.getByRole( 'spinbutton', { name: 'Hours' } );
			const minutes = page.getByRole( 'spinbutton', {
				name: 'Minutes',
			} );
			const pm = page.getByRole( 'radio', { name: 'PM' } );

			// The picker should reflect the WP timezone (UTC-5), not the
			// browser/system timezone.
			await expect( year ).toHaveValue( '2026' );
			await expect( month ).toHaveValue( '02' );
			await expect( day ).toHaveValue( '15' );
			await expect( hours ).toHaveValue( '12' );
			await expect( minutes ).toHaveValue( '30' );
			await expect( pm ).toBeChecked();

			// Change only the date, preserving time.
			await setPublishDate( page, {
				year: 2026,
				month: 3,
				day: 20,
				hours: 12,
				minutes: 30,
			} );
			await expect( month ).toHaveValue( '03' );
			await expect( day ).toHaveValue( '20' );
			await expect( hours ).toHaveValue( '12' );
			await expect( minutes ).toHaveValue( '30' );

			// Change the time, verify it updates correctly.
			await setPublishDate( page, {
				year: 2026,
				month: 3,
				day: 20,
				hours: 9,
				minutes: 45,
			} );
			await expect( day ).toHaveValue( '20' );
			await expect( hours ).toHaveValue( '09' );
			await expect( minutes ).toHaveValue( '45' );
			await expect(
				page.getByRole( 'radio', { name: 'AM' } )
			).toBeChecked();
		} );
	} );
} );
