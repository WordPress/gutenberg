const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

test.describe( 'Editing an unsaved Navigation menu (@firefox, @webkit)', () => {
	test.beforeEach( async ( { admin, editor, page } ) => {
		await admin.createNewPost();
		await editor.insertBlock( {
			name: 'core/navigation',
			innerBlocks: [
				{
					name: 'core/navigation-link',
					attributes: {
						label: 'Home',
						kind: 'custom',
						type: 'custom',
						url: 'https://example.com/',
					},
				},
			],
		} );
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Custom Link',
			} )
		);
		await editor.openDocumentSettingsSidebar();
		await page
			.getByRole( 'textbox', { name: 'Description', exact: true } )
			.click();
	} );

	test.afterEach( async ( { requestUtils } ) => {
		await requestUtils.deleteAllMenus();
	} );

	test( 'keeps the Description field focused while creating the menu', async ( {
		editor,
		page,
	} ) => {
		const description = page.getByRole( 'textbox', {
			name: 'Description',
			exact: true,
		} );
		const selectedBefore = await page.evaluate( () =>
			window.wp.data
				.select( 'core/block-editor' )
				.getSelectedBlockClientId()
		);
		await page.keyboard.type( 'A' );
		await expect
			.poll(
				async () => ( await editor.getBlocks() )[ 0 ].attributes.ref,
				{ timeout: 30000 }
			)
			.toBeTruthy();
		await expect( description ).toBeFocused();
		expect(
			await page.evaluate( () =>
				window.wp.data
					.select( 'core/block-editor' )
					.getSelectedBlockClientId()
			)
		).toBe( selectedBefore );
		await page.keyboard.type( ' useful description' );
		await expect( description ).toHaveValue( 'A useful description' );
		await page.getByRole( 'button', { name: 'Undo', exact: true } ).click();
		await expect( description ).toHaveValue( 'A' );
		await page.getByRole( 'button', { name: 'Redo', exact: true } ).click();
		await expect( description ).toHaveValue( 'A useful description' );
	} );

	test( 'preserves edits made during creation when the menu is saved and reopened', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		const description = page.getByRole( 'textbox', {
			name: 'Description',
			exact: true,
		} );
		let releaseCreation;
		const creationGate = new Promise( ( resolve ) => {
			releaseCreation = resolve;
		} );
		let creations = 0;
		await page.route(
			/\/wp-json\/wp\/v2\/navigation\?/,
			async ( route ) => {
				if ( route.request().method() === 'POST' ) {
					creations++;
					await creationGate;
				}
				await route.continue();
			}
		);
		const creationRequest = page.waitForRequest(
			( request ) =>
				request.method() === 'POST' &&
				/\/wp-json\/wp\/v2\/navigation\?/.test( request.url() )
		);
		try {
			await page.keyboard.type( 'A' );
			await creationRequest;
			await expect( description ).toBeFocused();
			await page.keyboard.type( ' useful description' );
		} finally {
			releaseCreation();
		}
		await expect
			.poll(
				async () => ( await editor.getBlocks() )[ 0 ].attributes.ref,
				{ timeout: 30000 }
			)
			.toBeTruthy();
		await expect( description ).toBeFocused();
		await expect( description ).toHaveValue( 'A useful description' );
		const menuId = ( await editor.getBlocks() )[ 0 ].attributes.ref;
		await editor.publishPost();
		const menu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menuId }`,
			data: { context: 'edit' },
		} );
		expect( menu.content.raw ).toContain(
			'"description":"A useful description"'
		);
		expect( creations ).toBe( 1 );
		await page.reload();
		await editor.selectBlocks(
			editor.canvas.getByRole( 'document', {
				name: 'Block: Custom Link',
			} )
		);
		await editor.openDocumentSettingsSidebar();
		await expect( description ).toHaveValue( 'A useful description' );
	} );

	test( 'keeps editing while the newly created menu is being resolved', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		let releaseResolution;
		const resolutionGate = new Promise( ( resolve ) => {
			releaseResolution = resolve;
		} );
		let resolutions = 0;
		await page.route(
			/\/wp-json\/wp\/v2\/navigation\/\d+\?/,
			async ( route ) => {
				if ( route.request().method() === 'GET' ) {
					resolutions++;
					await resolutionGate;
				}
				await route.continue();
			}
		);
		const description = page.getByRole( 'textbox', {
			name: 'Description',
			exact: true,
		} );
		try {
			await page.keyboard.type( 'A' );
			await expect
				.poll( () => resolutions, { timeout: 30000 } )
				.toBe( 1 );
			await expect( description ).toBeFocused();
			await page.keyboard.type( ' later edit' );
		} finally {
			releaseResolution();
		}
		await editor.publishPost();
		const menuId = ( await editor.getBlocks() )[ 0 ].attributes.ref;
		const menu = await requestUtils.rest( {
			path: `/wp/v2/navigation/${ menuId }`,
			data: { context: 'edit' },
		} );
		expect( menu.content.raw ).toContain( '"description":"A later edit"' );
	} );

	test( 'keeps edits after a failed creation and retries on the next edit', async ( {
		editor,
		page,
	} ) => {
		let creations = 0;
		await page.route(
			/\/wp-json\/wp\/v2\/navigation\?/,
			async ( route ) => {
				if (
					route.request().method() === 'POST' &&
					++creations === 1
				) {
					await route.fulfill( {
						status: 503,
						json: {
							code: 'test_unavailable',
							message: 'Temporarily unavailable',
							data: { status: 503 },
						},
					} );
					return;
				}
				await route.continue();
			}
		);
		const description = page.getByRole( 'textbox', {
			name: 'Description',
			exact: true,
		} );
		await page.keyboard.type( 'A' );
		await expect(
			page
				.getByText( 'Failed to create Navigation Menu.', {
					exact: true,
				} )
				.first()
		).toBeVisible( { timeout: 30000 } );
		await expect( description ).toBeFocused();
		await expect( description ).toHaveValue( 'A' );
		await page.keyboard.type( ' retry' );
		await expect
			.poll(
				async () => ( await editor.getBlocks() )[ 0 ].attributes.ref,
				{ timeout: 30000 }
			)
			.toBeTruthy();
		await expect( description ).toBeFocused();
		await expect( description ).toHaveValue( 'A retry' );
		expect( creations ).toBe( 2 );
	} );
} );
