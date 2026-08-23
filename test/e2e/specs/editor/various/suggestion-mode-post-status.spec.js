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

const REFUSED_STATUS_MESSAGE =
	"The post status can't be changed while suggesting. Switch to Editing to change it.";

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
		const statusToggle = settings.locator( '.editor-post-status__toggle' );
		await expect( statusToggle ).toBeDisabled();
		// The status stays the accessible name so it is still announced; the
		// reason rides along as the description.
		await expect( statusToggle ).toHaveAccessibleName( 'Draft' );
		await expect( statusToggle ).toHaveAccessibleDescription(
			DISABLED_STATUS_LABEL
		);
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

		/*
		 * The whole call is dropped, not just the locked key: a status edit
		 * travels with companions derived from it - `PostVisibility` pairs it
		 * with `password`, scheduling with `date` - and applying those while
		 * withholding the status leaves a state nobody asked for.
		 */
		const excerpt = await page.evaluate( () =>
			window.wp.data
				.select( 'core/editor' )
				.getEditedPostAttribute( 'excerpt' )
		);
		expect( excerpt ).toBe( '' );
	} );

	test( 'the publish button refuses to publish while suggesting', async ( {
		page,
		requestUtils,
	} ) => {
		const publishButton = page
			.getByRole( 'region', { name: 'Editor top bar' } )
			.getByRole( 'button', { name: 'Publish', exact: true } );

		await expect( publishButton ).toHaveAttribute(
			'aria-disabled',
			'false'
		);

		await switchIntent( page, 'Suggesting' );

		/*
		 * `editPost` drops the status, but the button doesn't stop there: it
		 * calls `savePost()` next, which would write the post to the server as
		 * a draft while the pre-publish flow waits for a state change that
		 * never comes.
		 */
		await expect( publishButton ).toHaveAttribute(
			'aria-disabled',
			'true'
		);

		// Playwright treats `aria-disabled` as not enabled and would refuse a
		// normal click, but the point of the test is that a click reaching the
		// button still does nothing.
		await publishButton.dispatchEvent( 'click' );

		await expect(
			page.getByRole( 'region', { name: 'Editor publish' } )
		).toBeHidden();
		expect( await getEditedStatus( page ) ).toBe( 'draft' );

		const post = await requestUtils.rest( {
			path: `/wp/v2/posts/${ postId }`,
		} );
		expect( post.status ).toBe( 'draft' );
	} );

	test( 'the refusal is visible, not only announced', async ( { page } ) => {
		await switchIntent( page, 'Suggesting' );

		await page.evaluate( () =>
			window.wp.data
				.dispatch( 'core/editor' )
				.editPost( { status: 'pending' } )
		);

		// A refusal only screen reader users perceive is indistinguishable
		// from a control that quietly does nothing, so check both channels.
		await expect(
			page
				.getByTestId( 'snackbar' )
				.filter( { hasText: REFUSED_STATUS_MESSAGE } )
		).toBeVisible();
		await expect( page.locator( '#a11y-speak-assertive' ) ).toContainText(
			REFUSED_STATUS_MESSAGE
		);
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
