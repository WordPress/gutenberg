/**
 * E2E coverage for the post status lock in Suggest mode (#73411, F-15).
 *
 * Post status is the one post-level field that carries editorial authority:
 * moving a post from `draft` to `pending` (or to `publish`) advances it through
 * the workflow. The suggestion layer has nowhere to hold that as a pending
 * proposal, so Suggesting shows the status without offering to change it, and
 * the `editPost` action refuses the field for every path that doesn't go
 * through the sidebar control.
 */
const { test, expect } = require( '@wordpress/e2e-test-utils-playwright' );

const DISABLED_STATUS_LABEL =
	'The post status cannot be suggested. Switch to Editing to change it.';

async function switchIntent( page, intentLabel ) {
	await page
		.getByRole( 'region', { name: 'Editor top bar' } )
		.getByRole( 'button', { name: 'Options' } )
		.click();
	const menuItem = page.getByRole( 'menuitemradio', {
		name: new RegExp( `^${ intentLabel }` ),
	} );
	await menuItem.waitFor( { state: 'visible', timeout: 10000 } );
	await menuItem.click();
	// `MenuItemsChoice` doesn't auto-close its dropdown on selection, so
	// leaving the menu open would make a subsequent `Options` click toggle
	// it closed instead of reopening it.
	await page.keyboard.press( 'Escape' );
}

function getEditedStatus( page ) {
	return page.evaluate( () =>
		window.wp.data
			.select( 'core/editor' )
			.getEditedPostAttribute( 'status' )
	);
}

test.describe( 'Suggestion mode post status', () => {
	let postId;

	test.beforeAll( async ( { requestUtils } ) => {
		await requestUtils.setGutenbergExperiments( [
			'gutenberg-suggestion-mode',
		] );
	} );

	test.beforeEach( async ( { admin, requestUtils } ) => {
		const post = await requestUtils.createPost( {
			title: 'Suggest mode post status',
			content: '<!-- wp:paragraph --><p>Body</p><!-- /wp:paragraph -->',
			status: 'draft',
		} );
		postId = post.id;
		await admin.editPost( postId );
	} );

	test.afterAll( async ( { requestUtils } ) => {
		await requestUtils.deleteAllComments( 'note' );
		await requestUtils.deleteAllPosts();
		await requestUtils.setGutenbergExperiments( [] );
	} );

	test( 'the status control cannot be changed while suggesting', async ( {
		editor,
		page,
	} ) => {
		await editor.openDocumentSettingsSidebar();
		const settings = page.getByRole( 'region', {
			name: 'Editor settings',
		} );

		// Editing intent: the status control is a working dropdown toggle.
		await expect(
			settings.getByRole( 'button', { name: /^Change status:/ } )
		).toBeEnabled();

		await switchIntent( page, 'Suggesting' );

		// Suggesting intent: the control shows the status but refuses to
		// change it, and explains where to change it instead.
		await expect(
			settings.getByRole( 'button', { name: /^Change status:/ } )
		).toBeHidden();
		await expect(
			settings.getByRole( 'button', { name: DISABLED_STATUS_LABEL } )
		).toBeDisabled();
	} );

	test( 'a status edit dispatched while suggesting is refused', async ( {
		page,
	} ) => {
		await switchIntent( page, 'Suggesting' );

		expect( await getEditedStatus( page ) ).toBe( 'draft' );

		// The publish button, "Switch to draft" and the command palette all
		// reach the post through `editPost`, so exercise that action directly.
		await page.evaluate( () =>
			window.wp.data.dispatch( 'core/editor' ).editPost( {
				status: 'pending',
				excerpt: 'A suggested excerpt',
			} )
		);

		expect( await getEditedStatus( page ) ).toBe( 'draft' );

		// The rest of the same call still lands: only the locked field is
		// dropped.
		const excerpt = await page.evaluate( () =>
			window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'excerpt' )
		);
		expect( excerpt ).toBe( 'A suggested excerpt' );
	} );

	test( 'a status edit still applies in the Editing intent', async ( {
		page,
	} ) => {
		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/editor' )
				.editPost( { status: 'pending' } )
		);

		expect( await getEditedStatus( page ) ).toBe( 'pending' );
	} );
} );
