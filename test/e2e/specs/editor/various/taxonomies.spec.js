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

// Selected tags are rendered as chips, each with a remove button.
function getTagChip( page, name ) {
	return page.getByRole( 'button', { name: `Remove ${ name }` } );
}

async function createTag( page, name ) {
	await page.getByRole( 'combobox', { name: 'Add tag' } ).fill( name );
	await page.getByRole( 'option', { name: `Create: ${ name }` } ).click();
}

function getAssignedTags( page ) {
	return page.evaluate( () =>
		window.wp.data.select( 'core/editor' ).getEditedPostAttribute( 'tags' )
	);
}

// Lets other tag requests through, so the handler only deals with creates.
async function routeTagCreateRequests( page, handler ) {
	await page.route( '**/wp/v2/tags**', async ( route ) => {
		if ( route.request().method() !== 'POST' ) {
			await route.continue();
			return;
		}

		await handler( route );
	} );
}

async function failRequest( route ) {
	await route.fulfill( {
		status: 500,
		contentType: 'application/json',
		body: JSON.stringify( {
			code: 'internal_server_error',
			message: 'The tag could not be created.',
		} ),
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
		const tagChip = getTagChip( page, tagName );

		await createTag( page, tagName );
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
		const tagChip = getTagChip( page, tagName );

		await createTag( page, tagName );
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
		await routeTagCreateRequests( page, async ( route ) => {
			await heldCreateRequest;
			await failRequest( route );
		} );

		const tagName = 'tag-' + generateRandomNumber();
		const tagChip = getTagChip( page, tagName );

		await createTag( page, tagName );

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
		await routeTagCreateRequests( page, async ( route ) => {
			await heldCreateRequest;
			await route.continue();
		} );

		const tagName = 'tag-' + generateRandomNumber();
		const tagChip = getTagChip( page, tagName );

		await createTag( page, tagName );
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

	test( 'should assign a tag created again when the removed attempt fails', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		// Hold both create requests, so the first one fails while the second
		// one is still in flight.
		const heldFirstCreateRequest = defer();
		const heldSecondCreateRequest = defer();
		let createRequestCount = 0;
		await routeTagCreateRequests( page, async ( route ) => {
			createRequestCount++;
			if ( createRequestCount === 1 ) {
				await heldFirstCreateRequest;
				await failRequest( route );
				return;
			}

			await heldSecondCreateRequest;
			await route.continue();
		} );

		const tagName = 'tag-' + generateRandomNumber();
		const tagChip = getTagChip( page, tagName );

		await createTag( page, tagName );
		await expect( tagChip ).toBeVisible();

		await tagChip.click();
		await expect( tagChip ).toBeHidden();

		// The earlier search is cached, so the tag can be created again while
		// the first request is still in flight.
		await createTag( page, tagName );
		await expect( tagChip ).toBeVisible();

		heldFirstCreateRequest.resolve();
		await expect( page.getByTestId( 'snackbar' ) ).toContainText(
			'The tag could not be created.'
		);
		await expect( tagChip ).toBeVisible();

		const createResponse = page.waitForResponse(
			( response ) =>
				response.request().method() === 'POST' &&
				/\/wp\/v2\/tags/.test( response.url() ) &&
				response.ok()
		);
		heldSecondCreateRequest.resolve();
		const { id: tagId } = await ( await createResponse ).json();

		await expect.poll( () => getAssignedTags( page ) ).toEqual( [ tagId ] );

		await editor.canvas
			.getByRole( 'textbox', { name: 'Add title' } )
			.fill( 'Hello World' );
		const postId = await editor.publishPost();

		await expect( tagChip ).toBeVisible();

		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( post.tags ).toEqual( [ tagId ] );
	} );

	test( 'should assign every tag created in succession', async ( {
		editor,
		page,
		requestUtils,
	} ) => {
		await openTaxonomyPanel( page, 'Tags' );

		const firstTagName = 'tag-a-' + generateRandomNumber();
		const secondTagName = 'tag-b-' + generateRandomNumber();
		const firstTagChip = getTagChip( page, firstTagName );
		const secondTagChip = getTagChip( page, secondTagName );

		await createTag( page, firstTagName );
		await expect( firstTagChip ).toBeVisible();

		await createTag( page, secondTagName );
		await expect( secondTagChip ).toBeVisible();

		// Neither tag is dropped by the one created after it. The chips are
		// shown before the tags exist, so the assignment is what to wait for:
		// it only happens once a create request resolves.
		await expect.poll( () => getAssignedTags( page ) ).toHaveLength( 2 );
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
