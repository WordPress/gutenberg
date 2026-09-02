const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

function generateRandomNumber() {
	return Math.round( 1 + Math.random() * ( Number.MAX_SAFE_INTEGER - 1 ) );
}

function defer() {
	let resolve;
	const deferred = new Promise( ( res ) => {
		resolve = res;
	} );
	deferred.resolve = resolve;
	return deferred;
}

async function openTaxonomyPanel( page, name ) {
	await test.step( `open the ${ name } panel`, async () => {
		const panelToggle = page.getByRole( 'button', { name } );

		if (
			( await panelToggle.getAttribute( 'aria-expanded' ) ) === 'false'
		) {
			await panelToggle.click();
		}
	} );
}

test.describe( 'Taxonomies', () => {
	test.beforeEach( async ( { admin, editor } ) => {
		await admin.createNewPost();
		await editor.openDocumentSettingsSidebar();
	} );

	test( 'should be able to open the categories panel and create a new main category', async ( {
		editor,
		page,
	} ) => {
		await openTaxonomyPanel( page, 'Categories' );

		await page
			.getByRole( 'button', {
				name: 'Add Category',
				expanded: false,
			} )
			.click();
		await page
			.getByRole( 'textbox', { name: 'New Category Name' } )
			.fill( 'z rand category 1' );
		await page.keyboard.press( 'Enter' );

		const categories = page.getByRole( 'group', { name: 'Categories' } );
		const selectedCategories = categories.getByRole( 'checkbox', {
			checked: true,
		} );
		const newCategory = categories.getByRole( 'checkbox', {
			name: 'z rand category 1',
		} );

		await expect( selectedCategories ).toHaveCount( 1 );
		await expect( newCategory ).toBeChecked();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		// The category selection was persisted after the publish process.
		await expect( selectedCategories ).toHaveCount( 1 );
		await expect( newCategory ).toBeChecked();
	} );

	test( 'should be able to open the tags panel and create a new tag', async ( {
		editor,
		page,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		const tagName = 'tag-' + generateRandomNumber();
		// Selected tags are rendered as chips, each with a remove button.
		const tagChip = page.getByRole( 'button', {
			name: `Remove ${ tagName }`,
		} );

		await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( tagName );
		await page
			.getByRole( 'option', { name: `Create: ${ tagName }` } )
			.click();

		await expect( tagChip ).toBeVisible();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		await expect( tagChip ).toBeVisible();
	} );

	// See: https://github.com/WordPress/gutenberg/pull/21693.
	test( `should be able to create a new tag with ' on the name`, async ( {
		editor,
		page,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		const tagName = "tag'-" + generateRandomNumber();
		// The chip label is unescaped, so it matches the typed name.
		const tagChip = page.getByRole( 'button', {
			name: `Remove ${ tagName }`,
		} );

		await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( tagName );
		await page
			.getByRole( 'option', { name: `Create: ${ tagName }` } )
			.click();

		await expect( tagChip ).toBeVisible();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		await editor.publishPost();
		await page.reload();

		await expect( tagChip ).toBeVisible();
	} );

	test( 'should show a new tag while it is being created and remove it when the request fails', async ( {
		page,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		// Hold the create request so the tag can be checked while it is still
		// in flight, then fail it.
		const heldCreateRequest = defer();
		await page.route( '**/wp/v2/tags**', async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				await route.continue();
				return;
			}

			await heldCreateRequest;
			await route.fulfill( {
				status: 500,
				contentType: 'application/json',
				body: JSON.stringify( {
					code: 'internal_server_error',
					message: 'The tag could not be created.',
				} ),
			} );
		} );

		const tagName = 'tag-' + generateRandomNumber();
		const tagChip = page.getByRole( 'button', {
			name: `Remove ${ tagName }`,
		} );

		await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( tagName );
		await page
			.getByRole( 'option', { name: `Create: ${ tagName }` } )
			.click();

		// The tag shows before the request resolves.
		await expect( tagChip ).toBeVisible();

		heldCreateRequest.resolve();

		await expect( tagChip ).toBeHidden();
		await expect( page.getByTestId( 'snackbar' ) ).toContainText(
			'The tag could not be created.'
		);
	} );

	test( 'should not assign a tag that was removed while it was being created', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		// Hold the create request so the tag can be removed while it is still
		// in flight.
		const heldCreateRequest = defer();
		await page.route( '**/wp/v2/tags**', async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				await route.continue();
				return;
			}

			await heldCreateRequest;
			await route.continue();
		} );

		const tagName = 'tag-' + generateRandomNumber();
		const tagChip = page.getByRole( 'button', {
			name: `Remove ${ tagName }`,
		} );

		await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( tagName );
		await page
			.getByRole( 'option', { name: `Create: ${ tagName }` } )
			.click();

		await expect( tagChip ).toBeVisible();

		await tagChip.click();
		await expect( tagChip ).toBeHidden();

		const createResponse = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				/\/wp\/v2\/tags/.test( response.url() )
		);
		heldCreateRequest.resolve();
		await createResponse;

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		const postId = await editor.publishPost();

		// The created tag is not assigned back to the post.
		await expect( tagChip ).toBeHidden();

		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( post.tags ).toEqual( [] );
	} );

	test( 'should assign every tag created in quick succession', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		// Hold the first create request so the second one resolves while the
		// first tag is still being created.
		const heldCreateRequest = defer();
		let createRequestCount = 0;
		await page.route( '**/wp/v2/tags**', async ( route ) => {
			if ( route.request().method() !== 'POST' ) {
				await route.continue();
				return;
			}

			createRequestCount += 1;
			if ( createRequestCount === 1 ) {
				await heldCreateRequest;
			}

			await route.continue();
		} );

		const isCreateResponse = ( response ) =>
			response.request().method() === 'POST' &&
			/\/wp\/v2\/tags/.test( response.url() );

		const firstTagName = 'tag-a-' + generateRandomNumber();
		const secondTagName = 'tag-b-' + generateRandomNumber();
		const firstTagChip = page.getByRole( 'button', {
			name: `Remove ${ firstTagName }`,
		} );
		const secondTagChip = page.getByRole( 'button', {
			name: `Remove ${ secondTagName }`,
		} );
		const tagsCombobox = page.getByRole( 'combobox', { name: 'Add tag' } );

		await tagsCombobox.fill( firstTagName );
		await page
			.getByRole( 'option', { name: `Create: ${ firstTagName }` } )
			.click();
		await expect( firstTagChip ).toBeVisible();

		const secondCreateResponse = page.waitForResponse( isCreateResponse );
		await tagsCombobox.fill( secondTagName );
		await page
			.getByRole( 'option', { name: `Create: ${ secondTagName }` } )
			.click();
		await expect( secondTagChip ).toBeVisible();
		await secondCreateResponse;

		const firstCreateResponse = page.waitForResponse( isCreateResponse );
		heldCreateRequest.resolve();
		await firstCreateResponse;

		// Neither tag is dropped by the one that resolved after it. The chips
		// are shown before the tags exist, so the assignment is what to wait
		// for: it only happens once a create request resolves.
		await expect
			.poll( () =>
				page.evaluate( () =>
					window.wp.data
						.select( 'core/editor' )
						.getEditedPostAttribute( 'tags' )
				)
			)
			.toHaveLength( 2 );
		await expect( firstTagChip ).toBeVisible();
		await expect( secondTagChip ).toBeVisible();

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		const postId = await editor.publishPost();

		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( post.tags ).toHaveLength( 2 );
	} );
} );
